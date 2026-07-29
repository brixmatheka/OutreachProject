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

const PrayerRequest = mongoose.model("PrayerRequest", prayerRequestSchema);

export default PrayerRequest;
