const mongoose = require("mongoose");

const residentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one Resident profile per User account
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "Flat assignment is required"],
    },
    residentType: {
      type: String,
      enum: ["owner", "tenant"],
      default: "owner",
    },
    moveInDate: {
      type: Date,
      default: Date.now,
    },
    moveOutDate: {
      type: Date,
      default: null,
    },
    emergencyContact: {
      name: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true, // false once a resident moves out
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resident", residentSchema);
