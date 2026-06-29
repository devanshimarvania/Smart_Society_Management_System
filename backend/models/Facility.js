const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["gym", "swimming-pool", "club-house", "party-hall", "other"],
      required: true,
    },
    capacity: {
      type: Number,
      default: 1,
    },
    openTime: {
      type: String, // e.g. "06:00"
      default: "06:00",
    },
    closeTime: {
      type: String, // e.g. "22:00"
      default: "22:00",
    },
    bookingFee: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Facility", facilitySchema);
