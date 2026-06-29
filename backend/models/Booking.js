const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    startTime: {
      type: String, // e.g. "18:00"
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String, // e.g. "20:00"
      required: [true, "End time is required"],
    },
    purpose: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    feeCharged: {
      type: Number,
      default: 0,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent exact duplicate slot bookings for the same facility/date/time
bookingSchema.index({ facility: 1, bookingDate: 1, startTime: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
