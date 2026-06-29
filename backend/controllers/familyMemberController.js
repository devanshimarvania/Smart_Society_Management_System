const FamilyMember = require("../models/FamilyMember");
const Resident = require("../models/Resident");

// Helper: resolves the Resident document for the currently logged-in user
// when they are accessing their own family members.
const getOwnResidentId = async (userId) => {
  const resident = await Resident.findOne({ user: userId });
  return resident ? resident._id : null;
};

// @desc    Add a family member (residents add to their own profile; admin can add to any)
// @route   POST /api/family-members
// @access  Private (admin, resident)
const addFamilyMember = async (req, res, next) => {
  try {
    const { residentId, name, relation, age, gender, phone } = req.body;

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

    if (!name || !relation) {
      res.statusCode = 400;
      throw new Error("name and relation are required");
    }

    const photo = req.file ? `/uploads/${req.file.filename}` : "";

    const familyMember = await FamilyMember.create({
      resident: targetResidentId,
      name,
      relation,
      age,
      gender,
      phone,
      photo,
    });

    res.status(201).json({
      success: true,
      message: "Family member added successfully",
      familyMember,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all family members for a resident
// @route   GET /api/family-members/resident/:residentId
// @route   GET /api/family-members/me  (resident's own family members)
// @access  Private (admin, security, or the resident themself)
const getFamilyMembers = async (req, res, next) => {
  try {
    let residentId = req.params.residentId;

    if (req.user.role === "resident") {
      const ownResidentId = await getOwnResidentId(req.user._id);
      if (!ownResidentId) {
        res.statusCode = 404;
        throw new Error("Resident profile not found for this account");
      }
      // Residents can only ever see their own family members
      residentId = ownResidentId;
    }

    if (!residentId) {
      res.statusCode = 400;
      throw new Error("residentId is required");
    }

    const familyMembers = await FamilyMember.find({
      resident: residentId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: familyMembers.length,
      familyMembers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a family member
// @route   PUT /api/family-members/:id
// @access  Private (admin, or the owning resident)
const updateFamilyMember = async (req, res, next) => {
  try {
    const familyMember = await FamilyMember.findById(req.params.id);
    if (!familyMember) {
      res.statusCode = 404;
      throw new Error("Family member not found");
    }

    if (req.user.role === "resident") {
      const ownResidentId = await getOwnResidentId(req.user._id);
      if (
        !ownResidentId ||
        familyMember.resident.toString() !== ownResidentId.toString()
      ) {
        res.statusCode = 403;
        throw new Error("Access denied. This is not your family member record");
      }
    }

    const { name, relation, age, gender, phone } = req.body;
    if (name) familyMember.name = name;
    if (relation) familyMember.relation = relation;
    if (age !== undefined) familyMember.age = age;
    if (gender) familyMember.gender = gender;
    if (phone) familyMember.phone = phone;
    if (req.file) familyMember.photo = `/uploads/${req.file.filename}`;

    await familyMember.save();

    res.status(200).json({
      success: true,
      message: "Family member updated successfully",
      familyMember,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a family member
// @route   DELETE /api/family-members/:id
// @access  Private (admin, or the owning resident)
const deleteFamilyMember = async (req, res, next) => {
  try {
    const familyMember = await FamilyMember.findById(req.params.id);
    if (!familyMember) {
      res.statusCode = 404;
      throw new Error("Family member not found");
    }

    if (req.user.role === "resident") {
      const ownResidentId = await getOwnResidentId(req.user._id);
      if (
        !ownResidentId ||
        familyMember.resident.toString() !== ownResidentId.toString()
      ) {
        res.statusCode = 403;
        throw new Error("Access denied. This is not your family member record");
      }
    }

    await familyMember.deleteOne();

    res.status(200).json({
      success: true,
      message: "Family member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFamilyMember,
  getFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
};
