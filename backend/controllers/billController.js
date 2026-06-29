const Bill = require("../models/Bill");
const Flat = require("../models/Flat");
const Resident = require("../models/Resident");
const { createNotification } = require("../utils/notify");

const PENALTY_PERCENTAGE = 2; // 2% of base amount per overdue check, applied once when marked overdue

// @desc    Generate a bill for a single flat
// @route   POST /api/bills
// @access  Private (admin only)
const generateBill = async (req, res, next) => {
  try {
    const { flatId, billMonth, baseAmount, dueDate, remarks } = req.body;

    if (!flatId || !billMonth || !dueDate) {
      res.statusCode = 400;
      throw new Error("flatId, billMonth, and dueDate are required");
    }

    const flat = await Flat.findById(flatId);
    if (!flat) {
      res.statusCode = 404;
      throw new Error("Flat not found");
    }

    const resident = await Resident.findOne({
      flat: flatId,
      isActive: true,
    });
    if (!resident) {
      res.statusCode = 400;
      throw new Error("This flat has no active resident to bill");
    }

    const existing = await Bill.findOne({ flat: flatId, billMonth });
    if (existing) {
      res.statusCode = 400;
      throw new Error(`A bill for ${billMonth} already exists for this flat`);
    }

    const finalBaseAmount = baseAmount ?? flat.maintenanceAmount ?? 0;

    const bill = await Bill.create({
      flat: flatId,
      resident: resident._id,
      billMonth,
      baseAmount: finalBaseAmount,
      penaltyAmount: 0,
      totalAmount: finalBaseAmount,
      dueDate,
      remarks,
    });

    await createNotification({
      recipient: resident.user,
      title: "New Maintenance Bill",
      message: `A bill of ₹${finalBaseAmount} for ${billMonth} has been generated. Due on ${new Date(dueDate).toLocaleDateString()}`,
      type: "payment",
      relatedId: bill._id,
    });

    res.status(201).json({
      success: true,
      message: "Bill generated successfully",
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk-generate bills for ALL occupied flats for a given month
// @route   POST /api/bills/bulk-generate
// @access  Private (admin only)
const bulkGenerateBills = async (req, res, next) => {
  try {
    const { billMonth, dueDate } = req.body;

    if (!billMonth || !dueDate) {
      res.statusCode = 400;
      throw new Error("billMonth and dueDate are required");
    }

    const residents = await Resident.find({ isActive: true }).populate("flat");

    const created = [];
    const skipped = [];

    for (const resident of residents) {
      if (!resident.flat) continue;

      const existing = await Bill.findOne({
        flat: resident.flat._id,
        billMonth,
      });

      if (existing) {
        skipped.push(resident.flat.flatNumber);
        continue;
      }

      const bill = await Bill.create({
        flat: resident.flat._id,
        resident: resident._id,
        billMonth,
        baseAmount: resident.flat.maintenanceAmount || 0,
        penaltyAmount: 0,
        totalAmount: resident.flat.maintenanceAmount || 0,
        dueDate,
      });

      created.push(bill);

      await createNotification({
        recipient: resident.user,
        title: "New Maintenance Bill",
        message: `A bill of ₹${bill.baseAmount} for ${billMonth} has been generated. Due on ${new Date(dueDate).toLocaleDateString()}`,
        type: "payment",
        relatedId: bill._id,
      });
    }

    res.status(201).json({
      success: true,
      message: `${created.length} bills generated, ${skipped.length} skipped (already existed)`,
      createdCount: created.length,
      skippedFlats: skipped,
      bills: created,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bills (admin) with filters
// @route   GET /api/bills?status=pending&billMonth=2026-06
// @access  Private (admin only)
const getBills = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.billMonth) filter.billMonth = req.query.billMonth;
    if (req.query.flat) filter.flat = req.query.flat;

    const bills = await Bill.find(filter)
      .populate("flat", "flatNumber block")
      .populate({
        path: "resident",
        populate: { path: "user", select: "name phone email" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      bills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in resident's own bills
// @route   GET /api/bills/me
// @access  Private (resident only)
const getMyBills = async (req, res, next) => {
  try {
    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const bills = await Bill.find({ resident: resident._id })
      .populate("flat", "flatNumber block")
      .sort({ billMonth: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      bills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single bill by ID
// @route   GET /api/bills/:id
// @access  Private (admin, or the owning resident)
const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("flat", "flatNumber block")
      .populate({
        path: "resident",
        populate: { path: "user", select: "name phone email" },
      });

    if (!bill) {
      res.statusCode = 404;
      throw new Error("Bill not found");
    }

    if (req.user.role === "resident") {
      const resident = await Resident.findOne({ user: req.user._id });
      if (!resident || bill.resident._id.toString() !== resident._id.toString()) {
        res.statusCode = 403;
        throw new Error("Access denied. This is not your bill");
      }
    }

    res.status(200).json({
      success: true,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply overdue penalty to a bill that's past due and still pending
// @route   PUT /api/bills/:id/apply-penalty
// @access  Private (admin only)
const applyPenalty = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      res.statusCode = 404;
      throw new Error("Bill not found");
    }

    if (bill.status === "paid") {
      res.statusCode = 400;
      throw new Error("Cannot apply penalty to an already paid bill");
    }

    if (new Date(bill.dueDate) >= new Date()) {
      res.statusCode = 400;
      throw new Error("This bill is not yet overdue");
    }

    const penalty = Math.round((bill.baseAmount * PENALTY_PERCENTAGE) / 100);
    bill.penaltyAmount = penalty;
    bill.totalAmount = bill.baseAmount + penalty;
    bill.status = "overdue";

    await bill.save();

    res.status(200).json({
      success: true,
      message: `Penalty of ₹${penalty} applied. Bill marked overdue`,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run penalty check across ALL pending overdue bills (batch operation)
// @route   POST /api/bills/run-overdue-check
// @access  Private (admin only)
const runOverdueCheck = async (req, res, next) => {
  try {
    const overdueBills = await Bill.find({
      status: "pending",
      dueDate: { $lt: new Date() },
    });

    let updatedCount = 0;
    for (const bill of overdueBills) {
      const penalty = Math.round((bill.baseAmount * PENALTY_PERCENTAGE) / 100);
      bill.penaltyAmount = penalty;
      bill.totalAmount = bill.baseAmount + penalty;
      bill.status = "overdue";
      await bill.save();
      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: `${updatedCount} bill(s) marked overdue with penalty applied`,
      updatedCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a bill (only if no payment has been made)
// @route   DELETE /api/bills/:id
// @access  Private (admin only)
const deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      res.statusCode = 404;
      throw new Error("Bill not found");
    }

    if (bill.status === "paid") {
      res.statusCode = 400;
      throw new Error("Cannot delete a bill that has already been paid");
    }

    await bill.deleteOne();

    res.status(200).json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateBill,
  bulkGenerateBills,
  getBills,
  getMyBills,
  getBillById,
  applyPenalty,
  runOverdueCheck,
  deleteBill,
};
