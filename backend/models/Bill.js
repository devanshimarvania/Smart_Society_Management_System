const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    billMonth: {
      type: String, // format: "YYYY-MM", e.g. "2026-06"
      required: [true, "Bill month is required"],
    },
    baseAmount: {
      type: Number,
      required: [true, "Base maintenance amount is required"],
      min: 0,
    },
    penaltyAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

billSchema.index({ flat: 1, billMonth: 1 }, { unique: true });

// Auto-generate a unique, human-readable invoice number before saving
billSchema.pre("validate", function (next) {
  if (!this.invoiceNumber) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.invoiceNumber = `INV-${this.billMonth.replace("-", "")}-${random}`;
  }
  next();
});

module.exports = mongoose.model("Bill", billSchema);
