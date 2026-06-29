const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card", "bank-transfer", "cheque", "other"],
      default: "cash",
    },
    transactionRef: {
      type: String,
      trim: true,
      default: "",
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // admin who recorded the payment (manual entry for Phase 1 scope)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
