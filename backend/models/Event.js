import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
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
