const Booking = require("../models/Booking");
const Facility = require("../models/Facility");
const Resident = require("../models/Resident");
const { createNotification } = require("../utils/notify");

// Helper: checks if a requested time range overlaps any existing approved/pending
// booking for the same facility on the same date.
const hasTimeConflict = async (facilityId, bookingDate, startTime, endTime, excludeBookingId = null) => {
  const dateOnly = new Date(bookingDate);
  dateOnly.setHours(0, 0, 0, 0);
  const nextDay = new Date(dateOnly);
  nextDay.setDate(nextDay.getDate() + 1);

  const filter = {
    facility: facilityId,
    bookingDate: { $gte: dateOnly, $lt: nextDay },
    status: { $in: ["pending", "approved"] },
  };

  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(filter);

  return existingBookings.some((b) => startTime < b.endTime && endTime > b.startTime);
};

// @desc    Resident books a facility
// @route   POST /api/bookings
// @access  Private (resident only)
const createBooking = async (req, res, next) => {
  try {
    const { facilityId, bookingDate, startTime, endTime, purpose } = req.body;

    if (!facilityId || !bookingDate || !startTime || !endTime) {
      res.statusCode = 400;
      throw new Error(
        "facilityId, bookingDate, startTime, and endTime are required"
      );
    }

    if (startTime >= endTime) {
      res.statusCode = 400;
      throw new Error("startTime must be before endTime");
    }

    const facility = await Facility.findById(facilityId);
    if (!facility || !facility.isActive) {
      res.statusCode = 404;
      throw new Error("Facility not found or is currently inactive");
    }

    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const conflict = await hasTimeConflict(
      facilityId,
      bookingDate,
      startTime,
      endTime
    );
    if (conflict) {
      res.statusCode = 400;
      throw new Error(
        "This time slot is already booked or pending approval for this facility"
      );
    }

    const booking = await Booking.create({
      facility: facilityId,
      resident: resident._id,
      bookingDate,
      startTime,
      endTime,
      purpose,
      feeCharged: facility.bookingFee,
    });

    const populated = await Booking.findById(booking._id).populate(
      "facility",
      "name type bookingFee"
    );

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully",
      booking: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (admin) with filters
// @route   GET /api/bookings?status=pending&facility=facilityId
// @access  Private (admin only)
const getBookings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.facility) filter.facility = req.query.facility;

    const bookings = await Booking.find(filter)
      .populate("facility", "name type bookingFee")
      .populate({
        path: "resident",
        populate: [
          { path: "user", select: "name phone" },
          { path: "flat", select: "flatNumber block" },
        ],
      })
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in resident's own bookings
// @route   GET /api/bookings/me
// @access  Private (resident only)
const getMyBookings = async (req, res, next) => {
  try {
    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const bookings = await Booking.find({ resident: resident._id })
      .populate("facility", "name type bookingFee")
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin approves or rejects a booking
// @route   PUT /api/bookings/:id/approval
// @access  Private (admin only)
const updateBookingApproval = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      res.statusCode = 400;
      throw new Error("status must be 'approved' or 'rejected'");
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.statusCode = 404;
      throw new Error("Booking not found");
    }

    if (booking.status !== "pending") {
      res.statusCode = 400;
      throw new Error("Only pending bookings can be approved or rejected");
    }

    if (status === "approved") {
      const conflict = await hasTimeConflict(
        booking.facility,
        booking.bookingDate,
        booking.startTime,
        booking.endTime,
        booking._id
      );
      if (conflict) {
        res.statusCode = 400;
        throw new Error(
          "Cannot approve - this time slot conflicts with another approved booking"
        );
      }
    }

    booking.status = status;
    if (status === "rejected") {
      booking.rejectionReason = rejectionReason || "Not specified";
    }

    await booking.save();

    const residentDoc = await Resident.findById(booking.resident);
    const facilityDoc = await Facility.findById(booking.facility);
    if (residentDoc) {
      await createNotification({
        recipient: residentDoc.user,
        title: `Booking ${status === "approved" ? "Confirmed" : "Rejected"}`,
        message:
          status === "approved"
            ? `Your booking for ${facilityDoc?.name || "the facility"} on ${new Date(booking.bookingDate).toLocaleDateString()} is confirmed`
            : `Your booking for ${facilityDoc?.name || "the facility"} was rejected${rejectionReason ? `: ${rejectionReason}` : ""}`,
        type: "booking",
        relatedId: booking._id,
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resident cancels their own pending/approved booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (resident only)
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.statusCode = 404;
      throw new Error("Booking not found");
    }

    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident || booking.resident.toString() !== resident._id.toString()) {
      res.statusCode = 403;
      throw new Error("Access denied. This is not your booking");
    }

    if (!["pending", "approved"].includes(booking.status)) {
      res.statusCode = 400;
      throw new Error("Only pending or approved bookings can be cancelled");
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getMyBookings,
  updateBookingApproval,
  cancelBooking,
};
