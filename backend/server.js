import express from "express";
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

import Event from "./models/Event.js";
import PrayerRequest from "./models/PrayerRequest.js";
import Transaction from "./models/Transaction.js";
import Project from "./models/Project.js";
import Member from "./models/Member.js";
import BaptismRequest from "./models/BaptismRequest.js";

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

/* MongoDB Connection */
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
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
      console.log("Database update genders to Female result:", updateResult);
    } catch (updateErr) {
      console.error("Failed to update female genders:", updateErr.message);
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
        console.log(`Found ${missingReceiptTransactions.length} completed transactions with missing receipt numbers. Migrating...`);
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (const t of missingReceiptTransactions) {
          let mockReceipt = "NL";
          for (let i = 0; i < 8; i++) {
            mockReceipt += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          t.mpesaReceiptNumber = mockReceipt;
          await t.save();
        }
        console.log("✅ Migration of completed transaction receipt numbers successful!");
      }
    } catch (migErr) {
      console.error("Failed to migrate transaction receipt numbers:", migErr.message);
    }

    // Migration to sync completed baptism requests with member records
    try {
      const completedBaptisms = await BaptismRequest.find({ status: "Completed" });
      if (completedBaptisms.length > 0) {
        console.log(`Found ${completedBaptisms.length} completed baptisms. Syncing with member records...`);
        let syncedCount = 0;
        for (const req of completedBaptisms) {
          const result = await Member.findOneAndUpdate(
            { email: { $regex: new RegExp(`^${req.email}$`, "i") }, isBaptized: { $ne: true } },
            { isBaptized: true }
          );
          if (result) syncedCount++;
        }
        if (syncedCount > 0) {
          console.log(`✅ Successfully synced ${syncedCount} member baptism records from Completed requests!`);
        }
      }
    } catch (syncErr) {
      console.error("Failed to sync member baptism records:", syncErr.message);
    }
  })
  .catch(err => console.error("❌ MongoDB Error:", err.message));

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
    console.log("Signup Request Body:", req.body);
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

    if (age && Number(age) < 5) {
      return res.status(400).json({ message: "You must be at least 5 years of age to register." });
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

    const token = jwt.sign({ id: member._id, email: member.email }, "membersecretkey", { expiresIn: "7d" });
    res.status(201).json({
      token,
      member: { id: member._id, memberId: member.memberId, firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone, idNo: member.idNo },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
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
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const valid = await bcrypt.compare(password, member.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ id: member._id, email: member.email }, "membersecretkey", { expiresIn: "7d" });
    res.json({
      token,
      member: { id: member._id, memberId: member.memberId, firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

/* GET ALL MEMBERS (admin only) */
app.get("/auth/members", verifyToken, async (req, res) => {
  try {
    const members = await Member.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).select("-passwordHash");
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

/* GET DELETED MEMBERS (admin only) */
app.get("/auth/members/deleted", verifyToken, async (req, res) => {
  try {
    const deleted = await Member.find({ isDeleted: true }).sort({ updatedAt: -1 }).select("-passwordHash");
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

/* DELETE MEMBER (soft delete, admin only) */
app.delete("/auth/members/:id", verifyToken, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

/* RESTORE DELETED MEMBER (admin only) */
app.patch("/auth/members/:id/restore", verifyToken, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, { isDeleted: false }, { new: true });
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member successfully restored" });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

/* ADMIN LOGIN */
const ADMIN_EMAIL = "admin@ohc.com";
const ADMIN_PASSWORD = "123456";

app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email }, "secretkey", { expiresIn: "8h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

/* TOKEN MIDDLEWARE (Admin) */
function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err) return res.status(401).json({ message: "Admin session expired. Please log in again." });
    next();
  });
}

/* TOKEN MIDDLEWARE (Member) */
function verifyMemberToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ message: "Authentication required." });

  jwt.verify(token, "membersecretkey", (err, decoded) => {
    if (err) return res.status(401).json({ message: "Session expired. Please log in again." });
    req.member = decoded;
    next();
  });
}

/* GET LOGGED IN MEMBER PROFILE */
app.get("/auth/me", verifyMemberToken, async (req, res) => {
  try {
    const member = await Member.findById(req.member.id).select("-passwordHash");
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

/* CREATE EVENT */
app.post("/events", verifyToken, async (req, res) => {
  const eventCode = "EVT-" + Math.floor(1000 + Math.random() * 9000);
  const event = new Event({ ...req.body, eventCode });
  await event.save();
  res.send("Event created");
});

/* GET EVENTS */
app.get("/events", async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

/* ATTEND EVENT */
app.post("/events/:id/attend", async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and Phone are required." });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.attendees.some(a => a.phone === phone)) {
      return res.status(400).json({ message: "You have already confirmed attendance." });
    }

    event.attendees.push({ name, phone });
    event.attendeesCount = event.attendees.length;
    await event.save();

    res.json({ message: "Attendance confirmed", attendeesCount: event.attendeesCount });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* DELETE EVENT */
app.delete("/events/:id", verifyToken, async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.send("Event deleted");
});

/* PROJECTS */
app.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/projects", verifyToken, async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json({ message: "Project created" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.delete("/projects/:id", verifyToken, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* GET ALL PRAYER REQUESTS (admin only) */
app.get("/prayer-requests", verifyToken, async (req, res) => {
  try {
    const prayerRequests = await PrayerRequest.find().sort({ createdAt: -1 });
    res.json(prayerRequests);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* DELETE PRAYER REQUEST (admin only) */
app.delete("/prayer-requests/:id", verifyToken, async (req, res) => {
  try {
    await PrayerRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Prayer request deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* UPDATE PRAYER REQUEST READ STATUS (admin only) */
app.patch("/prayer-requests/:id/read", verifyToken, async (req, res) => {
  try {
    const { isRead } = req.body;
    await PrayerRequest.findByIdAndUpdate(req.params.id, { isRead });
    res.json({ message: "Prayer request status updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* GET MY BAPTISM REQUESTS (member only) */
app.get("/api/my-baptism-requests", verifyMemberToken, async (req, res) => {
  try {
    const requests = await BaptismRequest.find({ email: req.member.email.toLowerCase() }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* GET ALL BAPTISM REQUESTS (admin only) */
app.get("/api/admin/baptism-requests", verifyToken, async (req, res) => {
  try {
    const baptismRequests = await BaptismRequest.find().sort({ createdAt: -1 });
    res.json(baptismRequests);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* UPDATE BAPTISM REQUEST STATUS (admin only) */
app.patch("/api/admin/baptism-requests/:id/status", verifyToken, async (req, res) => {
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* DELETE BAPTISM REQUEST (admin only) */
app.delete("/api/admin/baptism-requests/:id", verifyToken, async (req, res) => {
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   M-PESA DARAJA — STK PUSH
   ───────────────────────────────────────────────────────────────── */

// Helper: get Safaricom access token
async function getMpesaToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const env = process.env.MPESA_ENV === "production" ? "api" : "sandbox";

  const res = await fetch(
    `https://${env}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get M-Pesa token: " + JSON.stringify(data));
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
    console.log("STK Push result:", result);

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
    console.error("M-Pesa error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// M-Pesa callback (Safaricom posts here after payment)
app.post("/api/mpesa/callback", async (req, res) => {
  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      console.log("Invalid M-Pesa Callback format:", JSON.stringify(req.body, null, 2));
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid body format" });
    }

    const stkCallback = Body.stkCallback;
    console.log("M-Pesa Callback Received:", JSON.stringify(Body, null, 2));

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

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
      console.log(`✅ Transaction updated: ${checkoutRequestId} -> ${updateData.status}`);
    } else {
      console.log(`❌ Transaction NOT found in DB: ${checkoutRequestId}`);
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("Callback processing error:", err.message);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
  }
});

// GET Transactions (Admin only)
app.get("/api/admin/transactions", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
          console.log("STK Query result:", result);

          if (result.ResultCode === "0") {
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
          } else if (result.ResultCode && result.ResultCode !== "0") {
            transaction.status = "Failed";
            transaction.resultDesc = result.ResultDesc || "Transaction failed";
            await transaction.save();
          }
        }
      } catch (queryErr) {
        console.error("STK Query error:", queryErr.message);
      }
    }

    res.json({
      status: transaction.status,
      resultDesc: transaction.resultDesc,
      mpesaReceiptNumber: transaction.mpesaReceiptNumber
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* SERVER */
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
