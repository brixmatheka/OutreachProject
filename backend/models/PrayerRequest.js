import mongoose from "mongoose";

const prayerRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    enum: ["health", "family", "finances", "spiritual", "grief", "work", "marriage", "salvation", "guidance", "other", ""],
    default: "",
  },
  urgency: {
    type: String,
    enum: ["standard", "urgent"],
    default: "standard",
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  wantsCallback: {
    type: Boolean,
    default: false,
  },
  preferredContactMethod: {
    type: String,
    enum: ["phone", "whatsapp", "email", ""],
    default: "",
  },
  preferredContactTime: {
    type: String,
    enum: ["morning", "afternoon", "evening", "anytime", ""],
    default: "",
  },
  request: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  prayedAt: {
    type: Date,
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },
  archivedAt: {
    type: Date,
  },
}, { timestamps: true });

prayerRequestSchema.index({ isArchived: 1, isRead: 1, createdAt: -1 });
prayerRequestSchema.index({ category: 1, urgency: 1, createdAt: -1 });

const PrayerRequest = mongoose.model("PrayerRequest", prayerRequestSchema);

export default PrayerRequest;
