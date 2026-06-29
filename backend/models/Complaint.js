const mongoose = require("mongoose");

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["raised", "assigned", "in-progress", "completed", "closed", "reopened"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "plumbing",
        "electrical",
        "housekeeping",
        "security",
        "lift",
        "parking",
        "noise",
        "other",
      ],
      required: [true, "Category is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    images: [
      {
        type: String, // file paths e.g. /uploads/filename.jpg
      },
    ],
    completionImages: [
      {
        type: String,
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["raised", "assigned", "in-progress", "completed", "closed", "reopened"],
      default: "raised",
    },
    timeline: [timelineEntrySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
