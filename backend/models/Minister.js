import mongoose from 'mongoose';

const ministerSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  role:     { type: String, required: true },
  bio:      { type: String, default: '' },
  photoUrl: { type: String, default: '' },   // e.g. /uploads/1234567-photo.jpg
  order:    { type: Number, default: 0 },    // for display ordering
  createdAt:{ type: Date, default: Date.now },
});

const Minister = mongoose.model('Minister', ministerSchema);
export default Minister;
