import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  firstName: { type: String, default: "Guest" },
  lastName: { type: String, default: "" },
  memberId: { type: String, default: "0000" },
  phone: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  category: { type: String, required: true },
  merchantRequestId: { type: String, required: true },
  checkoutRequestId: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending", index: true },
  mpesaReceiptNumber: { type: String },
  paidAt: { type: Date },
  verifiedAt: { type: Date },
  resultCode: { type: Number },
  resultDesc: { type: String },
}, { timestamps: true });

transactionSchema.index({ category: 1, createdAt: -1 });
transactionSchema.index({ checkoutRequestId: 1 });
transactionSchema.index({ mpesaReceiptNumber: 1 }, { sparse: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
