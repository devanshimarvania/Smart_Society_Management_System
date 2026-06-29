const mongoose = require("mongoose");

const flatSchema = new mongoose.Schema(
  {
    flatNumber: {
      type: String,
      required: [true, "Flat number is required"],
      unique: true,
      trim: true,
    },
    block: {
      type: String,
      required: [true, "Block/Wing is required"],
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, "Floor is required"],
    },
    type: {
      type: String,
      enum: ["1BHK", "2BHK", "3BHK", "4BHK", "Penthouse", "Other"],
      default: "2BHK",
    },
    area: {
      type: Number, // in sq. ft.
      default: 0,
    },
    occupancyStatus: {
      type: String,
      enum: ["vacant", "owner-occupied", "rented"],
      default: "vacant",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
    },
    maintenanceAmount: {
      type: Number,
      default: 0, // base monthly maintenance for this flat, used by billing module
    },
  },
  { timestamps: true }
);

flatSchema.index({ block: 1, flatNumber: 1 }, { unique: true });

module.exports = mongoose.model("Flat", flatSchema);
