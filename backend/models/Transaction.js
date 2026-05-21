import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  firstName: { type: String, default: "Guest" },
  lastName: { type: String, default: "" },
  memberId: { type: String, default: "0000" },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  merchantRequestId: { type: String, required: true },
  checkoutRequestId: { type: String, required: true },
  status: { type: String, default: "Pending" }, // Pending, Completed, Failed
  mpesaReceiptNumber: { type: String },
  resultCode: { type: Number },
  resultDesc: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
