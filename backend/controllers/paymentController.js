const Payment = require("../models/Payment");
const Bill = require("../models/Bill");
const Resident = require("../models/Resident");

// @desc    Admin records a payment against a bill (marks bill as paid)
// @route   POST /api/payments
// @access  Private (admin only)
const recordPayment = async (req, res, next) => {
  try {
    const { billId, amountPaid, paymentMethod, transactionRef } = req.body;

    if (!billId || !amountPaid) {
      res.statusCode = 400;
      throw new Error("billId and amountPaid are required");
    }

    const bill = await Bill.findById(billId);
    if (!bill) {
      res.statusCode = 404;
      throw new Error("Bill not found");
    }

    if (bill.status === "paid") {
      res.statusCode = 400;
      throw new Error("This bill has already been paid");
    }

    if (Number(amountPaid) < bill.totalAmount) {
      res.statusCode = 400;
      throw new Error(
        `Amount paid (₹${amountPaid}) is less than the total amount due (₹${bill.totalAmount})`
      );
    }

    const payment = await Payment.create({
      bill: billId,
      resident: bill.resident,
      amountPaid,
      paymentMethod,
      transactionRef,
      recordedBy: req.user._id,
    });

    bill.status = "paid";
    await bill.save();

    res.status(201).json({
      success: true,
      message: "Payment recorded and bill marked as paid",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (admin) with optional filters
// @route   GET /api/payments?resident=residentId&paymentMethod=upi
// @access  Private (admin only)
const getPayments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.resident) filter.resident = req.query.resident;
    if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;

    const payments = await Payment.find(filter)
      .populate("bill", "invoiceNumber billMonth totalAmount")
      .populate({
        path: "resident",
        populate: { path: "user", select: "name phone" },
      })
      .populate("recordedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in resident's own payment history
// @route   GET /api/payments/me
// @access  Private (resident only)
const getMyPayments = async (req, res, next) => {
  try {
    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const payments = await Payment.find({ resident: resident._id })
      .populate("bill", "invoiceNumber billMonth totalAmount")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { recordPayment, getPayments, getMyPayments };
