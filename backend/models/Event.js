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
      idNumber: String,
      phone: String,
    }
  ]
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);

export default Event;
