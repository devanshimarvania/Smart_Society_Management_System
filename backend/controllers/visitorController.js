const Visitor = require("../models/Visitor");
const Flat = require("../models/Flat");
const Resident = require("../models/Resident");
const { createNotification } = require("../utils/notify");

// @desc    Security adds a new visitor entry (defaults to pending approval)
// @route   POST /api/visitors
// @access  Private (security only)
const addVisitor = async (req, res, next) => {
  try {
    const { name, phone, purpose, visitingFlatId, vehicleNumber, notes } =
      req.body;

    if (!name || !phone || !visitingFlatId) {
      res.statusCode = 400;
      throw new Error("name, phone, and visitingFlatId are required");
    }

    const flat = await Flat.findById(visitingFlatId);
    if (!flat) {
      res.statusCode = 404;
      throw new Error("Flat not found");
    }

    // Resolve current resident (owner takes priority, else tenant)
    const visitingResidentId = flat.owner || flat.tenant || null;

    const photo = req.file ? `/uploads/${req.file.filename}` : "";

    // Delivery/cab/service entries are auto-approved since they don't
    // require resident sign-off the way a guest visit typically does.
    const autoApprovedPurposes = ["delivery", "cab", "service"];
    const approvalStatus = autoApprovedPurposes.includes(purpose)
      ? "approved"
      : "pending";

    const visitor = await Visitor.create({
      name,
      phone,
      purpose,
      visitingFlat: visitingFlatId,
      visitingResident: visitingResidentId,
      addedBySecurity: req.user._id,
      photo,
      vehicleNumber,
      notes,
      approvalStatus,
      approvedAt: approvalStatus === "approved" ? Date.now() : null,
    });

    const populated = await Visitor.findById(visitor._id)
      .populate("visitingFlat", "flatNumber block")
      .populate("addedBySecurity", "name");

    if (approvalStatus === "pending" && visitingResidentId) {
      const residentDoc = await Resident.findById(visitingResidentId);
      if (residentDoc) {
        await createNotification({
          recipient: residentDoc.user,
          title: "Visitor Approval Needed",
          message: `${name} is at the gate to visit you. Please approve or reject.`,
          type: "visitor",
          relatedId: visitor._id,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Visitor entry recorded successfully",
      visitor: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all visitors (admin/security) with filters
// @route   GET /api/visitors?status=inside&approvalStatus=pending&date=2026-06-27
// @access  Private (admin, security)
const getVisitors = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.approvalStatus)
      filter.approvalStatus = req.query.approvalStatus;
    if (req.query.purpose) filter.purpose = req.query.purpose;

    if (req.query.date) {
      const startOfDay = new Date(req.query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(req.query.date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const visitors = await Visitor.find(filter)
      .populate("visitingFlat", "flatNumber block")
      .populate("addedBySecurity", "name")
      .populate({
        path: "visitingResident",
        populate: { path: "user", select: "name phone" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending visitor approvals for the logged-in resident's flat
// @route   GET /api/visitors/pending-for-me
// @access  Private (resident only)
const getPendingForResident = async (req, res, next) => {
  try {
    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const visitors = await Visitor.find({
      visitingFlat: resident.flat,
      approvalStatus: "pending",
    })
      .populate("addedBySecurity", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visitor history for the logged-in resident's flat
// @route   GET /api/visitors/my-history
// @access  Private (resident only)
const getMyVisitorHistory = async (req, res, next) => {
  try {
    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const visitors = await Visitor.find({ visitingFlat: resident.flat })
      .populate("addedBySecurity", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resident approves or rejects a visitor
// @route   PUT /api/visitors/:id/approval
// @access  Private (resident only)
const updateApprovalStatus = async (req, res, next) => {
  try {
    const { approvalStatus } = req.body;

    if (!["approved", "rejected"].includes(approvalStatus)) {
      res.statusCode = 400;
      throw new Error("approvalStatus must be 'approved' or 'rejected'");
    }

    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      res.statusCode = 404;
      throw new Error("Visitor not found");
    }

    const resident = await Resident.findOne({ user: req.user._id });
    if (
      !resident ||
      visitor.visitingFlat.toString() !== resident.flat.toString()
    ) {
      res.statusCode = 403;
      throw new Error("Access denied. This visitor is not visiting your flat");
    }

    visitor.approvalStatus = approvalStatus;
    visitor.approvedAt = Date.now();
    await visitor.save();

    await createNotification({
      recipient: visitor.addedBySecurity,
      title: "Visitor Approval Update",
      message: `Visitor "${visitor.name}" was ${approvalStatus} by the resident`,
      type: "visitor",
      relatedId: visitor._id,
    });

    res.status(200).json({
      success: true,
      message: `Visitor ${approvalStatus} successfully`,
      visitor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark visitor exit
// @route   PUT /api/visitors/:id/exit
// @access  Private (security only)
const markExit = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      res.statusCode = 404;
      throw new Error("Visitor not found");
    }

    if (visitor.status === "exited") {
      res.statusCode = 400;
      throw new Error("This visitor has already exited");
    }

    visitor.status = "exited";
    visitor.exitTime = Date.now();
    await visitor.save();

    res.status(200).json({
      success: true,
      message: "Visitor exit recorded successfully",
      visitor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single visitor by ID
// @route   GET /api/visitors/:id
// @access  Private (admin, security, resident of that flat)
const getVisitorById = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate("visitingFlat", "flatNumber block")
      .populate("addedBySecurity", "name");

    if (!visitor) {
      res.statusCode = 404;
      throw new Error("Visitor not found");
    }

    if (req.user.role === "resident") {
      const resident = await Resident.findOne({ user: req.user._id });
      if (
        !resident ||
        visitor.visitingFlat._id.toString() !== resident.flat.toString()
      ) {
        res.statusCode = 403;
        throw new Error("Access denied");
      }
    }

    res.status(200).json({
      success: true,
      visitor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addVisitor,
  getVisitors,
  getPendingForResident,
  getMyVisitorHistory,
  updateApprovalStatus,
  markExit,
  getVisitorById,
};
