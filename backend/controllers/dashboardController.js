const User = require("../models/User");
const Resident = require("../models/Resident");
const Flat = require("../models/Flat");
const Complaint = require("../models/Complaint");
const Bill = require("../models/Bill");
const Payment = require("../models/Payment");
const Visitor = require("../models/Visitor");
const Booking = require("../models/Booking");
const Poll = require("../models/Poll");
const Notification = require("../models/Notification");

// @desc    Admin dashboard - overall society statistics
// @route   GET /api/dashboard/admin
// @access  Private (admin only)
const getAdminDashboard = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalResidents,
      totalFlats,
      vacantFlats,
      totalComplaints,
      pendingComplaints,
      totalBills,
      pendingBills,
      overdueBills,
      visitorsToday,
      pendingBookings,
      activePolls,
      monthlyPayments,
    ] = await Promise.all([
      Resident.countDocuments({ isActive: true }),
      Flat.countDocuments(),
      Flat.countDocuments({ occupancyStatus: "vacant" }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ["raised", "assigned", "in-progress"] } }),
      Bill.countDocuments(),
      Bill.countDocuments({ status: "pending" }),
      Bill.countDocuments({ status: "overdue" }),
      Visitor.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } }),
      Booking.countDocuments({ status: "pending" }),
      Poll.countDocuments({ isActive: true }),
      Payment.aggregate([
        { $match: { paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),
    ]);

    const totalRevenueThisMonth =
      monthlyPayments.length > 0 ? monthlyPayments[0].total : 0;

    // Complaint breakdown by category (for pie/bar chart)
    const complaintsByCategory = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Revenue trend - last 6 months (for line/bar chart)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const revenueTrend = await Payment.aggregate([
      { $match: { paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
          total: { $sum: "$amountPaid" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent activities feed (latest complaints + visitors + bookings combined)
    const recentComplaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title category status createdAt")
      .populate({ path: "raisedBy", populate: { path: "user", select: "name" } });

    const recentVisitors = await Visitor.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name purpose approvalStatus createdAt")
      .populate("visitingFlat", "flatNumber block");

    res.status(200).json({
      success: true,
      stats: {
        totalResidents,
        totalFlats,
        vacantFlats,
        occupiedFlats: totalFlats - vacantFlats,
        totalComplaints,
        pendingComplaints,
        totalBills,
        pendingBills,
        overdueBills,
        visitorsToday,
        pendingBookings,
        activePolls,
        totalRevenueThisMonth,
      },
      charts: {
        complaintsByCategory,
        revenueTrend,
      },
      recentActivity: {
        complaints: recentComplaints,
        visitors: recentVisitors,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resident dashboard - personal stats
// @route   GET /api/dashboard/resident
// @access  Private (resident only)
const getResidentDashboard = async (req, res, next) => {
  try {
    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const [
      myComplaints,
      openComplaints,
      myBills,
      pendingBills,
      myBookings,
      upcomingBookings,
      unreadNotificationsCount,
    ] = await Promise.all([
      Complaint.countDocuments({ raisedBy: resident._id }),
      Complaint.countDocuments({
        raisedBy: resident._id,
        status: { $in: ["raised", "assigned", "in-progress"] },
      }),
      Bill.countDocuments({ resident: resident._id }),
      Bill.find({ resident: resident._id, status: { $in: ["pending", "overdue"] } })
        .sort({ dueDate: 1 })
        .limit(5),
      Booking.countDocuments({ resident: resident._id }),
      Booking.find({
        resident: resident._id,
        status: "approved",
        bookingDate: { $gte: new Date() },
      })
        .sort({ bookingDate: 1 })
        .limit(5)
        .populate("facility", "name"),
      Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        myComplaints,
        openComplaints,
        myBills,
        myBookings,
        unreadNotificationsCount,
      },
      pendingBills,
      upcomingBookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Security dashboard - gate activity stats
// @route   GET /api/dashboard/security
// @access  Private (security only)
const getSecurityDashboard = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      visitorsToday,
      visitorsInside,
      pendingApprovals,
      deliveriesToday,
    ] = await Promise.all([
      Visitor.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } }),
      Visitor.countDocuments({ status: "inside" }),
      Visitor.countDocuments({ approvalStatus: "pending" }),
      Visitor.countDocuments({
        purpose: "delivery",
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      }),
    ]);

    const recentVisitors = await Visitor.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("visitingFlat", "flatNumber block");

    res.status(200).json({
      success: true,
      stats: {
        visitorsToday,
        visitorsInside,
        pendingApprovals,
        deliveriesToday,
      },
      recentVisitors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Maintenance staff dashboard - assigned complaint stats
// @route   GET /api/dashboard/maintenance
// @access  Private (maintenance only)
const getMaintenanceDashboard = async (req, res, next) => {
  try {
    const [
      totalAssigned,
      pendingWork,
      completedWork,
    ] = await Promise.all([
      Complaint.countDocuments({ assignedTo: req.user._id }),
      Complaint.countDocuments({
        assignedTo: req.user._id,
        status: { $in: ["assigned", "in-progress"] },
      }),
      Complaint.countDocuments({
        assignedTo: req.user._id,
        status: { $in: ["completed", "closed"] },
      }),
    ]);

    const assignedComplaints = await Complaint.find({
      assignedTo: req.user._id,
      status: { $in: ["assigned", "in-progress"] },
    })
      .sort({ priority: -1, createdAt: 1 })
      .populate("flat", "flatNumber block");

    res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        pendingWork,
        completedWork,
      },
      assignedComplaints,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getResidentDashboard,
  getSecurityDashboard,
  getMaintenanceDashboard,
};
