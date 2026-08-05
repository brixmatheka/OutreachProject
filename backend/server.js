import express from "express";
import multer from "multer";
import fs from "node:fs";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import dns from "node:dns";
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
import AdminAuditLog from "./models/AdminAuditLog.js";
import Project, { PROJECT_STATUSES } from "./models/Project.js";
import Member from "./models/Member.js";
import BaptismRequest from "./models/BaptismRequest.js";
import Media from "./models/Media.js";
import Minister from "./models/Minister.js";
import Sermon from "./models/Sermon.js";

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.disable("x-powered-by");
const isProduction = process.env.NODE_ENV === "production";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;
const MEMBER_JWT_SECRET = process.env.MEMBER_JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const MPESA_CALLBACK_SECRET = process.env.MPESA_CALLBACK_SECRET;
const FRONTEND_URL = String(process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

const mailTransport = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
  : null;

const MAX_UPLOAD_FILE_SIZE = 25 * 1024 * 1024;
const MAX_GALLERY_FILES = 20;
const MAX_TEXT_LENGTH = 5000;
const MAX_MPESA_AMOUNT = 250000;
const ADMIN_COOKIE = "ohc_admin";
const MEMBER_COOKIE = "ohc_member";
const COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/"
});

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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactCaseInsensitiveRegExp(value) {
  return new RegExp(`^${escapeRegExp(String(value).trim())}$`, "i");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function truncateText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((cookies, part) => {
    const index = part.indexOf("=");
    if (index === -1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) return cookies;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
    return cookies;
  }, {});
}

function getTokenFromRequest(req, cookieName) {
  let token = req.headers.authorization;
  if (token?.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  if (token && !["null", "undefined", "cookie-session"].includes(String(token).toLowerCase())) {
    return token;
  }

  return parseCookies(req)[cookieName];
}

function setAuthCookie(res, name, token, maxAge) {
  res.cookie(name, token, { ...COOKIE_OPTIONS, maxAge });
}

function clearAuthCookie(res, name) {
  res.clearCookie(name, COOKIE_OPTIONS);
}

function createRateLimiter({ windowMs, max, message }) {
  const attempts = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip || req.socket.remoteAddress || "unknown"}:${req.path}`;
    const entry = attempts.get(key) || { count: 0, resetAt: now + windowMs };

    if (entry.resetAt <= now) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    attempts.set(key, entry);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(max - entry.count, 0)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      return res.status(429).json({ message });
    }

    next();
  };
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  );
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again later."
});

const publicWriteLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: "Too many submissions. Please try again later."
});

const paymentLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many payment requests. Please try again later."
});

const statusLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 60,
  message: "Too many status checks. Please try again later."
});

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many uploads. Please try again later."
});

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
  sermons: [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN],
  members: [ROLES.SUPER_ADMIN]
});

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.SUPER_ADMIN]: ["dashboard", "events", "transactions", "media", "content", "sermons", "members"],
  [ROLES.TRANSACTIONS_ADMIN]: ["dashboard", "transactions"],
  [ROLES.EVENTS_ADMIN]: ["dashboard", "events"],
  [ROLES.MEDIA_PHOTOS_ADMIN]: ["dashboard", "media"],
  [ROLES.CONTENT_ADMIN]: ["dashboard", "content", "sermons"]
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
  content: ROLES.CONTENT_ADMIN,
  sermons: ROLES.CONTENT_ADMIN,
  sermon: ROLES.CONTENT_ADMIN
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
    const CALLBACK_SECRET =
    process.env.MPESA_CALLBACK_SECRET || "";
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

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska"
]);

const allowedExtensions = new Set([".jpeg", ".jpg", ".png", ".gif", ".webp", ".mp4", ".mov", ".avi", ".webm", ".mkv"]);
const imageExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);
const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const documentExtensions = new Set([".pdf", ".doc", ".docx"]);
const documentMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function hasAllowedMagicBytes(filePath, ext) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 4) return false;

  if ((ext === ".jpg" || ext === ".jpeg") && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (ext === ".png" && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
  if (ext === ".gif" && buffer.subarray(0, 3).toString("ascii") === "GIF") return true;
  if (ext === ".webp" && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return true;
  if ((ext === ".mp4" || ext === ".mov") && buffer.subarray(4, 8).toString("ascii") === "ftyp") return true;
  if (ext === ".avi" && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 11).toString("ascii") === "AVI") return true;
  if ((ext === ".webm" || ext === ".mkv") && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return true;

  return false;
}

function removeUploadedFiles(files = []) {
  files.forEach((file) => {
    if (file?.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        logError("Failed to remove rejected upload", err);
      }
    }
  });
}

function validateUploadedFiles(files) {
  const uploadedFiles = (Array.isArray(files) ? files : [files]).filter(Boolean);
  const invalidFile = uploadedFiles.find((file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    return !allowedExtensions.has(ext) || !allowedMimeTypes.has(file.mimetype) || !hasAllowedMagicBytes(file.path, ext);
  });

  if (invalidFile) {
    removeUploadedFiles(uploadedFiles);
    return false;
  }

  return true;
}

function resolveUploadPath(urlPath) {
  const filename = path.basename(String(urlPath || ""));
  const filePath = path.resolve(uploadsDir, filename);
  return filePath.startsWith(uploadsDir + path.sep) ? filePath : null;
}

function normalizeExistingUploadImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = new URL(raw).pathname;
    } catch {
      return null;
    }
  }

  if (!pathname.startsWith("/uploads/")) return null;

  const filename = path.basename(pathname);
  const normalized = `/uploads/${filename}`;
  const ext = path.extname(filename).toLowerCase();
  const filePath = resolveUploadPath(normalized);

  if (![".jpeg", ".jpg", ".png", ".gif", ".webp"].includes(ext) || !filePath || !fs.existsSync(filePath)) return null;
  if (!hasAllowedMagicBytes(filePath, ext)) return null;

  return normalized;
}

async function isGalleryImageUrl(url) {
  if (!url) return false;
  const item = await Media.exists({
    $or: [
      { coverUrl: url },
      { files: { $elemMatch: { url, type: "image" } } }
    ]
  });
  return Boolean(item);
}

async function deleteMinisterPhotoIfOrphan(photoUrl, excludedMinisterId = null) {
  const filePath = resolveUploadPath(photoUrl);
  if (!filePath || !fs.existsSync(filePath)) return;

  const [galleryUsesPhoto, otherMinisterUsesPhoto] = await Promise.all([
    isGalleryImageUrl(photoUrl),
    Minister.exists({
      photoUrl,
      ...(excludedMinisterId ? { _id: { $ne: excludedMinisterId } } : {})
    })
  ]);

  if (galleryUsesPhoto || otherMinisterUsesPhoto) return;

  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    logError("Failed to delete minister photo from disk", err);
  }
}

function hasAllowedDocumentBytes(filePath, ext) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 4) return false;
  if (ext === ".pdf") return buffer.subarray(0, 4).toString("ascii") === "%PDF";
  if (ext === ".docx") return buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (ext === ".doc") return buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  return false;
}

function validateSermonUploads(files = {}) {
  const allFiles = Object.values(files).flat().filter(Boolean);
  const invalidFile = allFiles.find((file) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "cover") {
      return !imageExtensions.has(ext) || !imageMimeTypes.has(file.mimetype) || !hasAllowedMagicBytes(file.path, ext);
    }

    if (file.fieldname === "pdf" || file.fieldname === "word") {
      return !documentExtensions.has(ext) || !documentMimeTypes.has(file.mimetype) || !hasAllowedDocumentBytes(file.path, ext);
    }

    return true;
  });

  if (invalidFile) {
    removeUploadedFiles(allFiles);
    return false;
  }

  return true;
}

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE,
    files: MAX_GALLERY_FILES,
    fields: 20,
    fieldNameSize: 100,
    fieldSize: 100 * 1024
  },
  fileFilter: (req, file, cb) => {
    const ok = allowedExtensions.has(path.extname(file.originalname).toLowerCase()) &&
      allowedMimeTypes.has(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error("Only images and videos are allowed."));
  }
});

const sermonUpload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024,
    files: 3,
    fields: 30,
    fieldNameSize: 100,
    fieldSize: 100 * 1024
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === "cover") {
      const ok = imageExtensions.has(ext) && imageMimeTypes.has(file.mimetype);
      return ok ? cb(null, true) : cb(new Error("Cover image must be JPG, PNG, or WEBP."));
    }
    if (file.fieldname === "pdf") {
      const ok = ext === ".pdf" && file.mimetype === "application/pdf";
      return ok ? cb(null, true) : cb(new Error("Sermon PDF must be a valid PDF file."));
    }
    if (file.fieldname === "word") {
      const ok = [".doc", ".docx"].includes(ext) && documentMimeTypes.has(file.mimetype);
      return ok ? cb(null, true) : cb(new Error("Sermon Word document must be DOC or DOCX."));
    }
    return cb(new Error("Unexpected sermon upload field."));
  }
});

const allowedOrigins = [
  "https://www.outreachhopechurch.org",
  "https://outreachhopechurch.org",
  "http://localhost:5173"
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization"
  ]
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(securityHeaders);
app.use(express.json({ limit: "100kb", strict: true }));
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

    // Migration to sync completed baptism requests with member records
    try {
      const completedBaptisms = await BaptismRequest.find({ status: "Completed" });
      if (completedBaptisms.length > 0) {
        logInfo("Baptism member sync started", { count: completedBaptisms.length });
        let syncedCount = 0;
        for (const req of completedBaptisms) {
          const result = await Member.findOneAndUpdate(
            { email: { $regex: exactCaseInsensitiveRegExp(req.email) }, isBaptized: { $ne: true } },
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
app.post("/auth/signup", authLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, residence, gender, age, dateOfBirth, idNo, isBaptized, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const missingFields = [];
    if (!firstName) missingFields.push("First Name");
    if (!lastName) missingFields.push("Second Name");
    if (!normalizedEmail) missingFields.push("Email");
    if (!phone) missingFields.push("Phone");
    if (!residence) missingFields.push("Area of Residence");
    if (!gender) missingFields.push("Gender");
    if (!password) missingFields.push("Password");

    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
    }

    if (age && Number(age) < 12) {
      return res.status(400).json({ message: "You must be at least 12 years of age to register." });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    if (age && Number(age) > 18 && !idNo) {
      return res.status(400).json({ message: "National ID number is required for members above 18 years of age." });
    }

    const existing = await Member.findOne({ email: normalizedEmail });
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
      firstName: truncateText(firstName, 80),
      lastName: truncateText(lastName, 80),
      email: normalizedEmail,
      phone: truncateText(phone, 30),
      residence: truncateText(residence, 120),
      gender,
      age: age ? Number(age) : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      idNo: age && Number(age) > 18 ? truncateText(idNo, 30) : undefined,
      isBaptized: isBaptized === true || isBaptized === "true",
      passwordHash
    });
    await member.save();

    const token = jwt.sign({ id: member._id, email: member.email }, MEMBER_JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, MEMBER_COOKIE, token, 7 * 24 * 60 * 60 * 1000);
    logInfo("User registration successful");
    res.status(201).json({
      authenticated: true,
      token,
      member: { id: member._id, memberId: member.memberId, firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone, residence: member.residence, idNo: member.idNo },
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* MEMBER LOGIN */
app.post("/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const member = await Member.findOne({ email: normalizedEmail });
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
    setAuthCookie(res, MEMBER_COOKIE, token, 7 * 24 * 60 * 60 * 1000);
    logInfo("User login successful");
    res.json({
      authenticated: true,
      token,
      member: { id: member._id, memberId: member.memberId, firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone },
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* REQUEST MEMBER PASSWORD RESET */
app.post("/auth/forgot-password", authLimiter, async (req, res) => {
  const genericMessage = "If an active account exists for that email, a password reset link has been sent.";
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ message: "Enter a valid email address." });
    if (!mailTransport || !SMTP_FROM) {
      logError("Password reset email is not configured", new Error("Missing SMTP configuration"));
      return res.status(503).json({ message: "Password reset email is temporarily unavailable. Please contact the church office." });
    }

    const member = await Member.findOne({ email, isDeleted: { $ne: true } }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (member) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      member.passwordResetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      member.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await member.save();
      const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
      try {
        await mailTransport.sendMail({
          from: SMTP_FROM,
          to: member.email,
          subject: "Reset your Outreach Hope Church password",
          text: `Hello ${member.firstName},\n\nWe received a request to reset your Outreach Hope Church member account password.\n\nReset your password using this secure link:\n${resetUrl}\n\nThis link expires in 60 minutes and can only be used once. If you did not request this, you can safely ignore this email.\n\nOutreach Hope Church Sunshine`
        });
      } catch (mailError) {
        member.passwordResetTokenHash = undefined;
        member.passwordResetExpiresAt = undefined;
        await member.save();
        throw mailError;
      }
    }
    res.json({ message: genericMessage });
  } catch (err) {
    logError("Password reset request failed", err);
    res.status(503).json({ message: "We could not send a reset email right now. Please try again later." });
  }
});

/* RESET MEMBER PASSWORD WITH ONE-TIME TOKEN */
app.post("/auth/reset-password", authLimiter, async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (!token || token.length !== 64) return res.status(400).json({ message: "This password reset link is invalid or has expired." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const member = await Member.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
      isDeleted: { $ne: true }
    }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!member) return res.status(400).json({ message: "This password reset link is invalid or has expired." });
    member.passwordHash = await bcrypt.hash(password, 12);
    member.passwordResetTokenHash = undefined;
    member.passwordResetExpiresAt = undefined;
    await member.save();
    clearAuthCookie(res, MEMBER_COOKIE);
    res.json({ message: "Your password has been reset successfully. You can now sign in." });
  } catch (err) { handleServerError(res, err); }
});

app.post("/auth/logout", (req, res) => {
  clearAuthCookie(res, MEMBER_COOKIE);
  res.json({ message: "Logged out" });
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

const ADMIN_MEMBER_EDIT_FIELDS = new Set([
  "firstName",
  "lastName",
  "email",
  "phone",
  "residence",
  "gender",
  "age",
  "dateOfBirth",
  "idNo",
  "isBaptized"
]);
const ADMIN_MEMBER_GENDERS = new Set(["Male", "Female", "Other"]);
const ADMIN_MEMBER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ADMIN_MEMBER_ID_PATTERN = /^[A-Z0-9][A-Z0-9/-]{2,29}$/;

function hasOwnMemberField(value, field) {
  return Object.prototype.hasOwnProperty.call(value, field);
}

function normalizeAdminMemberPhone(value) {
  const compact = String(value || "").trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d{7,15}$/.test(compact)) return null;

  let digits = compact.replace(/^\+/, "");
  if (digits.startsWith("0") && digits.length === 10) {
    digits = `254${digits.slice(1)}`;
  }
  return `+${digits}`;
}

function memberPhoneLookupPattern(phone) {
  const digits = phone.replace(/\D/g, "");
  const significantDigits = digits.startsWith("254") && digits.length === 12
    ? digits.slice(3)
    : digits;
  return new RegExp(`${significantDigits.split("").join("[\\s().-]*")}$`);
}

function parseAdminMemberBirthDate(value) {
  if (value === "" || value == null) return { value: undefined, age: undefined };

  const dateText = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!match) return { error: "Date of birth must be a valid calendar date." };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { error: "Date of birth must be a valid calendar date." };
  }

  const today = new Date();
  if (date.getTime() > today.getTime()) {
    return { error: "Date of birth cannot be in the future." };
  }

  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const monthDifference = today.getUTCMonth() - date.getUTCMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getUTCDate() < date.getUTCDate())) {
    age -= 1;
  }
  if (age < 0 || age > 120) {
    return { error: "Date of birth must produce an age between 0 and 120." };
  }

  return { value: date, age };
}

function serializeAdminMember(member) {
  return {
    _id: member._id,
    memberId: member.memberId,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    residence: member.residence,
    gender: member.gender,
    age: member.age,
    dateOfBirth: member.dateOfBirth,
    idNo: member.idNo,
    isBaptized: member.isBaptized,
    isDeleted: member.isDeleted,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt
  };
}

/* UPDATE MEMBER DIRECTORY RECORD (super admin only) */
app.patch("/auth/members/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid member ID." });
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "A valid member update is required." });
    }

    const suppliedFields = Object.keys(req.body);
    const unsupportedFields = suppliedFields.filter((field) => !ADMIN_MEMBER_EDIT_FIELDS.has(field));
    if (unsupportedFields.length > 0) {
      return res.status(400).json({ message: "One or more supplied fields cannot be changed." });
    }
    if (suppliedFields.length === 0) {
      return res.status(400).json({ message: "No member changes were provided." });
    }

    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found." });

    const changes = {};
    const validateText = (field, label, maxLength, required = false) => {
      if (!hasOwnMemberField(req.body, field)) return null;
      if (typeof req.body[field] !== "string") return `${label} must be text.`;
      const value = req.body[field].trim();
      if (required && !value) return `${label} is required.`;
      if (value.length > maxLength) return `${label} must be ${maxLength} characters or fewer.`;
      changes[field] = value;
      return null;
    };

    const textError =
      validateText("firstName", "First name", 80, true) ||
      validateText("lastName", "Last name", 80, true) ||
      validateText("residence", "Area of residence", 120, true);
    if (textError) return res.status(400).json({ message: textError });

    if (hasOwnMemberField(req.body, "email")) {
      if (typeof req.body.email !== "string") {
        return res.status(400).json({ message: "Email must be text." });
      }
      const email = normalizeEmail(req.body.email);
      if (!email || email.length > 254 || !ADMIN_MEMBER_EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ message: "Enter a valid email address." });
      }
      changes.email = email;
    }

    if (hasOwnMemberField(req.body, "phone")) {
      const phone = normalizeAdminMemberPhone(req.body.phone);
      if (!phone) {
        return res.status(400).json({ message: "Enter a valid phone number with 7 to 15 digits." });
      }
      changes.phone = phone;
    }

    if (hasOwnMemberField(req.body, "gender")) {
      if (!ADMIN_MEMBER_GENDERS.has(req.body.gender)) {
        return res.status(400).json({ message: "Gender must be Male, Female, or Other." });
      }
      changes.gender = req.body.gender;
    }

    if (hasOwnMemberField(req.body, "age")) {
      if (req.body.age === "" || req.body.age == null) {
        changes.age = undefined;
      } else {
        const age = Number(req.body.age);
        if (!Number.isInteger(age) || age < 0 || age > 120) {
          return res.status(400).json({ message: "Age must be a whole number between 0 and 120." });
        }
        changes.age = age;
      }
    }

    if (hasOwnMemberField(req.body, "dateOfBirth")) {
      const parsedBirthDate = parseAdminMemberBirthDate(req.body.dateOfBirth);
      if (parsedBirthDate.error) {
        return res.status(400).json({ message: parsedBirthDate.error });
      }
      changes.dateOfBirth = parsedBirthDate.value;
      if (parsedBirthDate.value) changes.age = parsedBirthDate.age;
    }

    if (hasOwnMemberField(req.body, "idNo")) {
      if (req.body.idNo !== "" && req.body.idNo != null && typeof req.body.idNo !== "string") {
        return res.status(400).json({ message: "National ID or passport number must be text." });
      }
      const idNo = String(req.body.idNo || "").trim().toUpperCase();
      if (idNo && !ADMIN_MEMBER_ID_PATTERN.test(idNo)) {
        return res.status(400).json({ message: "National ID or passport number must be 3 to 30 letters, numbers, slashes, or hyphens." });
      }
      changes.idNo = idNo || undefined;
    }

    if (hasOwnMemberField(req.body, "isBaptized")) {
      if (typeof req.body.isBaptized !== "boolean") {
        return res.status(400).json({ message: "Baptism status must be true or false." });
      }
      changes.isBaptized = req.body.isBaptized;
    }

    const effectiveRequiredFields = {
      firstName: hasOwnMemberField(changes, "firstName") ? changes.firstName : member.firstName,
      lastName: hasOwnMemberField(changes, "lastName") ? changes.lastName : member.lastName,
      email: hasOwnMemberField(changes, "email") ? changes.email : member.email,
      phone: hasOwnMemberField(changes, "phone") ? changes.phone : member.phone,
      residence: hasOwnMemberField(changes, "residence") ? changes.residence : member.residence,
      gender: hasOwnMemberField(changes, "gender") ? changes.gender : member.gender
    };
    if (Object.values(effectiveRequiredFields).some((value) => !String(value || "").trim())) {
      return res.status(400).json({ message: "Name, email, phone, residence, and gender are required." });
    }

    const [emailOwner, phoneOwner, idOwner] = await Promise.all([
      changes.email
        ? Member.exists({ _id: { $ne: member._id }, email: exactCaseInsensitiveRegExp(changes.email) })
        : null,
      changes.phone
        ? Member.exists({ _id: { $ne: member._id }, phone: { $regex: memberPhoneLookupPattern(changes.phone) } })
        : null,
      changes.idNo
        ? Member.exists({ _id: { $ne: member._id }, idNo: exactCaseInsensitiveRegExp(changes.idNo) })
        : null
    ]);
    if (emailOwner) return res.status(409).json({ message: "That email address belongs to another member." });
    if (phoneOwner) return res.status(409).json({ message: "That phone number belongs to another member." });
    if (idOwner) return res.status(409).json({ message: "That national ID or passport number belongs to another member." });

    member.set(changes);
    await member.save();
    logInfo("Member directory record updated", {
      area: "admin",
      role: req.admin.role,
      resourceId: String(member._id)
    });
    return res.json({
      message: "Member record updated successfully.",
      member: serializeAdminMember(member)
    });
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const message = field === "email"
        ? "That email address belongs to another member."
        : "A member already uses one of those unique details.";
      return res.status(409).json({ message });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return handleServerError(res, err);
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

app.post("/admin/login", authLimiter, async (req, res) => {
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

  setAuthCookie(res, ADMIN_COOKIE, token, 8 * 60 * 60 * 1000);
  logInfo("Admin login successful", { role });
  res.json({
    authenticated: true,
    token,
    admin: {
      name: adminAccount.name,
      role,
      roleLabel: ROLE_LABELS[role],
      permissions
    }
  });
});

app.post("/admin/logout", (req, res) => {
  clearAuthCookie(res, ADMIN_COOKIE);
  res.json({ message: "Logged out" });
});
/* TOKEN MIDDLEWARE (Admin) */
function verifyToken(req, res, next) {
  const token = getTokenFromRequest(req, ADMIN_COOKIE);
  if (!token) {
    logWarn("Authentication required", { area: "admin", method: req.method, path: req.path });
    return res.status(403).json({ message: "No token provided" });
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
  const token = getTokenFromRequest(req, MEMBER_COOKIE);
  if (!token) return res.status(403).json({ message: "Authentication required." });

  jwt.verify(token, MEMBER_JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Session expired. Please log in again." });
    req.member = decoded;
    next();
  });
}

function optionalMemberToken(req, res, next) {
  const token = getTokenFromRequest(req, MEMBER_COOKIE);
  if (!token) return next();

  jwt.verify(token, MEMBER_JWT_SECRET, (err, decoded) => {
    if (!err) req.member = decoded;
    next();
  });
}

app.get("/admin/me", verifyToken, (req, res) => {
  res.json({
    admin: {
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      roleLabel: ROLE_LABELS[req.admin.role],
      permissions: req.admin.permissions
    }
  });
});

/* ORGANIZATION-WIDE ADMIN REPORTING OVERVIEW */
app.get("/api/admin/overview", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      activeMembers, inactiveMembers, newMembers, transactionSummary, transactionCategories,
      upcomingEvents, pastEvents, eventRegistrations, unreadPrayers, totalPrayers,
      baptismSummary, sermonSummary, gallerySummary, projects, ministers,
    ] = await Promise.all([
      Member.countDocuments({ isDeleted: { $ne: true } }),
      Member.countDocuments({ isDeleted: true }),
      Member.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: thirtyDaysAgo } }),
      Transaction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
      Transaction.aggregate([
        { $match: { status: "Completed" } },
        { $group: { _id: "$category", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
        { $sort: { amount: -1 } },
      ]),
      Event.countDocuments({ date: { $gte: now } }),
      Event.countDocuments({ date: { $lt: now } }),
      Event.aggregate([{ $group: { _id: null, total: { $sum: { $size: { $ifNull: ["$attendees", []] } } } } }]),
      PrayerRequest.countDocuments({ isArchived: { $ne: true }, isRead: { $ne: true } }),
      PrayerRequest.countDocuments({ isArchived: { $ne: true } }),
      BaptismRequest.aggregate([
        { $match: { isArchived: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Sermon.aggregate([{
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: ["$isPublished", 1, 0] } },
          featured: { $sum: { $cond: ["$isFeatured", 1, 0] } },
          views: { $sum: "$views" },
          downloads: { $sum: "$downloads.total" },
        },
      }]),
      Media.aggregate([{ $group: { _id: null, folders: { $sum: 1 }, files: { $sum: { $size: { $ifNull: ["$files", []] } } } } }]),
      Project.countDocuments(),
      Minister.countDocuments(),
    ]);

    const transactionMap = Object.fromEntries(transactionSummary.map((item) => [item._id, { count: item.count, amount: item.amount }]));
    const baptismMap = Object.fromEntries(baptismSummary.map((item) => [item._id, item.count]));
    res.set("Cache-Control", "private, no-store");
    res.json({
      generatedAt: now,
      period: { from: thirtyDaysAgo, to: now },
      membership: { active: activeMembers, inactive: inactiveMembers, newLast30Days: newMembers },
      finance: {
        completed: transactionMap.Completed || { count: 0, amount: 0 },
        pending: transactionMap.Pending || { count: 0, amount: 0 },
        failed: transactionMap.Failed || { count: 0, amount: 0 },
        categories: transactionCategories.map((item) => ({ category: item._id || "Uncategorized", count: item.count, amount: item.amount })),
      },
      events: { upcoming: upcomingEvents, past: pastEvents, registrations: eventRegistrations[0]?.total || 0 },
      pastoralCare: { prayers: totalPrayers, unreadPrayers },
      baptism: { pending: baptismMap.Pending || 0, completed: baptismMap.Completed || 0 },
      sermons: sermonSummary[0] || { total: 0, published: 0, featured: 0, views: 0, downloads: 0 },
      media: gallerySummary[0] || { folders: 0, files: 0 },
      operations: { projects, ministers },
    });
  } catch (err) {
    handleServerError(res, err, "Could not generate organization overview");
  }
});

app.post("/api/admin/report-audit", verifyToken, async (req, res) => {
  try {
    const format = ["csv", "word", "pdf"].includes(req.body.format) ? req.body.format : "unknown";
    const suppliedReportId = String(req.body.reportId || "").trim().toUpperCase();
    const reportId = /^OHC-[A-Z0-9-]{4,64}$/.test(suppliedReportId)
      ? suppliedReportId
      : `OHC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const suppliedFilters = req.body.filters && typeof req.body.filters === "object" && !Array.isArray(req.body.filters)
      ? Object.entries(req.body.filters).slice(0, 20)
      : [];
    const filters = Object.fromEntries(suppliedFilters.map(([label, value]) => [
      truncateText(label, 80),
      truncateText(typeof value === "string" ? value : JSON.stringify(value), 250),
    ]));
    const log = await AdminAuditLog.create({
      actorEmail: req.admin.email,
      actorRole: req.admin.role,
      action: "report.export",
      resourceType: "report",
      reportId,
      reportTitle: truncateText(req.body.title || "Administrative report", 160),
      format,
      recordCount: Math.max(0, Number(req.body.recordCount) || 0),
      filters,
      requestId: crypto.randomUUID(),
      ip: req.ip,
      userAgent: truncateText(req.get("user-agent") || "", 300),
    });
    res.status(201).json({ auditId: log._id, requestId: log.requestId, reportId: log.reportId });
  } catch (err) {
    handleServerError(res, err, "Could not record report export");
  }
});

app.get("/api/admin/report-audit", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const logs = await AdminAuditLog.find({ action: "report.export" })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-ip -userAgent")
      .lean();
    res.json(logs);
  } catch (err) {
    handleServerError(res, err, "Could not load report history");
  }
});

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

/* UPDATE LOGGED IN MEMBER PROFILE */
app.patch("/auth/me", verifyMemberToken, async (req, res) => {
  try {
    const member = await Member.findById(req.member.id);
    if (!member || member.isDeleted) return res.status(404).json({ message: "Member not found" });

    const firstName = truncateText(req.body.firstName, 80).trim();
    const lastName = truncateText(req.body.lastName, 80).trim();
    const phone = truncateText(req.body.phone, 30).trim();
    const residence = truncateText(req.body.residence, 120).trim();
    const email = normalizeEmail(req.body.email);

    if (!firstName || !lastName || !phone || !residence || !email) {
      return res.status(400).json({ message: "Name, email, phone, and area of residence are required." });
    }

    const emailOwner = await Member.findOne({ email, _id: { $ne: member._id } });
    if (emailOwner) return res.status(409).json({ message: "That email address is already in use." });

    Object.assign(member, { firstName, lastName, phone, residence, email });
    await member.save();
    res.json({
      message: "Profile updated.",
      member: {
        id: member._id,
        memberId: member.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        residence: member.residence,
        updatedAt: member.updatedAt
      }
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* CHANGE LOGGED IN MEMBER PASSWORD */
app.patch("/auth/me/password", authLimiter, verifyMemberToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const member = await Member.findById(req.member.id);
    if (!member || member.isDeleted) return res.status(404).json({ message: "Member not found" });
    if (!(await bcrypt.compare(currentPassword, member.passwordHash))) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    member.passwordHash = await bcrypt.hash(newPassword, 10);
    await member.save();
    res.json({ message: "Password changed successfully." });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* CREATE EVENT */
app.post("/events", uploadLimiter, verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN), upload.single("banner"), async (req, res) => {
  try {
    if (req.file && !validateUploadedFiles(req.file)) {
      return res.status(400).json({ message: "Uploaded file content does not match an allowed media type." });
    }
    if (!String(req.body.title || "").trim() || !req.body.date) {
      removeUploadedFiles([req.file].filter(Boolean));
      return res.status(400).json({ message: "Event title and date are required." });
    }
    const eventDate = new Date(req.body.date);
    if (Number.isNaN(eventDate.getTime())) {
      removeUploadedFiles([req.file].filter(Boolean));
      return res.status(400).json({ message: "Event date is invalid." });
    }

    const eventCode = "EVT-" + Math.floor(1000 + Math.random() * 9000);
    const eventData = {
      title: truncateText(req.body.title, 150),
      description: truncateText(req.body.description, 3000),
      date: eventDate,
      location: truncateText(req.body.location || "", 200),
      time: truncateText(req.body.time || "", 50),
      eventCode
    };
    if (req.file) {
      eventData.banner = `/uploads/${req.file.filename}`;
    }
    const event = new Event(eventData);
    await event.save();
    res.status(201).json({ message: "Event created", event });
  } catch (err) {
    removeUploadedFiles([req.file].filter(Boolean));
    handleServerError(res, err);
  }
});

function serializePublicEvent(event) {
  return {
    _id: event._id,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    time: event.time,
    banner: event.banner,
    contentType: event.contentType || "event",
    pdfUrl: event.pdfUrl || "",
    category: event.category || "General",
    targetAudience: event.targetAudience || "Everyone",
    expiryDate: event.expiryDate,
    isPinned: Boolean(event.isPinned),
    eventCode: event.eventCode,
    attendeesCount: event.attendeesCount || event.attendees?.length || 0,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  };
}

/* GET EVENTS */
app.get("/events", async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      $or: [
        { contentType: { $ne: "announcement" } },
        { contentType: "announcement", date: { $lte: now }, $or: [{ expiryDate: null }, { expiryDate: { $exists: false } }, { expiryDate: { $gte: now } }] }
      ]
    }).sort({ isPinned: -1, date: 1 });
    res.json(events.map(serializePublicEvent));
  } catch (err) {
    handleServerError(res, err);
  }
});

/* MEMBER NOTIFICATIONS — currently sourced from published announcements */
app.get("/notifications", verifyMemberToken, async (req, res) => {
  try {
    const now = new Date();
    const member = await Member.findById(req.member.id).select("readAnnouncementIds isDeleted").lean();
    if (!member || member.isDeleted) return res.status(404).json({ message: "Member not found" });
    const readIds = new Set((member.readAnnouncementIds || []).map(String));
    const announcements = await Event.find({
      contentType: "announcement",
      date: { $lte: now },
      $or: [{ expiryDate: null }, { expiryDate: { $exists: false } }, { expiryDate: { $gte: now } }]
    }).sort({ isPinned: -1, date: -1 }).limit(50).lean();
    const notifications = announcements.map((item) => ({
      _id: item._id,
      title: item.title,
      message: item.description,
      category: item.category || "General",
      targetAudience: item.targetAudience || "Everyone",
      isPinned: Boolean(item.isPinned),
      createdAt: item.date,
      relatedUrl: "/events#announcements",
      isRead: readIds.has(String(item._id))
    }));
    res.json({ unreadCount: notifications.filter((item) => !item.isRead).length, notifications });
  } catch (err) { handleServerError(res, err); }
});

app.patch("/notifications/read-all", verifyMemberToken, async (req, res) => {
  try {
    const now = new Date();
    const ids = await Event.find({ contentType: "announcement", date: { $lte: now } }).distinct("_id");
    await Member.findByIdAndUpdate(req.member.id, { $addToSet: { readAnnouncementIds: { $each: ids } } });
    res.json({ message: "All notifications marked as read" });
  } catch (err) { handleServerError(res, err); }
});

app.patch("/notifications/:id/read", verifyMemberToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid notification ID" });
    await Member.findByIdAndUpdate(req.member.id, { $addToSet: { readAnnouncementIds: req.params.id } });
    res.json({ message: "Notification marked as read" });
  } catch (err) { handleServerError(res, err); }
});

const announcementUpload = sermonUpload.fields([{ name: "pdf", maxCount: 1 }]);
const announcementAudiences = ["Everyone", "Members", "Leaders", "Youth", "Choir", "Women", "Men", "Children", "Visitors"];

function announcementFiles(req) {
  return { pdf: req.files?.pdf?.[0] };
}

app.post("/announcements", uploadLimiter, verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN), announcementUpload, async (req, res) => {
  const files = announcementFiles(req);
  try {
    if (!req.body.title?.trim() || !req.body.description?.trim() || !req.body.publishDate) throw new Error("Title, description, and publish date are required.");
    const publishDate = new Date(req.body.publishDate);
    const expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : undefined;
    if (Number.isNaN(publishDate.getTime()) || (expiryDate && Number.isNaN(expiryDate.getTime()))) throw new Error("Announcement dates are invalid.");
    if (expiryDate && expiryDate <= publishDate) throw new Error("Expiry date must be after the publish date.");
    const audience = announcementAudiences.includes(req.body.targetAudience) ? req.body.targetAudience : "Everyone";
    const item = await Event.create({ contentType: "announcement", title: truncateText(req.body.title, 150), description: truncateText(req.body.description, 3000), date: publishDate, expiryDate, category: truncateText(req.body.category || "General", 80), targetAudience: audience, isPinned: req.body.isPinned === "true", pdfUrl: files.pdf ? `/uploads/${files.pdf.filename}` : "", eventCode: `ANN-${Math.floor(1000 + Math.random() * 9000)}` });
    res.status(201).json({ message: "Announcement created", announcement: item });
  } catch (err) { removeUploadedFiles([files.pdf].filter(Boolean)); if (err.message?.includes("required") || err.message?.includes("date")) return res.status(400).json({ message: err.message }); handleServerError(res, err); }
});

app.patch("/announcements/:id", uploadLimiter, verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN), announcementUpload, async (req, res) => {
  const files = announcementFiles(req);
  try {
    const item = await Event.findOne({ _id: req.params.id, contentType: "announcement" });
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    const oldPdf = item.pdfUrl;
    if (req.body.title !== undefined) item.title = truncateText(req.body.title, 150);
    if (req.body.description !== undefined) item.description = truncateText(req.body.description, 3000);
    if (req.body.category !== undefined) item.category = truncateText(req.body.category, 80);
    if (req.body.targetAudience !== undefined && announcementAudiences.includes(req.body.targetAudience)) item.targetAudience = req.body.targetAudience;
    if (req.body.publishDate) item.date = new Date(req.body.publishDate);
    if (req.body.expiryDate !== undefined) item.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : undefined;
    if (req.body.isPinned !== undefined) item.isPinned = req.body.isPinned === "true";
    if (files.pdf) item.pdfUrl = `/uploads/${files.pdf.filename}`;
    await item.save();
    [files.pdf && oldPdf].filter(Boolean).forEach((url) => { const p = resolveUploadPath(url); if (p && fs.existsSync(p)) fs.unlinkSync(p); });
    res.json({ message: "Announcement updated", announcement: item });
  } catch (err) { removeUploadedFiles([files.pdf].filter(Boolean)); handleServerError(res, err); }
});

app.patch("/announcements/:id/pin", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN), async (req, res) => {
  const item = await Event.findOneAndUpdate({ _id: req.params.id, contentType: "announcement" }, { isPinned: req.body.isPinned === true }, { new: true });
  if (!item) return res.status(404).json({ message: "Announcement not found" });
  res.json(item);
});

/* GET EVENTS WITH ATTENDEES (admin only) */
app.get("/api/admin/events", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN), async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* ATTEND EVENT */
app.post("/events/:id/attend", publicWriteLimiter, optionalMemberToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and Phone are required." });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.contentType === "announcement") return res.status(400).json({ message: "Announcements do not accept attendance." });

    const cleanPhone = truncateText(phone, 30);
    if (event.attendees.some(a => a.phone === cleanPhone)) {
      return res.status(400).json({ message: "You have already confirmed attendance." });
    }

    let finalMemberId = "N/A";
    let finalIdNo = "N/A";
    const member = req.member?.id
      ? await Member.findById(req.member.id).select("memberId idNo phone isDeleted")
      : null;

    if (member && !member.isDeleted) {
      finalMemberId = member.memberId;
      finalIdNo = member.idNo || "N/A";
    }

    event.attendees.push({
      name: truncateText(name, 120),
      phone: cleanPhone,
      memberId: finalMemberId,
      idNo: finalIdNo,
      idNumber: finalIdNo
    });
    event.attendeesCount = event.attendees.length;
    await event.save();

    res.json({ message: "Attendance confirmed", attendeesCount: event.attendeesCount });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* UPDATE EVENT */
app.patch("/events/:id", uploadLimiter, verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN), upload.single("banner"), async (req, res) => {
  try {
    if (req.file && !validateUploadedFiles(req.file)) {
      return res.status(400).json({ message: "Uploaded file content does not match an allowed media type." });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      removeUploadedFiles([req.file].filter(Boolean));
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      removeUploadedFiles([req.file].filter(Boolean));
      return res.status(404).json({ message: "Event not found" });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const title = truncateText(req.body.title, 150);
      if (!title) {
        removeUploadedFiles([req.file].filter(Boolean));
        return res.status(400).json({ message: "Event title is required." });
      }
      event.title = title;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      event.description = truncateText(req.body.description, 3000);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "date")) {
      const eventDate = new Date(req.body.date);
      if (Number.isNaN(eventDate.getTime())) {
        removeUploadedFiles([req.file].filter(Boolean));
        return res.status(400).json({ message: "Event date is invalid." });
      }
      event.date = eventDate;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "location")) {
      event.location = truncateText(req.body.location, 200);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "time")) {
      event.time = truncateText(req.body.time, 50);
    }

    const previousBanner = event.banner;
    if (req.file) event.banner = `/uploads/${req.file.filename}`;
    await event.save();

    if (req.file && previousBanner && previousBanner !== event.banner) {
      const oldBannerPath = resolveUploadPath(previousBanner);
      if (oldBannerPath && fs.existsSync(oldBannerPath)) {
        try {
          fs.unlinkSync(oldBannerPath);
        } catch (fileError) {
          logError("Failed to remove replaced event banner", fileError);
        }
      }
    }

    res.json({ message: "Event updated", event });
  } catch (err) {
    removeUploadedFiles([req.file].filter(Boolean));
    handleServerError(res, err);
  }
});

/* DELETE EVENT */
app.delete("/events/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.EVENTS_ADMIN), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const bannerPath = resolveUploadPath(event.banner);
    if (bannerPath && fs.existsSync(bannerPath)) {
      try {
        fs.unlinkSync(bannerPath);
      } catch (fileError) {
        logError("Failed to remove deleted event banner", fileError);
      }
    }
    const pdfPath = resolveUploadPath(event.pdfUrl);
    if (pdfPath && fs.existsSync(pdfPath)) {
      try { fs.unlinkSync(pdfPath); } catch (fileError) { logError("Failed to remove announcement PDF", fileError); }
    }
    res.json({ message: "Event deleted" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* PROJECTS */
const MAX_PROJECT_AMOUNT = 1_000_000_000_000;
const hasOwnProjectField = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function parseProjectDate(value, label) {
  if (value === "" || value === null) return { value: null };
  if (typeof value !== "string" && !(value instanceof Date)) {
    return { error: `${label} must be a valid date.` };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { error: `${label} must be a valid date.` };
  return { value: parsed };
}

function parseProjectNumber(value, label, maximum = MAX_PROJECT_AMOUNT) {
  if (value === "" || value === null) return { value: null };
  if (typeof value === "boolean" || (typeof value === "object" && value !== null)) {
    return { error: `${label} must be a number.` };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum) {
    return { error: `${label} must be between 0 and ${maximum.toLocaleString("en-KE")}.` };
  }
  return { value: parsed };
}

function buildProjectPayload(body, currentProject = null) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Project details must be provided." };
  }

  const isUpdate = Boolean(currentProject);
  const payload = {};
  const setRequiredText = (field, label, maxLength) => {
    if (isUpdate && !hasOwnProjectField(body, field)) return null;
    if (typeof body[field] !== "string") return `${label} is required.`;
    const value = truncateText(body[field], maxLength);
    if (!value) return `${label} is required.`;
    payload[field] = value;
    return null;
  };

  const titleError = setRequiredText("title", "Project title", 180);
  if (titleError) return { error: titleError };
  const descriptionError = setRequiredText("description", "Project description", 5000);
  if (descriptionError) return { error: descriptionError };

  if (!isUpdate || hasOwnProjectField(body, "status")) {
    const status = hasOwnProjectField(body, "status") ? body.status : "Ongoing";
    if (typeof status !== "string" || !PROJECT_STATUSES.includes(status)) {
      return { error: `Status must be one of: ${PROJECT_STATUSES.join(", ")}.` };
    }
    payload.status = status;
  }

  if (hasOwnProjectField(body, "owner")) {
    if (body.owner !== null && typeof body.owner !== "string") {
      return { error: "Project owner must be text." };
    }
    payload.owner = truncateText(body.owner || "", 160);
  }

  for (const [field, label] of [["startDate", "Start date"], ["endDate", "End date"]]) {
    if (!hasOwnProjectField(body, field)) continue;
    const parsed = parseProjectDate(body[field], label);
    if (parsed.error) return parsed;
    payload[field] = parsed.value;
  }

  for (const [field, label] of [["budget", "Budget"], ["amountRaised", "Amount raised"]]) {
    if (!hasOwnProjectField(body, field)) continue;
    const parsed = parseProjectNumber(body[field], label);
    if (parsed.error) return parsed;
    payload[field] = parsed.value;
  }

  if (!isUpdate || hasOwnProjectField(body, "progress")) {
    const parsed = parseProjectNumber(
      hasOwnProjectField(body, "progress") ? body.progress : 0,
      "Progress",
      100
    );
    if (parsed.error || parsed.value === null) {
      return { error: parsed.error || "Progress must be between 0 and 100." };
    }
    payload.progress = parsed.value;
  }

  if (hasOwnProjectField(body, "iconName")) {
    if (body.iconName !== null && typeof body.iconName !== "string") {
      return { error: "Project icon must be text." };
    }
    payload.iconName = truncateText(body.iconName || "IconHammer", 80);
  }

  const effectiveStart = hasOwnProjectField(payload, "startDate")
    ? payload.startDate
    : currentProject?.startDate || null;
  const effectiveEnd = hasOwnProjectField(payload, "endDate")
    ? payload.endDate
    : currentProject?.endDate || null;
  if (effectiveStart && effectiveEnd && effectiveEnd < effectiveStart) {
    return { error: "End date cannot be earlier than the start date." };
  }

  const effectiveStatus = payload.status || currentProject?.status || "Ongoing";
  const effectiveProgress = hasOwnProjectField(payload, "progress")
    ? payload.progress
    : currentProject?.progress || 0;
  if (effectiveStatus === "Completed" && effectiveProgress < 100) {
    if (hasOwnProjectField(body, "progress")) {
      return { error: "Completed projects must have 100% progress." };
    }
    payload.progress = 100;
  }

  if (isUpdate && Object.keys(payload).length === 0) {
    return { error: "No supported project changes were provided." };
  }

  return { payload };
}

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
    const { payload, error } = buildProjectPayload(req.body);
    if (error) return res.status(400).json({ message: error });

    const project = new Project(payload);
    await project.save();
    res.status(201).json({ message: "Project created", project });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    handleServerError(res, err);
  }
});

const updateProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found." });

    const { payload, error } = buildProjectPayload(req.body, project);
    if (error) return res.status(400).json({ message: error });

    project.set(payload);
    await project.save();
    return res.json({ message: "Project updated", project });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return handleServerError(res, err);
  }
};

app.patch("/projects/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), updateProject);
app.put("/projects/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), updateProject);

app.delete("/projects/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.json({ message: "Project deleted" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* SUBMIT PRAYER REQUEST (public) */
app.post("/prayer-requests", publicWriteLimiter, async (req, res) => {
  try {
    const {
      name,
      phone,
      email = "",
      category,
      urgency = "standard",
      isAnonymous = false,
      wantsCallback = false,
      preferredContactMethod = "",
      preferredContactTime = "",
      request
    } = req.body;

    const allowedCategories = ["health", "family", "finances", "spiritual", "grief", "work", "marriage", "salvation", "guidance", "other"];
    const allowedUrgency = ["standard", "urgent"];
    const allowedContactMethods = ["phone", "whatsapp", "email", ""];
    const allowedContactTimes = ["morning", "afternoon", "evening", "anytime", ""];

    if (!name || !phone || !request || !category) {
      return res.status(400).json({ message: "Name, phone number, category, and prayer request are required." });
    }
    if (!allowedCategories.includes(category) || !allowedUrgency.includes(urgency)) {
      return res.status(400).json({ message: "Select a valid prayer category and urgency level." });
    }
    if (!allowedContactMethods.includes(preferredContactMethod) || !allowedContactTimes.includes(preferredContactTime)) {
      return res.status(400).json({ message: "Select valid pastoral contact preferences." });
    }

    const prayerRequest = new PrayerRequest({
      name: truncateText(name, 120),
      phone: truncateText(phone, 30),
      email: truncateText(email, 180).toLowerCase(),
      category,
      urgency,
      isAnonymous: isAnonymous === true,
      wantsCallback: wantsCallback === true,
      preferredContactMethod: wantsCallback ? preferredContactMethod : "",
      preferredContactTime: wantsCallback ? preferredContactTime : "",
      request: truncateText(request, 3000)
    });
    await prayerRequest.save();

    res.status(201).json({ message: "Prayer request submitted successfully" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* GET ALL PRAYER REQUESTS (admin only) */
app.get("/prayer-requests", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const view = String(req.query.view || "active").toLowerCase();
    const query = view === "all"
      ? {}
      : view === "archived"
        ? { isArchived: true }
        : { isArchived: { $ne: true } };
    const prayerRequests = await PrayerRequest.find(query).sort({ createdAt: -1 });
    res.json(prayerRequests);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* ARCHIVE PRAYER REQUEST (admin only) */
app.delete("/prayer-requests/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid prayer request ID" });
    }
    const prayerRequest = await PrayerRequest.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, archivedAt: new Date() },
      { new: true }
    );
    if (!prayerRequest) return res.status(404).json({ message: "Prayer request not found" });
    res.json({ message: "Prayer request archived" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* UPDATE PRAYER REQUEST READ STATUS (admin only) */
app.patch("/prayer-requests/:id/read", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid prayer request ID" });
    }
    const isRead = req.body.isRead === true;
    const prayerRequest = await PrayerRequest.findOneAndUpdate(
      { _id: req.params.id, isArchived: { $ne: true } },
      isRead
        ? { $set: { isRead: true, prayedAt: new Date() } }
        : { $set: { isRead: false }, $unset: { prayedAt: 1 } },
      { new: true }
    );
    if (!prayerRequest) return res.status(404).json({ message: "Active prayer request not found" });
    res.json({ message: "Prayer request status updated" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* RESTORE PRAYER REQUEST (admin only) */
app.patch("/prayer-requests/:id/restore", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid prayer request ID" });
    }
    const prayerRequest = await PrayerRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { isArchived: false }, $unset: { archivedAt: 1 } },
      { new: true }
    );
    if (!prayerRequest) return res.status(404).json({ message: "Prayer request not found" });
    res.json({ message: "Prayer request restored" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* ─────────────────────────────────────────────────────────────────
   BAPTISM REQUESTS
   ───────────────────────────────────────────────────────────────── */

/* SUBMIT BAPTISM REQUEST (public) */
app.post("/api/baptism-requests", publicWriteLimiter, async (req, res) => {
  try {
    const { fullName, email, phone, dateOfBirth, preferredDate } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!fullName || !normalizedEmail || !phone || !dateOfBirth || !preferredDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check for existing request
    const existingRequest = await BaptismRequest.findOne({
      $or: [
        { email: { $regex: exactCaseInsensitiveRegExp(normalizedEmail) } },
        { phone: truncateText(phone, 30) }
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
      fullName: truncateText(fullName, 160),
      email: normalizedEmail,
      phone: truncateText(phone, 30),
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
    const requests = await BaptismRequest.find({
      email: req.member.email.toLowerCase(),
      isArchived: { $ne: true },
    }).sort({ createdAt: -1 });
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
    if (request.isArchived) return res.status(400).json({ message: "Archived requests cannot be edited." });

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
    const view = String(req.query.view || "active").toLowerCase();
    const query = view === "all"
      ? {}
      : view === "archived"
        ? { isArchived: true }
        : { isArchived: { $ne: true } };
    const baptismRequests = await BaptismRequest.find(query).sort({ createdAt: -1 });
    res.json(baptismRequests);
  } catch (err) {
    handleServerError(res, err);
  }
});

/* UPDATE BAPTISM REQUEST STATUS (admin only) */
app.patch("/api/admin/baptism-requests/:id/status", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid baptism request ID" });
    }
    const { status } = req.body;
    if (!status || !["Pending", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const statusUpdate = status === "Completed"
      ? { $set: { status, completedAt: new Date() } }
      : { $set: { status }, $unset: { completedAt: 1 } };
    const request = await BaptismRequest.findOneAndUpdate(
      { _id: req.params.id, isArchived: { $ne: true } },
      statusUpdate,
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: "Baptism request not found" });
    }

    await Member.findOneAndUpdate(
      { email: { $regex: exactCaseInsensitiveRegExp(request.email) } },
      { isBaptized: status === "Completed" }
    );
    res.json({ message: "Baptism request status updated", status });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* ARCHIVE BAPTISM REQUEST (admin only) */
app.delete("/api/admin/baptism-requests/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid baptism request ID" });
    }
    const request = await BaptismRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { isArchived: true, archivedAt: new Date() } },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: "Baptism request not found" });
    res.json({ message: "Baptism request archived" });
  } catch (err) {
    handleServerError(res, err);
  }
});

/* RESTORE BAPTISM REQUEST (admin only) */
app.patch("/api/admin/baptism-requests/:id/restore", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid baptism request ID" });
    }
    const request = await BaptismRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { isArchived: false }, $unset: { archivedAt: 1 } },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: "Baptism request not found" });
    res.json({ message: "Baptism request restored" });
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

function getMpesaEnv() {
  return process.env.MPESA_ENV === "production" ? "api" : "sandbox";
}

function getMpesaTimestamp() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
}

function getMpesaPassword(shortcode, passkey, timestamp) {
  return Buffer.from(shortcode + passkey + timestamp).toString("base64");
}

function getMpesaCallbackUrl() {
  const configuredUrl = process.env.MPESA_CALLBACK_URL;
  if (!configuredUrl || !MPESA_CALLBACK_SECRET) return configuredUrl;

  try {
    const callbackUrl = new URL(configuredUrl);
    if (!callbackUrl.searchParams.has("token")) {
      callbackUrl.searchParams.set("token", MPESA_CALLBACK_SECRET);
    }
    return callbackUrl.toString();
  } catch {
    const separator = configuredUrl.includes("?") ? "&" : "?";
    return `${configuredUrl}${separator}token=${encodeURIComponent(MPESA_CALLBACK_SECRET)}`;
  }
}

function verifyMpesaCallbackSecret(req) {
  if (!MPESA_CALLBACK_SECRET) return !isProduction;
  const providedSecret = req.query.token || req.headers["x-mpesa-callback-secret"];
  return timingSafeEqualString(providedSecret, MPESA_CALLBACK_SECRET);
}

function parseMpesaAmount(amount) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_MPESA_AMOUNT) {
    return null;
  }
  return Math.ceil(parsed);
}

function isMpesaProcessing(result) {
  return (
    result.ResultCode === "103" ||
    result.ResultCode === 103 ||
    result.ResponseCode === "103" ||
    result.ResponseCode === 103 ||
    result.errorCode === "500.002.1001" ||
    (result.errorMessage && result.errorMessage.toLowerCase().includes("processing"))
  );
}

function isMpesaSuccess(result) {
  return result.ResultCode === "0" || result.ResultCode === 0 || result.ResponseCode === "0" || result.ResponseCode === 0;
}

async function queryMpesaTransaction(checkoutRequestId) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) {
    throw new Error("M-Pesa query credentials are not configured");
  }

  const timestamp = getMpesaTimestamp();
  const token = await getMpesaToken();
  const mpesaRes = await fetch(
    `https://${getMpesaEnv()}.safaricom.co.ke/mpesa/stkpushquery/v1/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: getMpesaPassword(shortcode, passkey, timestamp),
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      }),
    }
  );

  return mpesaRes.json();
}

// STK Push route
app.post("/api/stkpush", paymentLimiter, optionalMemberToken, async (req, res) => {
  try {
    const { phone, amount, category } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ message: "Phone and amount are required." });
    }

    const mpesaAmount = parseMpesaAmount(amount);
    if (!mpesaAmount) {
      return res.status(400).json({ message: `Amount must be between 1 and ${MAX_MPESA_AMOUNT}.` });
    }

    // Format phone: strip leading 0 or + then ensure 254 prefix
    let formattedPhone = phone.toString().replace(/\s+/g, "");
    if (formattedPhone.startsWith("+")) formattedPhone = formattedPhone.slice(1);
    if (formattedPhone.startsWith("0")) formattedPhone = "254" + formattedPhone.slice(1);

    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    if (!shortcode || !passkey || !process.env.MPESA_CALLBACK_URL) {
      return res.status(503).json({ message: "Payment service is not configured." });
    }

    const timestamp = getMpesaTimestamp();

    const token = await getMpesaToken();
    const member = req.member?.id ? await Member.findById(req.member.id).select("firstName lastName memberId isDeleted") : null;

    const payload = {
      BusinessShortCode: shortcode,
      Password: getMpesaPassword(shortcode, passkey, timestamp),
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: mpesaAmount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: getMpesaCallbackUrl(),
      AccountReference: truncateText(category || "OHC Giving", 80),
      TransactionDesc: `${truncateText(category || "Giving", 80)} - Outreach Hope Church`,
    };

    const mpesaRes = await fetch(
      `https://${getMpesaEnv()}.safaricom.co.ke/mpesa/stkpush/v1/processrequest`,
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
        firstName: member && !member.isDeleted ? member.firstName : truncateText(req.body.firstName || "Guest", 80),
        lastName: member && !member.isDeleted ? member.lastName : truncateText(req.body.lastName || "", 80),
        memberId: member && !member.isDeleted ? member.memberId : truncateText(req.body.memberId || "0000", 30),
        phone: formattedPhone,
        amount: mpesaAmount,
        category: truncateText(category || "General Donation", 80),
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
    if (!verifyMpesaCallbackSecret(req)) {
      logWarn("Rejected M-Pesa callback with invalid secret");
      return res.status(401).json({ ResultCode: 1, ResultDesc: "Unauthorized callback" });
    }

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

    const transaction = await Transaction.findOne({ checkoutRequestId });
    if (!transaction) {
      logWarn("Payment callback did not match a transaction");
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (transaction.status === "Completed") {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (Number(resultCode) === 0) {
      let verification;
      try {
        verification = await queryMpesaTransaction(checkoutRequestId);
      } catch (verifyErr) {
        logError("M-Pesa callback verification query failed", verifyErr);
        return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
      }

      logInfo("M-Pesa callback verification completed", {
        resultCode: verification.ResultCode || verification.ResponseCode || verification.errorCode || "UNKNOWN"
      });

      if (!isMpesaSuccess(verification)) {
        if (isMpesaProcessing(verification)) {
          logWarn("M-Pesa callback verification still processing");
          return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
        }

        transaction.status = "Failed";
        transaction.resultCode = verification.ResultCode ?? verification.ResponseCode ?? resultCode;
        transaction.resultDesc = verification.ResultDesc || verification.ResponseDescription || verification.errorMessage || "Payment verification failed";
        await transaction.save();
        return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
      }

      transaction.status = "Completed";
      transaction.paidAt = transaction.paidAt || new Date();
      transaction.verifiedAt = new Date();
      transaction.resultCode = resultCode;
      transaction.resultDesc = resultDesc || verification.ResultDesc || "Completed successfully";

      if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
        const metadataItems = stkCallback.CallbackMetadata.Item;
        const receiptItem = metadataItems.find(item => item.Name === "MpesaReceiptNumber");
        if (receiptItem) transaction.mpesaReceiptNumber = receiptItem.Value;
      }
    } else {
      transaction.status = "Failed";
      transaction.resultCode = resultCode;
      transaction.resultDesc = resultDesc || "Transaction failed";
    }

    await transaction.save();
    logInfo("Payment transaction updated", { status: transaction.status });
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
app.get("/api/transactions/status/:checkoutRequestId", statusLimiter, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ checkoutRequestId: req.params.checkoutRequestId });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // If still pending, query Safaricom API directly to check status
    if (transaction.status === "Pending") {
      try {
        const result = await queryMpesaTransaction(req.params.checkoutRequestId);
        logInfo("M-Pesa STK query completed", {
          resultCode: result.ResultCode || result.ResponseCode || result.errorCode || "UNKNOWN"
        });

        if (isMpesaSuccess(result)) {
          transaction.status = "Completed";
          transaction.paidAt = transaction.paidAt || new Date();
          transaction.verifiedAt = new Date();
          transaction.resultCode = result.ResultCode ?? result.ResponseCode;
          transaction.resultDesc = result.ResultDesc || "Completed successfully";
          await transaction.save();
        } else if (isMpesaProcessing(result)) {
          logInfo("M-Pesa transaction is still processing");
        } else if (result.ResultCode !== undefined || result.ResponseCode !== undefined || result.errorCode) {
          transaction.status = "Failed";
          transaction.resultCode = result.ResultCode ?? result.ResponseCode;
          transaction.resultDesc = result.ResultDesc || result.ResponseDescription || result.errorMessage || "Transaction failed";
          await transaction.save();
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
/* SERMONS */
function normalizeTags(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(list.map((tag) => truncateText(tag, 40)).filter(Boolean))].slice(0, 12);
}

function parseBoolean(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

function getSermonFiles(files = {}) {
  return {
    cover: files.cover?.[0],
    pdf: files.pdf?.[0],
    word: files.word?.[0]
  };
}

function buildSermonPayload(body, files, existingSermon = null) {
  const uploaded = getSermonFiles(files);
  const shouldPublish = body.isPublished !== undefined ? parseBoolean(body.isPublished) : existingSermon?.isPublished || false;

  const payload = {
    title: truncateText(body.title, 180),
    preacher: truncateText(body.preacher, 120),
    scripture: truncateText(body.scripture, 160),
    category: truncateText(body.category || "General", 80),
    sermonDate: body.sermonDate ? new Date(body.sermonDate) : undefined,
    summary: truncateText(body.summary || "", 2000),
    tags: normalizeTags(body.tags),
    isPublished: shouldPublish,
    isFeatured: parseBoolean(body.isFeatured),
    publishedAt: shouldPublish ? existingSermon?.publishedAt || new Date() : undefined
  };

  if (uploaded.cover) payload.coverImage = `/uploads/${uploaded.cover.filename}`;
  if (uploaded.pdf) payload.pdfUrl = `/uploads/${uploaded.pdf.filename}`;
  if (uploaded.word) payload.wordUrl = `/uploads/${uploaded.word.filename}`;

  return payload;
}

function removeSermonFiles(sermon, replacementPayload = {}) {
  ["coverImage", "pdfUrl", "wordUrl"].forEach((field) => {
    if (!sermon?.[field] || !replacementPayload[field]) return;
    const filePath = resolveUploadPath(sermon[field]);
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        logError("Failed to remove replaced sermon file", err);
      }
    }
  });
}

function deleteSermonFiles(sermon) {
  ["coverImage", "pdfUrl", "wordUrl"].forEach((field) => {
    const filePath = resolveUploadPath(sermon?.[field]);
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        logError("Failed to delete sermon file", err);
      }
    }
  });
}

function buildSermonFilter(query, requirePublished = true) {
  const filter = requirePublished ? { isPublished: true } : {};
  if (query.category) filter.category = { $regex: exactCaseInsensitiveRegExp(query.category) };
  if (query.preacher) filter.preacher = { $regex: exactCaseInsensitiveRegExp(query.preacher) };
  if (query.featured !== undefined) filter.isFeatured = parseBoolean(query.featured);

  if (query.from || query.to || query.date) {
    filter.sermonDate = {};
    if (query.date) {
      const day = new Date(query.date);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      filter.sermonDate.$gte = day;
      filter.sermonDate.$lt = nextDay;
    } else {
      if (query.from) filter.sermonDate.$gte = new Date(query.from);
      if (query.to) filter.sermonDate.$lte = new Date(query.to);
    }
  }

  if (query.q) {
    const safe = escapeRegExp(truncateText(query.q, 80));
    const search = new RegExp(safe, "i");
    filter.$or = [
      { title: search },
      { preacher: search },
      { scripture: search },
      { category: search },
      { summary: search },
      { tags: search }
    ];
  }

  return filter;
}

function getSermonSort(sort = "latest") {
  if (sort === "oldest") return { sermonDate: 1, createdAt: 1 };
  if (sort === "views") return { views: -1, sermonDate: -1 };
  if (sort === "downloads") return { "downloads.total": -1, sermonDate: -1 };
  return { sermonDate: -1, createdAt: -1 };
}

function serializeSermon(sermon) {
  return {
    _id: sermon._id,
    title: sermon.title,
    preacher: sermon.preacher,
    scripture: sermon.scripture,
    category: sermon.category,
    sermonDate: sermon.sermonDate,
    summary: sermon.summary,
    tags: sermon.tags,
    coverImage: sermon.coverImage,
    pdfUrl: sermon.pdfUrl,
    wordUrl: sermon.wordUrl,
    isPublished: sermon.isPublished,
    isFeatured: sermon.isFeatured,
    publishedAt: sermon.publishedAt,
    views: sermon.views,
    downloads: sermon.downloads,
    createdAt: sermon.createdAt,
    updatedAt: sermon.updatedAt
  };
}

async function getRelatedSermons(sermon, limit = 4) {
  const scriptureSeed = sermon.scripture.split(/[;:,]/)[0] || sermon.scripture;
  return Sermon.find({
    _id: { $ne: sermon._id },
    isPublished: true,
    $or: [
      { category: sermon.category },
      { preacher: sermon.preacher },
      { scripture: { $regex: new RegExp(escapeRegExp(scriptureSeed), "i") } },
      { tags: { $in: sermon.tags || [] } }
    ]
  })
    .sort({ isFeatured: -1, sermonDate: -1 })
    .limit(limit);
}

app.get("/api/sermons", async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 9, 1), 24);
    const filter = buildSermonFilter(req.query, true);
    const [sermons, total, categories, preachers] = await Promise.all([
      Sermon.find(filter).sort(getSermonSort(req.query.sort)).skip((page - 1) * limit).limit(limit),
      Sermon.countDocuments(filter),
      Sermon.distinct("category", { isPublished: true }),
      Sermon.distinct("preacher", { isPublished: true })
    ]);

    res.json({
      sermons: sermons.map(serializeSermon),
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
      categories: categories.filter(Boolean).sort(),
      preachers: preachers.filter(Boolean).sort()
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.get("/api/sermons/featured", async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    const [featured, latest] = await Promise.all([
      Sermon.find({ isPublished: true, isFeatured: true }).sort({ sermonDate: -1 }).limit(3),
      Sermon.find({ isPublished: true }).sort({ sermonDate: -1 }).limit(6)
    ]);

    res.json({
      featured: featured.map(serializeSermon),
      latest: latest.map(serializeSermon)
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.get("/api/sermons/:id", async (req, res) => {
  try {
    const sermon = await Sermon.findOne({ _id: req.params.id, isPublished: true });
    if (!sermon) return res.status(404).json({ message: "Sermon not found." });
    const related = await getRelatedSermons(sermon);
    res.json({ sermon: serializeSermon(sermon), related: related.map(serializeSermon) });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post("/api/sermons/:id/view", async (req, res) => {
  try {
    const sermon = await Sermon.findOneAndUpdate(
      { _id: req.params.id, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!sermon) return res.status(404).json({ message: "Sermon not found." });
    res.json({ views: sermon.views });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post("/api/sermons/:id/download", async (req, res) => {
  try {
    const type = req.body.type === "word" ? "word" : "pdf";
    const increments = type === "word"
      ? { "downloads.word": 1, "downloads.total": 1 }
      : { "downloads.pdf": 1, "downloads.total": 1 };
    const sermon = await Sermon.findOneAndUpdate(
      { _id: req.params.id, isPublished: true },
      { $inc: increments },
      { new: true }
    );
    if (!sermon) return res.status(404).json({ message: "Sermon not found." });
    res.json({ url: type === "word" ? sermon.wordUrl : sermon.pdfUrl, downloads: sermon.downloads });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.get("/api/admin/sermons", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const filter = buildSermonFilter(req.query, false);
    const [sermons, total] = await Promise.all([
      Sermon.find(filter).sort(getSermonSort(req.query.sort)).skip((page - 1) * limit).limit(limit),
      Sermon.countDocuments(filter)
    ]);
    res.json({ sermons: sermons.map(serializeSermon), page, pages: Math.ceil(total / limit) || 1, total });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.get("/api/admin/sermons/analytics", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const [totalSermons, publishedSermons, counters, mostRead] = await Promise.all([
      Sermon.countDocuments(),
      Sermon.countDocuments({ isPublished: true }),
      Sermon.aggregate([{ $group: { _id: null, views: { $sum: "$views" }, downloads: { $sum: "$downloads.total" } } }]),
      Sermon.findOne().sort({ views: -1, sermonDate: -1 })
    ]);

    res.json({
      totalSermons,
      publishedSermons,
      draftSermons: totalSermons - publishedSermons,
      totalViews: counters[0]?.views || 0,
      totalDownloads: counters[0]?.downloads || 0,
      mostRead: mostRead ? serializeSermon(mostRead) : null
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post(
  "/api/admin/sermons",
  uploadLimiter,
  verifyToken,
  requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN),
  sermonUpload.fields([{ name: "cover", maxCount: 1 }, { name: "pdf", maxCount: 1 }, { name: "word", maxCount: 1 }]),
  async (req, res) => {
    try {
      if (!validateSermonUploads(req.files)) {
        return res.status(400).json({ message: "One or more sermon files are invalid." });
      }

      const payload = buildSermonPayload(req.body, req.files);
      if (!payload.title || !payload.preacher || !payload.scripture || !payload.sermonDate || !payload.pdfUrl || !payload.wordUrl) {
        removeUploadedFiles(Object.values(req.files || {}).flat());
        return res.status(400).json({ message: "Title, preacher, scripture, date, PDF, and Word document are required." });
      }

      const sermon = await Sermon.create(payload);
      res.status(201).json({ message: "Sermon created.", sermon: serializeSermon(sermon) });
    } catch (err) {
      handleServerError(res, err);
    }
  }
);

app.put(
  "/api/admin/sermons/:id",
  uploadLimiter,
  verifyToken,
  requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN),
  sermonUpload.fields([{ name: "cover", maxCount: 1 }, { name: "pdf", maxCount: 1 }, { name: "word", maxCount: 1 }]),
  async (req, res) => {
    try {
      if (!validateSermonUploads(req.files)) {
        return res.status(400).json({ message: "One or more sermon files are invalid." });
      }

      const sermon = await Sermon.findById(req.params.id);
      if (!sermon) {
        removeUploadedFiles(Object.values(req.files || {}).flat());
        return res.status(404).json({ message: "Sermon not found." });
      }

      const payload = buildSermonPayload(req.body, req.files, sermon);
      removeSermonFiles(sermon, payload);
      Object.assign(sermon, payload);
      await sermon.save();
      res.json({ message: "Sermon updated.", sermon: serializeSermon(sermon) });
    } catch (err) {
      handleServerError(res, err);
    }
  }
);

app.patch("/api/admin/sermons/:id/publish", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const isPublished = parseBoolean(req.body.isPublished);
    const sermon = await Sermon.findByIdAndUpdate(
      req.params.id,
      { isPublished, publishedAt: isPublished ? new Date() : undefined },
      { new: true }
    );
    if (!sermon) return res.status(404).json({ message: "Sermon not found." });
    res.json({ message: isPublished ? "Sermon published." : "Sermon unpublished.", sermon: serializeSermon(sermon) });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete("/api/admin/sermons/:id", verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN), async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ message: "Sermon not found." });
    deleteSermonFiles(sermon);
    await sermon.deleteOne();
    res.json({ message: "Sermon deleted." });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post("/api/gallery/upload", uploadLimiter, verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.MEDIA_PHOTOS_ADMIN), upload.array("media", MAX_GALLERY_FILES), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }
    if (!validateUploadedFiles(req.files)) {
      return res.status(400).json({ message: "One or more uploaded files did not match an allowed media type." });
    }
    const files = req.files.map((file) => {
      const isVideo = /mp4|mov|avi|webm|mkv/.test(path.extname(file.originalname).toLowerCase().slice(1));
      return {
        url: `/uploads/${file.filename}`,
        type: isVideo ? "video" : "image"
      };
    });

    const folderTitle = req.body.folder ? truncateText(req.body.folder, 150) : `Upload - ${new Date().toLocaleDateString("en-KE")}`;

    const media = new Media({
      title: folderTitle,
      description: truncateText(req.body.description || "", 1000),
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
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    const items = await Media.find().sort({ uploadedAt: -1 }).lean();
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
        const filePath = resolveUploadPath(f.url);
        if (filePath && fs.existsSync(filePath)) {
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
app.post("/api/ministers", uploadLimiter, verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.MEDIA_PHOTOS_ADMIN), upload.single("photo"), async (req, res) => {
  try {
    if (req.file && !validateUploadedFiles(req.file)) {
      return res.status(400).json({ message: "Uploaded file content does not match an allowed media type." });
    }
    const { name, role, bio, order } = req.body;
    if (!name || !role) {
      removeUploadedFiles([req.file]);
      return res.status(400).json({ message: "Name and role are required." });
    }

    let photoUrl = req.file ? `/uploads/${req.file.filename}` : "";
    if (!req.file && req.body.photoUrl) {
      const galleryPhotoUrl = normalizeExistingUploadImageUrl(req.body.photoUrl);
      if (!galleryPhotoUrl || !(await isGalleryImageUrl(galleryPhotoUrl))) {
        return res.status(400).json({ message: "Gallery photo URL must point to an existing gallery image." });
      }
      photoUrl = galleryPhotoUrl;
    }

    const minister = new Minister({
      name: truncateText(name, 120),
      role: truncateText(role, 120),
      bio: truncateText(bio || "", 2000),
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
app.put("/api/ministers/:id", uploadLimiter, verifyToken, requireAdminRoles(ROLES.SUPER_ADMIN, ROLES.MEDIA_PHOTOS_ADMIN), upload.single("photo"), async (req, res) => {
  try {
    if (req.file && !validateUploadedFiles(req.file)) {
      return res.status(400).json({ message: "Uploaded file content does not match an allowed media type." });
    }
    const minister = await Minister.findById(req.params.id);
    if (!minister) return res.status(404).json({ message: "Minister not found." });

    const { name, role, bio, order } = req.body;
    if (name)  minister.name  = truncateText(name, 120);
    if (role)  minister.role  = truncateText(role, 120);
    if (bio !== undefined) minister.bio = truncateText(bio, 2000);
    if (order !== undefined) minister.order = Number(order);

    if (req.file) {
      await deleteMinisterPhotoIfOrphan(minister.photoUrl, minister._id);
      minister.photoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.photoUrl) {
      const galleryPhotoUrl = normalizeExistingUploadImageUrl(req.body.photoUrl);
      if (!galleryPhotoUrl || !(await isGalleryImageUrl(galleryPhotoUrl))) {
        return res.status(400).json({ message: "Gallery photo URL must point to an existing gallery image." });
      }
      if (galleryPhotoUrl !== minister.photoUrl) {
        await deleteMinisterPhotoIfOrphan(minister.photoUrl, minister._id);
      }
      minister.photoUrl = galleryPhotoUrl;
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

    await deleteMinisterPhotoIfOrphan(minister.photoUrl, minister._id);
    await minister.deleteOne();
    res.json({ message: "Minister deleted." });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ message: err.message });
  }

  if (err?.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }

  const uploadMessages = [
    "Only images and videos are allowed.",
    "Cover image must be JPG, PNG, or WEBP.",
    "Sermon PDF must be a valid PDF file.",
    "Sermon Word document must be DOC or DOCX.",
    "Unexpected sermon upload field."
  ];

  if (uploadMessages.includes(err?.message)) {
    return res.status(400).json({ message: err.message });
  }

  next(err);
});

/* SERVER */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  logInfo("Server started", { port: PORT });
});
