const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Poll question is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    options: {
      type: [pollOptionSchema],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "A poll must have at least 2 options",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: [true, "Poll expiry date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", pollSchema);
