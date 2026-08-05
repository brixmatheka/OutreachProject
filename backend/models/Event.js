import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  contentType: { type: String, enum: ["event", "announcement"], default: "event", index: true },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
  },
  time: {
    type: String,
  },
  banner: {
    type: String,
    default: "",
  },
  pdfUrl: { type: String, default: "" },
  category: { type: String, default: "General" },
  targetAudience: { type: String, enum: ["Everyone", "Members", "Leaders", "Youth", "Choir", "Women", "Men", "Children", "Visitors"], default: "Everyone" },
  expiryDate: { type: Date },
  isPinned: { type: Boolean, default: false },
  attendeesCount: {
    type: Number,
    default: 0,
  },
  eventCode: {
    type: String,
  },
  attendees: [
    {
      name: String,
      memberId: String,
      idNo: String,
      idNumber: String,
      phone: String,
    }
  ]
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);

export default Event;
