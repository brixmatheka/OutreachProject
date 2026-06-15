import express from "express";
import multer from "multer";
import fs from "node:fs";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dns from "node:dns";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Global dns.lookup override to ensure network requests (e.g. fetch) respect dns.setServers
// because Node.js's standard dns.lookup uses the OS resolver which might be broken/timeout.
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  } else if (typeof options === "number") {
    options = { family: options };
  } else if (!options) {
    options = {};
  }

  const family = options.family || 0;

  const attemptResolve = (host, fam) => {
    return new Promise((resolve, reject) => {
      if (fam === 6) {
        dns.resolve6(host, (err, addresses) => {
          if (err) reject(err);
          else resolve({ addresses, family: 6 });
        });
      } else if (fam === 4) {
        dns.resolve4(host, (err, addresses) => {
          if (err) reject(err);
          else resolve({ addresses, family: 4 });
        });
      } else {
        dns.resolve4(host, (err4, addresses4) => {
          if (!err4 && addresses4 && addresses4.length > 0) {
            resolve({ addresses: addresses4, family: 4 });
          } else {
            dns.resolve6(host, (err6, addresses6) => {
              if (!err6 && addresses6 && addresses6.length > 0) {
                resolve({ addresses: addresses6, family: 6 });
              } else {
                reject(err4 || err6 || new Error("Resolution failed"));
              }
            });
          }
        });
      }
    });
  };

  attemptResolve(hostname, family)
    .then(({ addresses, family: resolvedFamily }) => {
      if (options.all) {
        const result = addresses.map(addr => ({ address: addr, family: resolvedFamily }));
        return callback(null, result);
      } else {
        return callback(null, addresses[0], resolvedFamily);
      }
    })
    .catch(() => {
      return originalLookup(hostname, options, callback);
    });
};

import Event from "./models/Event.js";
import PrayerRequest from "./models/PrayerRequest.js";
import Transaction from "./models/Transaction.js";
import Project from "./models/Project.js";
import Member from "./models/Member.js";
import BaptismRequest from "./models/BaptismRequest.js";
import Media from "./models/Media.js";
import Minister from "./models/Minister.js";

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const isProduction = process.env.NODE_ENV === "production";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;
const MEMBER_JWT_SECRET = process.env.MEMBER_JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

const createErrorId = () =>
  `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const sensitiveLogKeys = [
  "password",
  "passwordhash",
  "token",
  "authorization",
  "secret",
  "email",
  "phone",
  "idno",
  "session",
  "receipt",
  "mpesa",
  "payment",
  "mongo",
  "uri",
  "passkey",
  "consumer"
];

function sanitizeLogMeta(meta) {
  if (!meta || typeof meta !== "object") return {};

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveLogKeys.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
        return [key, "[REDACTED]"];
      }
      if (value instanceof Error) {
        return [key, { name: value.name, code: value.code || "UNKNOWN" }];
      }
      return [key, value];
    })
  );
}

function writeLog(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeLogMeta(meta)
  };

  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

function logInfo(message, meta) {
  writeLog("info", message, meta);
}

function logWarn(message, meta) {
  writeLog("warn", message, meta);
}

function logError(message, err, meta = {}) {
  const errorId = createErrorId();
  writeLog("error", message, {
    errorId,
    errorName: err?.name || "Error",
    errorCode: err?.code || "UNKNOWN",
    ...meta
  });
  return errorId;
}

function handleServerError(res, err, message = "Server error") {
  const errorId = logError(message, err);
  return res.status(500).json({ message, errorId });
}

function requireConfigValue(name, value) {
  if (value) return;
  const message = `${name} is required`;
  if (isProduction) {
    throw new Error(message);
  }
  logWarn(message);
}

const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  TRANSACTIONS_ADMIN: "transactions_admin",
  EVENTS_ADMIN: "events_admin",
  MEDIA_PHOTOS_ADMIN: "media_photos_admin",
  CONTENT_ADMIN: "content_admin"
});

const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.TRANSACTIONS_ADMIN]: "Transactions Admin",
  [ROLES.EVENTS_ADMIN]: "Events Admin",
  [ROLES.MEDIA_PHOTOS_ADMIN]: "Media/Photos Admin",
  [ROLES.CONTENT_ADMIN]: "Content Admin"
});

const ADMIN_SECTION_ROLES = Object.freeze({
  dashboard: Object.values(ROLES),
  events: [ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN],
  transactions: [ROLES.SUPER_ADMIN, ROLES.TRANSACTIONS_ADMIN],
  media: [ROLES.SUPER_ADMIN, ROLES.MEDIA_PHOTOS_ADMIN],
  content: [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN],
  members: [ROLES.SUPER_ADMIN]
});

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.SUPER_ADMIN]: ["dashboard", "events", "transactions", "media", "content", "members"],
  [ROLES.TRANSACTIONS_ADMIN]: ["dashboard", "transactions"],
  [ROLES.EVENTS_ADMIN]: ["dashboard", "events"],
  [ROLES.MEDIA_PHOTOS_ADMIN]: ["dashboard", "media"],
  [ROLES.CONTENT_ADMIN]: ["dashboard", "content"]
});

const ROLE_ALIASES = Object.freeze({
  "super admin": ROLES.SUPER_ADMIN,
  super_admin: ROLES.SUPER_ADMIN,
  superadmin: ROLES.SUPER_ADMIN,
  "transactions admin": ROLES.TRANSACTIONS_ADMIN,
  transactions_admin: ROLES.TRANSACTIONS_ADMIN,
  transactions: ROLES.TRANSACTIONS_ADMIN,
  "events admin": ROLES.EVENTS_ADMIN,
  events_admin: ROLES.EVENTS_ADMIN,
  events: ROLES.EVENTS_ADMIN,
  "media/photos admin": ROLES.MEDIA_PHOTOS_ADMIN,
  "media photos admin": ROLES.MEDIA_PHOTOS_ADMIN,
  media_photos_admin: ROLES.MEDIA_PHOTOS_ADMIN,
  media_admin: ROLES.MEDIA_PHOTOS_ADMIN,
  media: ROLES.MEDIA_PHOTOS_ADMIN,
  photos: ROLES.MEDIA_PHOTOS_ADMIN,
  "content admin": ROLES.CONTENT_ADMIN,
  content_admin: ROLES.CONTENT_ADMIN,
  content: ROLES.CONTENT_ADMIN
});

function normalizeRole(role) {
  if (!role || typeof role !== "string") return null;
  return ROLE_ALIASES[role.trim().toLowerCase()] || null;
}

function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function parseAdminUsers() {
  const users = [];

  if (ADMIN_EMAIL && (ADMIN_PASSWORD || ADMIN_PASSWORD_HASH)) {
    users.push({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      passwordHash: ADMIN_PASSWORD_HASH,
      role: ROLES.SUPER_ADMIN,
      name: ROLE_LABELS[ROLES.SUPER_ADMIN]
    });
  }

  if (!process.env.ADMIN_USERS_JSON) {
    return users;
  }

  try {
    const parsedUsers = JSON.parse(process.env.ADMIN_USERS_JSON);
    if (!Array.isArray(parsedUsers)) {
      logWarn("ADMIN_USERS_JSON must be an array");
      return users;
    }

    parsedUsers.forEach((user) => {
      const role = normalizeRole(user.role);
      if (!user.email || (!user.password && !user.passwordHash) || !role) {
        logWarn("Invalid admin user configuration skipped");
        return;
      }

      users.push({
        email: String(user.email).toLowerCase(),
        password: user.password,
        passwordHash: user.passwordHash,
        role,
        name: user.name || ROLE_LABELS[role]
      });
    });
  } catch (err) {
    logError("Failed to parse ADMIN_USERS_JSON", err);
  }

  return users;
}

const configuredAdminUsers = parseAdminUsers();

function validateStartupConfig() {
  requireConfigValue("MONGO_URI", MONGO_URI);
  requireConfigValue("JWT_SECRET", JWT_SECRET);
  requireConfigValue("MEMBER_JWT_SECRET", MEMBER_JWT_SECRET);

  if (isProduction) {
    requireConfigValue("CLIENT_ORIGIN", process.env.CLIENT_ORIGIN);
    if (configuredAdminUsers.length === 0) {
      throw new Error("At least one admin account must be configured");
    }
  }
}

validateStartupConfig();

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|mkv/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype.split("/")[1]);
    if (ok) cb(null, true);
    else cb(new Error("Only images and videos are allowed."));
  }
});

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

/* MongoDB Connection */
mongoose.connect(MONGO_URI)
  .then(async () => {
    logInfo("MongoDB connected");
    // One-time update for specific female members
    try {
      const femaleNames = ["cate", "rose", "mary", "ruth", "ketase"];
      const updateResult = await Member.updateMany(
        {
          $or: [
            { firstName: { $in: femaleNames.map(name => new RegExp(`^${name}$`, "i")) } },
            { lastName: { $in: femaleNames.map(name => new RegExp(`^${name}$`, "i")) } }
          ]
        },
        { gender: "Female" }
      );
      logInfo("Member gender maintenance completed", { modifiedCount: updateResult.modifiedCount });
    } catch (updateErr) {
      logError("Member gender maintenance failed", updateErr);
    }

    // Migration to populate empty completed transaction receipt numbers
    try {
      const missingReceiptTransactions = await Transaction.find({
        status: "Completed",
        $or: [
          { mpesaReceiptNumber: { $exists: false } },
          { mpesaReceiptNumber: null },
          { mpesaReceiptNumber: "" },
          { mpesaReceiptNumber: "—" }
        ]
      });

      if (missingReceiptTransactions.length > 0) {
        logInfo("Transaction receipt migration started", { count: missingReceiptTransactions.length });
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (const t of missingReceiptTransactions) {
          let mockReceipt = "NL";
          for (let i = 0; i < 8; i++) {
            mockReceipt += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          t.mpesaReceiptNumber = mockReceipt;
          await t.save();
        }
        logInfo("Transaction receipt migration completed");
      }
    } catch (migErr) {
      logError("Transaction receipt migration failed", migErr);
    }

    // Migration to sync completed baptism requests with member records
    try {
      const completedBaptisms = await BaptismRequest.find({ status: "Completed" });
      if (completedBaptisms.length > 0) {
        logInfo("Baptism member sync started", { count: completedBaptisms.length });
        let syncedCount = 0;
        for (const req of completedBaptisms) {
          const result = await Member.findOneAndUpdate(
            { email: { $regex: new RegExp(`^${req.email}$`, "i") }, isBaptized: { $ne: true } },
            { isBaptized: true }
          );
          if (result) syncedCount++;
        }
        if (syncedCount > 0) {
          logInfo("Baptism member sync completed", { count: syncedCount });
        }
      }
    } catch (syncErr) {
      logError("Baptism member sync failed", syncErr);
    }

    // Migration: Convert single Media items to Folder Media items
    try {
      const oldMediaItems = await Media.find({ files: { $exists: false } });
      if (oldMediaItems.length > 0) {
        logInfo("Media folder migration started", { count: oldMediaItems.length });
        for (const item of oldMediaItems) {
          const title = item.title || item.folder || `Upload - ${item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString("en-KE") : new Date().toLocaleDateString("en-KE")}`;
          const files = [{
            url: item.url,
            type: item.type || "image"
          }];

          await Media.findByIdAndUpdate(item._id, {
            $set: {
              title: title,
              coverUrl: item.url,
              files: files,
            },
            $unset: {
              url: "",
              type: ""
            }
          });
        }
        logInfo("Media folder migration completed");
      }
    } catch (migErr) {
      logError("Media folder migration failed", migErr);
    }
  })
  .catch(err => logError("MongoDB connection failed", err));

/* TEST ROUTE */
app.get("/", (req, res) => {
  res.send("API is running...");
});

/* ─────────────────────────────────────────────────────────────────
   MEMBER AUTH
   ───────────────────────────────────────────────────────────────── */

/* MEMBER SIGNUP */
app.post("/auth/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, gender, age, dateOfBirth, idNo, isBaptized, password } = req.body;

    const missingFields = [];
    if (!firstName) missingFields.push("First Name");
    if (!lastName) missingFields.push("Second Name");
    if (!email) missingFields.push("Email");
    if (!phone) missingFields.push("Phone");
    if (!gender) missingFields.push("Gender");
    if (!password) missingFields.push("Password");

    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
    }

    if (age && Number(age) < 12) {
      return res.status(400).json({ message: "You must be at least 12 years of age to register." });
    }

    if (age && Number(age) > 18 && !idNo) {
      return res.status(400).json({ message: "National ID number is required for members above 18 years of age." });
    }

    const existing = await Member.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate unique memberId in format 0000
    const lastMember = await Member.findOne().sort({ createdAt: -1 });
    let nextIdNumber = 1;
    if (lastMember && lastMember.memberId) {
      nextIdNumber = parseInt(lastMember.memberId) + 1;
    }
    const memberId = nextIdNumber.toString().padStart(4, "0");

    const member = new Member({
      memberId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      gender,
      age: age ? Number(age) : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      idNo: age && Number(age) > 18 ? idNo : undefined,
      isBaptized: isBaptized === true || isBaptized === "true",
      passwordHash
    });
    await member.save();

    const token = jwt.sign({ id: member._id, email: member.email }, MEMBER_JWT_SECRET, { expiresIn: "7d" });
    logInfo("User registration successful");
    res.status(201).json({
      token,
      member: { id: member._id, memberId: member.memberId, firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone, idNo: member.idNo },
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* MEMBER LOGIN */
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const member = await Member.findOne({ email: email.toLowerCase() });
    if (!member) {
      logWarn("Authentication failed", { area: "member" });
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (member.isDeleted) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact administration." });
    }
    const valid = await bcrypt.compare(password, member.passwordHash);
    if (!valid) {
      logWarn("Authentication failed", { area: "member" });
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ id: member._id, email: member.email }, MEMBER_JWT_SECRET, { expiresIn: "7d" });
    logInfo("User login successful");
    res.json({
      token,
      member: { id: member._id, memberId: member.memberId, firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone },
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* GET ALL MEMBERS (admin only) */
app.get("/auth/members", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const members = await Member.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).select("-passwordHash");
    res.json(members);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* GET DELETED MEMBERS (admin only) */
app.get("/auth/members/deleted", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const deleted = await Member.find({ isDeleted: true }).sort({ updatedAt: -1 }).select("-passwordHash");
    res.json(deleted);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* DELETE MEMBER (soft delete, admin only) */
app.delete("/auth/members/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member successfully deleted" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* RESTORE DELETED MEMBER (admin only) */
app.patch("/auth/members/:id/restore", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, { isDeleted: false }, { new: true });
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member successfully restored" });
  } catch (err) {
    handleServerError(res, err);
  }
});

async function verifyAdminPassword(account, password) {
  if (account.passwordHash) {
    return bcrypt.compare(password, account.passwordHash);
  }

  return Boolean(account.password && account.password === password);
}

app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const adminAccount = configuredAdminUsers.find(
    (account) => account.email === String(email).toLowerCase()
  );

  if (!adminAccount || !(await verifyAdminPassword(adminAccount, password))) {
    logWarn("Authentication failed", { area: "admin" });
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const role = normalizeRole(adminAccount.role);
  const permissions = getPermissionsForRole(role);
  const token = jwt.sign(
    { role, email: adminAccount.email, name: adminAccount.name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  logInfo("Admin login successful", { role });
  res.json({
    token,
    admin: {
      name: adminAccount.name,
      role,
      roleLabel: ROLE_LABELS[role],
      permissions
    }
  });
});
/* TOKEN MIDDLEWARE (Admin) */
function verifyToken(req, res, next) {
  let token = req.headers.authorization;
  if (!token) {
    logWarn("Authentication required", { area: "admin", method: req.method, path: req.path });
    return res.status(403).json({ message: "No token provided" });
  }

  // Strip "Bearer " prefix if present (axios/fetch may add it automatically)
  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logWarn("Authentication failed", { area: "admin", reason: err.name });
      return res.status(401).json({ message: "Admin session expired. Please log in again." });
    }

    const role =
      normalizeRole(decoded.role) ||
      (decoded.email && String(decoded.email).toLowerCase() === ADMIN_EMAIL ? ROLES.SUPER_ADMIN : null);

    if (!role) {
      logWarn("Authorization failed", { area: "admin", reason: "missing-role" });
      return res.status(403).json({ message: "Admin role is not authorized." });
    }

    req.admin = {
      ...decoded,
      role,
      permissions: getPermissionsForRole(role)
    };
    next();
  });
}

function requireAdminRoles(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole).filter(Boolean);

  return (req, res, next) => {
    if (!req.admin?.role || !normalizedAllowedRoles.includes(req.admin.role)) {
      logWarn("Authorization failed", { area: "admin", role: req.admin?.role || "unknown" });
      return res.status(403).json({ message: "You are not authorized to access this resource." });
    }

    next();
  };
}

/* TOKEN MIDDLEWARE (Member) */
function verifyMemberToken(req, res, next) {
  let token = req.headers.authorization;
  if (!token) return res.status(403).json({ message: "Authentication required." });

  // Strip "Bearer " prefix if present (axios/fetch may add it automatically)
  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  jwt.verify(token, MEMBER_JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Session expired. Please log in again." });
    req.member = decoded;
    next();
  });
}

/* GET LOGGED IN MEMBER PROFILE */
app.get("/auth/me", verifyMemberToken, async (req, res) => {
  try {
    const member = await Member.findById(req.member.id).select("-passwordHash");
    if (!member || member.isDeleted) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* CREATE EVENT */
app.post("/events", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN), async (req, res) => {
  try {
    const eventCode = "EVT-" + Math.floor(1000 + Math.random() * 9000);
    const event = new Event({ ...req.body, eventCode });
    await event.save();
    res.send("Event created");
  } catch (err) {
    handleServerError(res, err);
  }
});

/* GET EVENTS */
app.get("/events", async (req, res) => {
  try {
    const events = await Event.find();

    // Auto-resolve any existing "N/A" or missing member details on the fly
    const updatedEvents = await Promise.all(events.map(async (event) => {
      let needsSave = false;
      const updatedAttendees = await Promise.all(event.attendees.map(async (attendee) => {
        if (!attendee.memberId || attendee.memberId === "N/A" || !attendee.idNo || attendee.idNo === "N/A") {
          // Look up the member in the database by phone number
          const cleanPhone = attendee.phone ? attendee.phone.trim() : "";
          const member = await Member.findOne({
            $or: [
              { phone: cleanPhone },
              { phone: "+254" + cleanPhone.replace(/^\+254/, "") },
              { phone: cleanPhone.replace(/^\+254/, "") }
            ]
          });
          if (member) {
            attendee.memberId = member.memberId;
            attendee.idNo = member.idNo;
            attendee.idNumber = member.idNo;
            needsSave = true;
          }
        }
        return attendee;
      }));
      if (needsSave) {
        event.attendees = updatedAttendees;
        await event.save();
      }
      return event;
    }));

    res.json(updatedEvents);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* ATTEND EVENT */
app.post("/events/:id/attend", async (req, res) => {
  try {
    const { name, phone, memberId, idNo } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and Phone are required." });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.attendees.some(a => a.phone === phone)) {
      return res.status(400).json({ message: "You have already confirmed attendance." });
    }

    // Try to find the member by phone number in the database
    let finalMemberId = memberId;
    let finalIdNo = idNo;
    const cleanPhone = phone.trim();

    const member = await Member.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: "+254" + cleanPhone.replace(/^\+254/, "") },
        { phone: cleanPhone.replace(/^\+254/, "") }
      ]
    });

    if (member) {
      finalMemberId = member.memberId;
      finalIdNo = member.idNo;
    }

    event.attendees.push({
      name,
      phone,
      memberId: finalMemberId || "N/A",
      idNo: finalIdNo || "N/A",
      idNumber: finalIdNo || "N/A"
    });
    event.attendeesCount = event.attendees.length;
    await event.save();

    res.json({ message: "Attendance confirmed", attendeesCount: event.attendeesCount });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* DELETE EVENT */
app.delete("/events/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.send("Event deleted");
  } catch (err) {
    handleServerError(res, err);
  }
});

/* PROJECTS */
app.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post("/projects", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json({ message: "Project created" });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete("/projects/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* SUBMIT PRAYER REQUEST (public) */
app.post("/prayer-requests", async (req, res) => {
  try {
    const { name, phone, request } = req.body;

    if (!name || !phone || !request) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const prayerRequest = new PrayerRequest({ name, phone, request });
    await prayerRequest.save();

    res.status(201).json({ message: "Prayer request submitted successfully" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* GET ALL PRAYER REQUESTS (admin only) */
app.get("/prayer-requests", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const prayerRequests = await PrayerRequest.find().sort({ createdAt: -1 });
    res.json(prayerRequests);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* DELETE PRAYER REQUEST (admin only) */
app.delete("/prayer-requests/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    await PrayerRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Prayer request deleted" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* UPDATE PRAYER REQUEST READ STATUS (admin only) */
app.patch("/prayer-requests/:id/read", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const { isRead } = req.body;
    await PrayerRequest.findByIdAndUpdate(req.params.id, { isRead });
    res.json({ message: "Prayer request status updated" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* ─────────────────────────────────────────────────────────────────
   BAPTISM REQUESTS
   ───────────────────────────────────────────────────────────────── */

/* SUBMIT BAPTISM REQUEST (public) */
app.post("/api/baptism-requests", async (req, res) => {
  try {
    const { fullName, email, phone, dateOfBirth, preferredDate } = req.body;

    if (!fullName || !email || !phone || !dateOfBirth || !preferredDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check for existing request
    const existingRequest = await BaptismRequest.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, "i") } },
        { phone }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: `You already have a ${existingRequest.status.toLowerCase()} baptism request.` });
    }

    const pDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    pDate.setHours(0, 0, 0, 0);

    if (pDate < today) {
      return res.status(400).json({ message: "Preferred baptism date must be in the future (today or later)." });
    }

    const day = pDate.getDay(); // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      return res.status(400).json({ message: "Baptism can only be scheduled on a Saturday or a Sunday." });
    }

    // Calculate age from Date of Birth
    let age = undefined;
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);

      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      tenYearsAgo.setHours(0, 0, 0, 0);
      birthDate.setHours(0, 0, 0, 0);

      if (birthDate > tenYearsAgo) {
        return res.status(400).json({ message: "You must be at least 10 years old to request baptism." });
      }

      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    const baptismRequest = new BaptismRequest({
      fullName,
      email,
      phone,
      dateOfBirth,
      age: age !== undefined ? Number(age) : undefined,
      preferredDate
    });
    await baptismRequest.save();

    res.status(201).json({ message: "Baptism request submitted successfully" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* GET MY BAPTISM REQUESTS (member only) */
app.get("/api/my-baptism-requests", verifyMemberToken, async (req, res) => {
  try {
    const requests = await BaptismRequest.find({ email: req.member.email.toLowerCase() }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* EDIT MY PENDING BAPTISM REQUEST (member only) */
app.patch("/api/my-baptism-requests/:id", verifyMemberToken, async (req, res) => {
  try {
    const request = await BaptismRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    // Only allow editing own request
    if (request.email.toLowerCase() !== req.member.email.toLowerCase()) {
      return res.status(403).json({ message: "You are not authorized to edit this request." });
    }

    // Only allow editing pending requests
    if (request.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be edited." });
    }

    const { preferredDate, dateOfBirth } = req.body;

    // Validate preferred date
    if (preferredDate) {
      const pDate = new Date(preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      pDate.setHours(0, 0, 0, 0);
      if (pDate < today) {
        return res.status(400).json({ message: "Preferred baptism date must be in the future (today or later)." });
      }
      const day = pDate.getDay();
      if (day !== 0 && day !== 6) {
        return res.status(400).json({ message: "Baptism can only be scheduled on a Saturday or a Sunday." });
      }
      request.preferredDate = preferredDate;
    }

    // Validate date of birth
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      tenYearsAgo.setHours(0, 0, 0, 0);
      birthDate.setHours(0, 0, 0, 0);
      if (birthDate > tenYearsAgo) {
        return res.status(400).json({ message: "You must be at least 10 years old to request baptism." });
      }
      request.dateOfBirth = dateOfBirth;
    }

    await request.save();
    res.json({ message: "Baptism request updated successfully.", request });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* GET ALL BAPTISM REQUESTS (admin only) */
app.get("/api/admin/baptism-requests", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const baptismRequests = await BaptismRequest.find().sort({ createdAt: -1 });
    res.json(baptismRequests);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* UPDATE BAPTISM REQUEST STATUS (admin only) */
app.patch("/api/admin/baptism-requests/:id/status", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["Pending", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const request = await BaptismRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) {
      return res.status(404).json({ message: "Baptism request not found" });
    }

    await Member.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${request.email}$`, "i") } },
      { isBaptized: status === "Completed" }
    );
    res.json({ message: "Baptism request status updated", status });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* DELETE BAPTISM REQUEST (admin only) */
app.delete("/api/admin/baptism-requests/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const request = await BaptismRequest.findById(req.params.id);
    if (request) {
      if (request.status === "Completed") {
        await Member.findOneAndUpdate(
          { email: { $regex: new RegExp(`^${request.email}$`, "i") } },
          { isBaptized: false }
        );
      }
      await request.deleteOne();
    }
    res.json({ message: "Baptism request deleted" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* ─────────────────────────────────────────────────────────────────
   M-PESA DARAJA — STK PUSH
   ───────────────────────────────────────────────────────────────── */

// Helper: get Safaricom access token
async function getMpesaToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error("M-Pesa credentials are not configured");
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const env = process.env.MPESA_ENV === "production" ? "api" : "sandbox";

  const res = await fetch(
    `https://${env}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get M-Pesa token");
  return data.access_token;
}

// STK Push route
app.post("/api/stkpush", async (req, res) => {
  try {
    const { phone, amount, category } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ message: "Phone and amount are required." });
    }

    // Format phone: strip leading 0 or + then ensure 254 prefix
    let formattedPhone = phone.toString().replace(/\s+/g, "");
    if (formattedPhone.startsWith("+")) formattedPhone = formattedPhone.slice(1);
    if (formattedPhone.startsWith("0")) formattedPhone = "254" + formattedPhone.slice(1);

    // Timestamp: YYYYMMDDHHmmss
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("");

    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    if (!shortcode || !passkey || !process.env.MPESA_CALLBACK_URL) {
      return res.status(503).json({ message: "Payment service is not configured." });
    }

    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");
    const env = process.env.MPESA_ENV === "production" ? "api" : "sandbox";

    const token = await getMpesaToken();

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(Number(amount)),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: category || "OHC Giving",
      TransactionDesc: `${category || "Giving"} - Outreach Hope Church`,
    };

    const mpesaRes = await fetch(
      `https://${env}.safaricom.co.ke/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await mpesaRes.json();
    logInfo("M-Pesa STK push completed", {
      responseCode: result.ResponseCode || result.errorCode || "UNKNOWN"
    });

    if (result.ResponseCode === "0") {
      // Save pending transaction to DB
      const transaction = new Transaction({
        firstName: req.body.firstName || "Guest",
        lastName: req.body.lastName || "",
        memberId: req.body.memberId || "0000",
        phone: formattedPhone,
        amount: Number(amount),
        category: category || "General Donation",
        merchantRequestId: result.MerchantRequestID,
        checkoutRequestId: result.CheckoutRequestID,
        status: "Pending"
      });
      await transaction.save();

      return res.json({
        message: "STK Push sent! Check your phone and enter your M-Pesa PIN.",
        ...result
      });
    } else {
      return res.status(400).json({ message: result.errorMessage || "STK Push failed. Try again." });
    }
  } catch (err) {
    handleServerError(res, err, "Payment request failed");
  }
});

// M-Pesa callback (Safaricom posts here after payment)
app.post("/api/mpesa/callback", async (req, res) => {
  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      logWarn("Invalid M-Pesa callback format");
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid body format" });
    }

    const stkCallback = Body.stkCallback;

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    logInfo("M-Pesa callback received", { resultCode });

    const updateData = {
      resultCode,
      resultDesc,
      status: Number(resultCode) === 0 ? "Completed" : "Failed"
    };

    if (Number(resultCode) === 0 && stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
      // Extract Receipt Number from CallbackMetadata
      const metadataItems = stkCallback.CallbackMetadata.Item;
      const receiptItem = metadataItems.find(item => item.Name === "MpesaReceiptNumber");
      if (receiptItem) updateData.mpesaReceiptNumber = receiptItem.Value;
    }

    const updatedTransaction = await Transaction.findOneAndUpdate({ checkoutRequestId }, updateData, { new: true });

    if (updatedTransaction) {
      logInfo("Payment transaction updated", { status: updateData.status });
    } else {
      logWarn("Payment callback did not match a transaction");
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    logError("M-Pesa callback processing failed", err);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
  }
});

// GET Transactions (Admin only)
app.get("/api/admin/transactions", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.TRANSACTIONS_ADMIN), async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    handleServerError(res, err);
  }
});

// GET Transaction Status (Public polling)
app.get("/api/transactions/status/:checkoutRequestId", async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ checkoutRequestId: req.params.checkoutRequestId });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // If still pending, query Safaricom API directly to check status
    if (transaction.status === "Pending") {
      try {
        const shortcode = process.env.MPESA_SHORTCODE;
        const passkey = process.env.MPESA_PASSKEY;

        if (shortcode && passkey) {
          const now = new Date();
          const timestamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
            String(now.getHours()).padStart(2, "0"),
            String(now.getMinutes()).padStart(2, "0"),
            String(now.getSeconds()).padStart(2, "0"),
          ].join("");

          const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");
          const env = process.env.MPESA_ENV === "production" ? "api" : "sandbox";

          const token = await getMpesaToken();

          const mpesaRes = await fetch(
            `https://${env}.safaricom.co.ke/mpesa/stkpushquery/v1/query`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: req.params.checkoutRequestId
              }),
            }
          );

          const result = await mpesaRes.json();
          logInfo("M-Pesa STK query completed", {
            resultCode: result.ResultCode || result.ResponseCode || result.errorCode || "UNKNOWN"
          });

          const isProcessing =
            result.ResultCode === "103" ||
            result.ResultCode === 103 ||
            result.ResponseCode === "103" ||
            result.ResponseCode === 103 ||
            result.errorCode === "500.002.1001" ||
            (result.errorMessage && result.errorMessage.toLowerCase().includes("processing"));

          if (result.ResultCode === "0" || result.ResultCode === 0) {
            transaction.status = "Completed";
            transaction.resultDesc = result.ResultDesc || "Completed successfully";
            if (!transaction.mpesaReceiptNumber) {
              const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
              let mockReceipt = "NL";
              for (let i = 0; i < 8; i++) {
                mockReceipt += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              transaction.mpesaReceiptNumber = mockReceipt;
            }
            await transaction.save();
          } else if (isProcessing) {
            // Still processing: do not change status, keep it "Pending" so polling continues
            logInfo("M-Pesa transaction is still processing");
          } else if (result.ResultCode !== undefined && result.ResultCode !== null) {
            transaction.status = "Failed";
            transaction.resultDesc = result.ResultDesc || result.ResponseDescription || "Transaction failed";
            await transaction.save();
          } else if (result.errorCode) {
            // Treat other errorCodes (besides processing) as failures
            transaction.status = "Failed";
            transaction.resultDesc = result.errorMessage || "Transaction failed";
            await transaction.save();
          }
        }
      } catch (queryErr) {
        logError("M-Pesa STK query failed", queryErr);
      }
    }

    res.json({
      status: transaction.status,
      resultDesc: transaction.resultDesc,
      mpesaReceiptNumber: transaction.mpesaReceiptNumber
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* ─────────────────────────────────────────────────────────────────
   CHURCH GALLERY
   ───────────────────────────────────────────────────────────────── */

/* UPLOAD MEDIA (admin only — up to 1000 files per request) */
app.post("/api/gallery/upload", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.MEDIA_PHOTOS_ADMIN), upload.array("media", 1000), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }
    const files = req.files.map((file) => {
      const isVideo = /mp4|mov|avi|webm|mkv/.test(path.extname(file.originalname).toLowerCase().slice(1));
      return {
        url: `/uploads/${file.filename}`,
        type: isVideo ? "video" : "image"
      };
    });

    const folderTitle = req.body.folder ? req.body.folder.trim() : `Upload - ${new Date().toLocaleDateString("en-KE")}`;

    const media = new Media({
      title: folderTitle,
      description: req.body.description || "",
      coverUrl: files[0].url,
      files: files
    });

    await media.save();
    res.status(201).json({ message: "Media uploaded successfully.", item: media });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* GET ALL GALLERY MEDIA (public — sorted by uploadedAt desc) */
app.get("/api/gallery", async (req, res) => {
  try {
    const items = await Media.find().sort({ uploadedAt: -1 });
    res.json(items);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* DELETE GALLERY MEDIA (admin only) */
app.delete("/api/gallery/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.MEDIA_PHOTOS_ADMIN), async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: "Media not found." });
    }

    // Remove all files from disk
    if (media.files && media.files.length > 0) {
      media.files.forEach((f) => {
        const filePath = path.join(__dirname, f.url);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            logError("Failed to delete media file from disk", err);
          }
        }
      });
    }

    await media.deleteOne();
    logInfo("Media folder deleted", { fileCount: media.files?.length || 0 });
    res.json({ message: "Media folder deleted successfully." });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* ─────────────────────────────────────────────────────────────────
   MINISTERS
   ───────────────────────────────────────────────────────────────── */

/* GET ALL MINISTERS (public — sorted by order) */
app.get("/api/ministers", async (req, res) => {
  try {
    const ministers = await Minister.find().sort({ order: 1, createdAt: 1 });
    res.json(ministers);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* CREATE MINISTER WITH PHOTO (admin only) */
app.post("/api/ministers", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.MEDIA_PHOTOS_ADMIN), upload.single("photo"), async (req, res) => {
  try {
    const { name, role, bio, order } = req.body;
    if (!name || !role) return res.status(400).json({ message: "Name and role are required." });

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const minister = new Minister({
      name: name.trim(),
      role: role.trim(),
      bio: (bio || "").trim(),
      photoUrl,
      order: Number(order) || 0,
    });
    await minister.save();
    res.status(201).json(minister);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* UPDATE MINISTER (admin only — can replace photo) */
app.put("/api/ministers/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.MEDIA_PHOTOS_ADMIN), upload.single("photo"), async (req, res) => {
  try {
    const minister = await Minister.findById(req.params.id);
    if (!minister) return res.status(404).json({ message: "Minister not found." });

    const { name, role, bio, order } = req.body;
    if (name)  minister.name  = name.trim();
    if (role)  minister.role  = role.trim();
    if (bio !== undefined) minister.bio = bio.trim();
    if (order !== undefined) minister.order = Number(order);

    if (req.file) {
      // Delete old photo from disk
      if (minister.photoUrl) {
        const oldPath = path.join(__dirname, minister.photoUrl);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }
      minister.photoUrl = `/uploads/${req.file.filename}`;
    }

    await minister.save();
    res.json(minister);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* DELETE MINISTER (admin only) */
app.delete("/api/ministers/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.MEDIA_PHOTOS_ADMIN), async (req, res) => {
  try {
    const minister = await Minister.findById(req.params.id);
    if (!minister) return res.status(404).json({ message: "Minister not found." });

    // Delete photo from disk
    if (minister.photoUrl) {
      const filePath = path.join(__dirname, minister.photoUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
    await minister.deleteOne();
    res.json({ message: "Minister deleted." });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* SERVER */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  logInfo("Server started", { port: PORT });
});
