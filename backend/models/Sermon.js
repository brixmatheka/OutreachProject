import mongoose from "mongoose";

const sermonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  preacher: { type: String, required: true, trim: true },
  scripture: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  sermonDate: { type: Date, required: true },
  summary: { type: String, default: "", trim: true },
  tags: [{ type: String, trim: true }],
  coverImage: { type: String, default: "" },
  pdfUrl: { type: String, required: true },
  wordUrl: { type: String, required: true },
  isPublished: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  publishedAt: { type: Date },
  views: { type: Number, default: 0 },
  downloads: {
    pdf: { type: Number, default: 0 },
    word: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }
}, { timestamps: true });

const Sermon = mongoose.model("Sermon", sermonSchema);

export default Sermon;
