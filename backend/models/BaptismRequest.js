import mongoose from "mongoose";

const baptismRequestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  age: { type: Number },
  preferredDate: { type: Date, required: true },
  status: { type: String, default: "Pending", enum: ["Pending", "Completed"] }
}, { timestamps: true });

const BaptismRequest = mongoose.model("BaptismRequest", baptismRequestSchema);
export default BaptismRequest;
