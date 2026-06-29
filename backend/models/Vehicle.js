const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["car", "bike", "scooter", "bicycle", "other"],
      required: [true, "Vehicle type is required"],
    },
    brand: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    parkingSlot: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
