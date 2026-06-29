const Flat = require("../models/Flat");

// @desc    Create a new flat
// @route   POST /api/flats
// @access  Private (admin only)
const createFlat = async (req, res, next) => {
  try {
    const { flatNumber, block, floor, type, area, maintenanceAmount } =
      req.body;

    if (!flatNumber || !block || floor === undefined) {
      res.statusCode = 400;
      throw new Error("flatNumber, block, and floor are required");
    }

    const existing = await Flat.findOne({ flatNumber, block });
    if (existing) {
      res.statusCode = 400;
      throw new Error("A flat with this number already exists in this block");
    }

    const flat = await Flat.create({
      flatNumber,
      block,
      floor,
      type,
      area,
      maintenanceAmount,
    });

    res.status(201).json({
      success: true,
      message: "Flat created successfully",
      flat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all flats (optional filters: block, occupancyStatus)
// @route   GET /api/flats?block=A&occupancyStatus=vacant
// @access  Private (admin, security)
const getFlats = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.block) filter.block = req.query.block;
    if (req.query.occupancyStatus)
      filter.occupancyStatus = req.query.occupancyStatus;

    const flats = await Flat.find(filter)
      .populate({
        path: "owner",
        populate: { path: "user", select: "name email phone" },
      })
      .populate({
        path: "tenant",
        populate: { path: "user", select: "name email phone" },
      })
      .sort({ block: 1, flatNumber: 1 });

    res.status(200).json({
      success: true,
      count: flats.length,
      flats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single flat by ID
// @route   GET /api/flats/:id
// @access  Private (admin, security, resident)
const getFlatById = async (req, res, next) => {
  try {
    const flat = await Flat.findById(req.params.id)
      .populate({
        path: "owner",
        populate: { path: "user", select: "name email phone" },
      })
      .populate({
        path: "tenant",
        populate: { path: "user", select: "name email phone" },
      });

    if (!flat) {
      res.statusCode = 404;
      throw new Error("Flat not found");
    }

    res.status(200).json({
      success: true,
      flat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a flat
// @route   PUT /api/flats/:id
// @access  Private (admin only)
const updateFlat = async (req, res, next) => {
  try {
    const { flatNumber, block, floor, type, area, maintenanceAmount } =
      req.body;

    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      res.statusCode = 404;
      throw new Error("Flat not found");
    }

    if (flatNumber) flat.flatNumber = flatNumber;
    if (block) flat.block = block;
    if (floor !== undefined) flat.floor = floor;
    if (type) flat.type = type;
    if (area !== undefined) flat.area = area;
    if (maintenanceAmount !== undefined)
      flat.maintenanceAmount = maintenanceAmount;

    await flat.save();

    res.status(200).json({
      success: true,
      message: "Flat updated successfully",
      flat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a flat (only allowed if vacant)
// @route   DELETE /api/flats/:id
// @access  Private (admin only)
const deleteFlat = async (req, res, next) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      res.statusCode = 404;
      throw new Error("Flat not found");
    }

    if (flat.owner || flat.tenant) {
      res.statusCode = 400;
      throw new Error(
        "Cannot delete an occupied flat. Reallocate or remove the resident first"
      );
    }

    await flat.deleteOne();

    res.status(200).json({
      success: true,
      message: "Flat deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFlat,
  getFlats,
  getFlatById,
  updateFlat,
  deleteFlat,
};
