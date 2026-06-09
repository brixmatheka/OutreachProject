import mongoose from 'mongoose';

const mediaFileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true }
});

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  coverUrl: { type: String },
  files: [mediaFileSchema],
  uploadedAt: { type: Date, default: Date.now }
});

const Media = mongoose.model('Media', mediaSchema);
export default Media;
