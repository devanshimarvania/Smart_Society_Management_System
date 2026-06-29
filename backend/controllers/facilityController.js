const Facility = require("../models/Facility");

// @desc    Create a new facility
// @route   POST /api/facilities
// @access  Private (admin only)
const createFacility = async (req, res, next) => {
  try {
    const { name, description, type, capacity, openTime, closeTime, bookingFee } =
      req.body;

    if (!name || !type) {
      res.statusCode = 400;
      throw new Error("name and type are required");
    }

    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const facility = await Facility.create({
      name,
      description,
      type,
      capacity,
      openTime,
      closeTime,
      bookingFee,
      image,
    });

    res.status(201).json({
      success: true,
      message: "Facility created successfully",
      facility,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all facilities (everyone can view active facilities)
// @route   GET /api/facilities
// @access  Private (any logged-in role)
const getFacilities = async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { isActive: true };

    const facilities = await Facility.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: facilities.length,
      facilities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single facility by ID
// @route   GET /api/facilities/:id
// @access  Private (any logged-in role)
const getFacilityById = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      res.statusCode = 404;
      throw new Error("Facility not found");
    }

    res.status(200).json({
      success: true,
      facility,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a facility
// @route   PUT /api/facilities/:id
// @access  Private (admin only)
const updateFacility = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      res.statusCode = 404;
      throw new Error("Facility not found");
    }

    const {
      name,
      description,
      type,
      capacity,
      openTime,
      closeTime,
      bookingFee,
      isActive,
    } = req.body;

    if (name) facility.name = name;
    if (description !== undefined) facility.description = description;
    if (type) facility.type = type;
    if (capacity !== undefined) facility.capacity = capacity;
    if (openTime) facility.openTime = openTime;
    if (closeTime) facility.closeTime = closeTime;
    if (bookingFee !== undefined) facility.bookingFee = bookingFee;
    if (isActive !== undefined) facility.isActive = isActive;
    if (req.file) facility.image = `/uploads/${req.file.filename}`;

    await facility.save();

    res.status(200).json({
      success: true,
      message: "Facility updated successfully",
      facility,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a facility
// @route   DELETE /api/facilities/:id
// @access  Private (admin only)
const deleteFacility = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      res.statusCode = 404;
      throw new Error("Facility not found");
    }

    await facility.deleteOne();

    res.status(200).json({
      success: true,
      message: "Facility deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFacility,
  getFacilities,
  getFacilityById,
  updateFacility,
  deleteFacility,
};
