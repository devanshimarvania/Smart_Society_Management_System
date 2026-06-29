const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Visitor name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Visitor phone is required"],
      trim: true,
    },
    purpose: {
      type: String,
      enum: ["guest", "delivery", "cab", "service", "vendor", "other"],
      default: "guest",
    },
    visitingFlat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "The flat being visited is required"],
    },
    visitingResident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      default: null, // resolved at entry time from visitingFlat's current occupant
    },
    addedBySecurity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photo: {
      type: String,
      default: "",
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: "",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    entryTime: {
      type: Date,
      default: Date.now,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["inside", "exited"],
      default: "inside",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

visitorSchema.index({ visitingFlat: 1, createdAt: -1 });

module.exports = mongoose.model("Visitor", visitorSchema);
