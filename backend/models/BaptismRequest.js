import mongoose from "mongoose";

const baptismRequestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  age: { type: Number },
  preferredDate: { type: Date, required: true },
  status: { type: String, default: "Pending", enum: ["Pending", "Completed"] },
  completedAt: { type: Date },
  isArchived: { type: Boolean, default: false, index: true },
  archivedAt: { type: Date }
}, { timestamps: true });

baptismRequestSchema.index({ isArchived: 1, status: 1, createdAt: -1 });

const BaptismRequest = mongoose.model("BaptismRequest", baptismRequestSchema);
export default BaptismRequest;
