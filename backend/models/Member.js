import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  memberId: { type: String, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  residence: { type: String, required: true },
  gender: { type: String, required: true },
  age: { type: Number },
  dateOfBirth: { type: Date },
  idNo: { type: String },
  isBaptized: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

const Member = mongoose.model("Member", memberSchema);
export default Member;
