import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema({
  actorEmail: { type: String, required: true, index: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true, index: true },
  resourceType: { type: String, required: true, index: true },
  reportId: { type: String, index: true },
  reportTitle: { type: String },
  format: { type: String },
  recordCount: { type: Number, min: 0 },
  filters: { type: mongoose.Schema.Types.Mixed },
  requestId: { type: String, required: true, index: true },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

adminAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AdminAuditLog", adminAuditLogSchema);
