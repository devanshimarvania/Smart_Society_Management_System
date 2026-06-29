const Complaint = require("../models/Complaint");
const Resident = require("../models/Resident");
const User = require("../models/User");
const { createNotification, createNotificationForMany } = require("../utils/notify");

// @desc    Resident raises a new complaint
// @route   POST /api/complaints
// @access  Private (resident only)
const raiseComplaint = async (req, res, next) => {
  try {
    const { category, title, description, priority } = req.body;

    if (!category || !title || !description) {
      res.statusCode = 400;
      throw new Error("category, title, and description are required");
    }

    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const complaint = await Complaint.create({
      raisedBy: resident._id,
      flat: resident.flat,
      category,
      title,
      description,
      priority: priority || "medium",
      images,
      status: "raised",
      timeline: [
        {
          status: "raised",
          note: "Complaint raised by resident",
          updatedBy: req.user._id,
        },
      ],
    });

    const populated = await Complaint.findById(complaint._id)
      .populate("flat", "flatNumber block")
      .populate({
        path: "raisedBy",
        populate: { path: "user", select: "name phone" },
      });

    const admins = await User.find({ role: "admin", isActive: true }).select("_id");
    await createNotificationForMany(
      admins.map((a) => a._id),
      {
        title: "New Complaint Raised",
        message: `${req.user.name} raised a "${category}" complaint: ${title}`,
        type: "complaint",
        relatedId: complaint._id,
      }
    );

    res.status(201).json({
      success: true,
      message: "Complaint raised successfully",
      complaint: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints (admin) with filters
// @route   GET /api/complaints?status=raised&category=plumbing&priority=high
// @access  Private (admin only)
const getComplaints = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    const complaints = await Complaint.find(filter)
      .populate("flat", "flatNumber block")
      .populate("assignedTo", "name phone")
      .populate({
        path: "raisedBy",
        populate: { path: "user", select: "name phone" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in resident's own complaints
// @route   GET /api/complaints/me
// @access  Private (resident only)
const getMyComplaints = async (req, res, next) => {
  try {
    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const complaints = await Complaint.find({ raisedBy: resident._id })
      .populate("flat", "flatNumber block")
      .populate("assignedTo", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaints assigned to the logged-in maintenance staff
// @route   GET /api/complaints/assigned-to-me
// @access  Private (maintenance only)
const getAssignedComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ assignedTo: req.user._id })
      .populate("flat", "flatNumber block")
      .populate({
        path: "raisedBy",
        populate: { path: "user", select: "name phone" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private (admin, the resident who raised it, or the assigned maintenance staff)
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("flat", "flatNumber block")
      .populate("assignedTo", "name phone")
      .populate({
        path: "raisedBy",
        populate: { path: "user", select: "name phone" },
      })
      .populate("timeline.updatedBy", "name role");

    if (!complaint) {
      res.statusCode = 404;
      throw new Error("Complaint not found");
    }

    if (req.user.role === "resident") {
      const resident = await Resident.findOne({ user: req.user._id });
      if (
        !resident ||
        complaint.raisedBy._id.toString() !== resident._id.toString()
      ) {
        res.statusCode = 403;
        throw new Error("Access denied. This is not your complaint");
      }
    }

    if (
      req.user.role === "maintenance" &&
      (!complaint.assignedTo ||
        complaint.assignedTo._id.toString() !== req.user._id.toString())
    ) {
      res.statusCode = 403;
      throw new Error("Access denied. This complaint is not assigned to you");
    }

    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin assigns a complaint to a maintenance staff member
// @route   PUT /api/complaints/:id/assign
// @access  Private (admin only)
const assignComplaint = async (req, res, next) => {
  try {
    const { staffId } = req.body;

    if (!staffId) {
      res.statusCode = 400;
      throw new Error("staffId is required");
    }

    const staff = await User.findById(staffId);
    if (!staff || staff.role !== "maintenance") {
      res.statusCode = 400;
      throw new Error("staffId must refer to a valid maintenance staff user");
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.statusCode = 404;
      throw new Error("Complaint not found");
    }

    complaint.assignedTo = staffId;
    complaint.status = "assigned";
    complaint.timeline.push({
      status: "assigned",
      note: `Assigned to ${staff.name}`,
      updatedBy: req.user._id,
    });

    await complaint.save();

    const residentDoc = await Resident.findById(complaint.raisedBy);
    if (residentDoc) {
      await createNotification({
        recipient: residentDoc.user,
        title: "Complaint Assigned",
        message: `Your complaint "${complaint.title}" has been assigned to ${staff.name}`,
        type: "complaint",
        relatedId: complaint._id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Complaint assigned successfully",
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Maintenance staff updates complaint status (in-progress / completed)
// @route   PUT /api/complaints/:id/status
// @access  Private (maintenance only - must be assigned to them)
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const allowedStatuses = ["in-progress", "completed"];
    if (!allowedStatuses.includes(status)) {
      res.statusCode = 400;
      throw new Error(`status must be one of: ${allowedStatuses.join(", ")}`);
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.statusCode = 404;
      throw new Error("Complaint not found");
    }

    if (
      !complaint.assignedTo ||
      complaint.assignedTo.toString() !== req.user._id.toString()
    ) {
      res.statusCode = 403;
      throw new Error("Access denied. This complaint is not assigned to you");
    }

    if (status === "completed" && req.files && req.files.length > 0) {
      complaint.completionImages = req.files.map(
        (f) => `/uploads/${f.filename}`
      );
    }

    complaint.status = status;
    complaint.timeline.push({
      status,
      note: note || "",
      updatedBy: req.user._id,
    });

    await complaint.save();

    const residentDoc = await Resident.findById(complaint.raisedBy);
    if (residentDoc) {
      const statusLabel = status === "completed" ? "marked as completed" : "now in progress";
      await createNotification({
        recipient: residentDoc.user,
        title: "Complaint Update",
        message: `Your complaint "${complaint.title}" is ${statusLabel}`,
        type: "complaint",
        relatedId: complaint._id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin closes a completed complaint, or resident reopens it
// @route   PUT /api/complaints/:id/close
// @route   PUT /api/complaints/:id/reopen
// @access  Private (admin for close, resident for reopen)
const closeComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.statusCode = 404;
      throw new Error("Complaint not found");
    }

    if (complaint.status !== "completed") {
      res.statusCode = 400;
      throw new Error("Only completed complaints can be closed");
    }

    complaint.status = "closed";
    complaint.timeline.push({
      status: "closed",
      note: "Complaint closed by admin",
      updatedBy: req.user._id,
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint closed successfully",
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

const reopenComplaint = async (req, res, next) => {
  try {
    const { note } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.statusCode = 404;
      throw new Error("Complaint not found");
    }

    const resident = await Resident.findOne({ user: req.user._id });
    if (
      !resident ||
      complaint.raisedBy.toString() !== resident._id.toString()
    ) {
      res.statusCode = 403;
      throw new Error("Access denied. This is not your complaint");
    }

    if (!["completed", "closed"].includes(complaint.status)) {
      res.statusCode = 400;
      throw new Error("Only completed or closed complaints can be reopened");
    }

    complaint.status = "reopened";
    complaint.timeline.push({
      status: "reopened",
      note: note || "Resident reopened the complaint",
      updatedBy: req.user._id,
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint reopened successfully",
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a complaint
// @route   DELETE /api/complaints/:id
// @access  Private (admin only)
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.statusCode = 404;
      throw new Error("Complaint not found");
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  raiseComplaint,
  getComplaints,
  getMyComplaints,
  getAssignedComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  closeComplaint,
  reopenComplaint,
  deleteComplaint,
};
