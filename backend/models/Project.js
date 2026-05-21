import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Ongoing", "Upcoming"],
    default: "Ongoing",
  },
  iconName: {
    type: String,
    default: "IconHammer",
  }
}, { timestamps: true });

const Project = mongoose.model("Project", projectSchema);

export default Project;
