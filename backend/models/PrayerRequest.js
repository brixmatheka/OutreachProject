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
}, { timestamps: true });

const PrayerRequest = mongoose.model("PrayerRequest", prayerRequestSchema);

export default PrayerRequest;
