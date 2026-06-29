const Resident = require("../models/Resident");
const Flat = require("../models/Flat");
const User = require("../models/User");

// @desc    Admin creates a Resident profile (links an existing User account to a Flat)
// @route   POST /api/residents
// @access  Private (admin only)
const createResident = async (req, res, next) => {
  try {
    const { userId, flatId, residentType, moveInDate, emergencyContact } =
      req.body;

    if (!userId || !flatId) {
      res.statusCode = 400;
      throw new Error("userId and flatId are required");
    }

    const user = await User.findById(userId);
    if (!user) {
      res.statusCode = 404;
      throw new Error("User not found");
    }

    if (user.role !== "resident") {
      res.statusCode = 400;
      throw new Error("This user's role is not 'resident'");
    }

    const existingResident = await Resident.findOne({ user: userId });
    if (existingResident) {
      res.statusCode = 400;
      throw new Error("A resident profile already exists for this user");
    }

    const flat = await Flat.findById(flatId);
    if (!flat) {
      res.statusCode = 404;
      throw new Error("Flat not found");
    }

    const resident = await Resident.create({
      user: userId,
      flat: flatId,
      residentType: residentType || "owner",
      moveInDate: moveInDate || Date.now(),
      emergencyContact,
    });

    // Update flat occupancy
    flat.occupancyStatus =
      resident.residentType === "tenant" ? "rented" : "owner-occupied";
    if (resident.residentType === "tenant") {
      flat.tenant = resident._id;
    } else {
      flat.owner = resident._id;
    }
    await flat.save();

    const populated = await Resident.findById(resident._id)
      .populate("user", "name email phone profileImage")
      .populate("flat");

    res.status(201).json({
      success: true,
      message: "Resident profile created successfully",
      resident: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all residents (with optional search & pagination)
// @route   GET /api/residents?page=1&limit=10&search=john&flat=flatId
// @access  Private (admin, security)
const getResidents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.flat) filter.flat = req.query.flat;
    if (req.query.residentType) filter.residentType = req.query.residentType;
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    let query = Resident.find(filter)
      .populate("user", "name email phone profileImage isActive")
      .populate("flat", "flatNumber block floor type")
      .sort({ createdAt: -1 });

    // Search by resident's name/email (post-populate filtering via separate query)
    let residents = await query.skip(skip).limit(limit);
    let total = await Resident.countDocuments(filter);

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      const allMatching = await Resident.find(filter)
        .populate("user", "name email phone profileImage isActive")
        .populate("flat", "flatNumber block floor type")
        .sort({ createdAt: -1 });

      const filtered = allMatching.filter(
        (r) =>
          searchRegex.test(r.user?.name || "") ||
          searchRegex.test(r.user?.email || "") ||
          searchRegex.test(r.flat?.flatNumber || "")
      );

      total = filtered.length;
      residents = filtered.slice(skip, skip + limit);
    }

    res.status(200).json({
      success: true,
      count: residents.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      residents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single resident by ID
// @route   GET /api/residents/:id
// @access  Private (admin, security, or the resident themself)
const getResidentById = async (req, res, next) => {
  try {
    const resident = await Resident.findById(req.params.id)
      .populate("user", "name email phone profileImage isActive")
      .populate("flat");

    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident not found");
    }

    // Residents can only view their own profile
    if (
      req.user.role === "resident" &&
      resident.user._id.toString() !== req.user._id.toString()
    ) {
      res.statusCode = 403;
      throw new Error("Access denied. You can only view your own profile");
    }

    res.status(200).json({
      success: true,
      resident,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in resident's own profile
// @route   GET /api/residents/me
// @access  Private (resident only)
const getMyResidentProfile = async (req, res, next) => {
  try {
    const resident = await Resident.findOne({ user: req.user._id })
      .populate("user", "name email phone profileImage")
      .populate("flat");

    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    res.status(200).json({
      success: true,
      resident,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update resident profile (residentType, emergency contact, move dates)
// @route   PUT /api/residents/:id
// @access  Private (admin only)
const updateResident = async (req, res, next) => {
  try {
    const { residentType, emergencyContact, moveInDate, moveOutDate, isActive } =
      req.body;

    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident not found");
    }

    if (residentType) resident.residentType = residentType;
    if (emergencyContact) resident.emergencyContact = emergencyContact;
    if (moveInDate) resident.moveInDate = moveInDate;
    if (moveOutDate !== undefined) resident.moveOutDate = moveOutDate;
    if (isActive !== undefined) resident.isActive = isActive;

    await resident.save();

    const updated = await Resident.findById(resident._id)
      .populate("user", "name email phone profileImage")
      .populate("flat");

    res.status(200).json({
      success: true,
      message: "Resident updated successfully",
      resident: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reallocate a resident to a different flat
// @route   PUT /api/residents/:id/reallocate-flat
// @access  Private (admin only)
const reallocateFlat = async (req, res, next) => {
  try {
    const { newFlatId } = req.body;

    if (!newFlatId) {
      res.statusCode = 400;
      throw new Error("newFlatId is required");
    }

    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident not found");
    }

    const newFlat = await Flat.findById(newFlatId);
    if (!newFlat) {
      res.statusCode = 404;
      throw new Error("New flat not found");
    }

    // Clear old flat's reference
    const oldFlat = await Flat.findById(resident.flat);
    if (oldFlat) {
      if (oldFlat.owner?.toString() === resident._id.toString()) {
        oldFlat.owner = null;
      }
      if (oldFlat.tenant?.toString() === resident._id.toString()) {
        oldFlat.tenant = null;
      }
      if (!oldFlat.owner && !oldFlat.tenant) {
        oldFlat.occupancyStatus = "vacant";
      }
      await oldFlat.save();
    }

    // Assign new flat
    resident.flat = newFlatId;
    await resident.save();

    if (resident.residentType === "tenant") {
      newFlat.tenant = resident._id;
      newFlat.occupancyStatus = "rented";
    } else {
      newFlat.owner = resident._id;
      newFlat.occupancyStatus = "owner-occupied";
    }
    await newFlat.save();

    const updated = await Resident.findById(resident._id)
      .populate("user", "name email phone")
      .populate("flat");

    res.status(200).json({
      success: true,
      message: "Resident reallocated to new flat successfully",
      resident: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a resident profile (and deactivate the underlying User account)
// @route   DELETE /api/residents/:id
// @access  Private (admin only)
const deleteResident = async (req, res, next) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident not found");
    }

    // Clear flat reference
    const flat = await Flat.findById(resident.flat);
    if (flat) {
      if (flat.owner?.toString() === resident._id.toString()) flat.owner = null;
      if (flat.tenant?.toString() === resident._id.toString())
        flat.tenant = null;
      if (!flat.owner && !flat.tenant) flat.occupancyStatus = "vacant";
      await flat.save();
    }

    await User.findByIdAndUpdate(resident.user, { isActive: false });
    await resident.deleteOne();

    res.status(200).json({
      success: true,
      message: "Resident deleted and associated user account deactivated",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createResident,
  getResidents,
  getResidentById,
  getMyResidentProfile,
  updateResident,
  reallocateFlat,
  deleteResident,
};
