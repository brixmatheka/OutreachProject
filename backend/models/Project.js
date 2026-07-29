import mongoose from "mongoose";

export const PROJECT_STATUSES = Object.freeze([
  "Planned",
  "Upcoming",
  "Ongoing",
  "On Hold",
  "Completed",
  "Cancelled",
]);

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 180,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  status: {
    type: String,
    enum: PROJECT_STATUSES,
    default: "Ongoing",
  },
  owner: {
    type: String,
    trim: true,
    maxlength: 160,
    default: "",
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  budget: {
    type: Number,
    min: 0,
    default: null,
  },
  amountRaised: {
    type: Number,
    min: 0,
    default: null,
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  iconName: {
    type: String,
    default: "IconHammer",
  }
}, { timestamps: true });

projectSchema.index({ status: 1, startDate: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
