const Vehicle = require("../models/Vehicle");
const Resident = require("../models/Resident");

const getOwnResidentId = async (userId) => {
  const resident = await Resident.findOne({ user: userId });
  return resident ? resident._id : null;
};

// @desc    Add a vehicle (residents add to their own profile; admin can add to any)
// @route   POST /api/vehicles
// @access  Private (admin, resident)
const addVehicle = async (req, res, next) => {
  try {
    const {
      residentId,
      vehicleType,
      brand,
      model,
      registrationNumber,
      color,
      parkingSlot,
    } = req.body;

    let targetResidentId = residentId;

    if (req.user.role === "resident") {
      const ownResidentId = await getOwnResidentId(req.user._id);
      if (!ownResidentId) {
        res.statusCode = 404;
        throw new Error("Resident profile not found for this account");
      }
      targetResidentId = ownResidentId;
    }

    if (!targetResidentId) {
      res.statusCode = 400;
      throw new Error("residentId is required");
    }

    if (!vehicleType || !registrationNumber) {
      res.statusCode = 400;
      throw new Error("vehicleType and registrationNumber are required");
    }

    const existing = await Vehicle.findOne({
      registrationNumber: registrationNumber.toUpperCase(),
    });
    if (existing) {
      res.statusCode = 400;
      throw new Error("A vehicle with this registration number already exists");
    }

    const vehicle = await Vehicle.create({
      resident: targetResidentId,
      vehicleType,
      brand,
      model,
      registrationNumber,
      color,
      parkingSlot,
    });

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vehicles for a resident, or all vehicles in society (admin/security)
// @route   GET /api/vehicles/resident/:residentId
// @route   GET /api/vehicles/me
// @route   GET /api/vehicles  (admin/security - all vehicles, supports ?search=)
// @access  Private (admin, security, or the resident themself)
const getVehicles = async (req, res, next) => {
  try {
    let residentId = req.params.residentId;

    if (req.user.role === "resident") {
      const ownResidentId = await getOwnResidentId(req.user._id);
      if (!ownResidentId) {
        res.statusCode = 404;
        throw new Error("Resident profile not found for this account");
      }
      residentId = ownResidentId;
    }

    const filter = {};
    if (residentId) filter.resident = residentId;

    if (req.query.search && !residentId) {
      filter.registrationNumber = new RegExp(req.query.search, "i");
    }

    const vehicles = await Vehicle.find(filter)
      .populate({
        path: "resident",
        populate: [
          { path: "user", select: "name email phone" },
          { path: "flat", select: "flatNumber block" },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (admin, or the owning resident)
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      res.statusCode = 404;
      throw new Error("Vehicle not found");
    }

    if (req.user.role === "resident") {
      const ownResidentId = await getOwnResidentId(req.user._id);
      if (
        !ownResidentId ||
        vehicle.resident.toString() !== ownResidentId.toString()
      ) {
        res.statusCode = 403;
        throw new Error("Access denied. This is not your vehicle");
      }
    }

    const { vehicleType, brand, model, registrationNumber, color, parkingSlot } =
      req.body;

    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;
    if (registrationNumber) vehicle.registrationNumber = registrationNumber;
    if (color) vehicle.color = color;
    if (parkingSlot !== undefined) vehicle.parkingSlot = parkingSlot;

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (admin, or the owning resident)
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      res.statusCode = 404;
      throw new Error("Vehicle not found");
    }

    if (req.user.role === "resident") {
      const ownResidentId = await getOwnResidentId(req.user._id);
      if (
        !ownResidentId ||
        vehicle.resident.toString() !== ownResidentId.toString()
      ) {
        res.statusCode = 403;
        throw new Error("Access denied. This is not your vehicle");
      }
    }

    await vehicle.deleteOne();

    res.status(200).json({
      success: true,
      message: "Vehicle removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
};
