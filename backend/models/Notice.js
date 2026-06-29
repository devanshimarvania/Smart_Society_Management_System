const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["general", "event", "emergency", "maintenance", "announcement"],
      default: "general",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachment: {
      type: String,
      default: "",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null, // null = never expires
    },
  },
  { timestamps: true }
);

noticeSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model("Notice", noticeSchema);
