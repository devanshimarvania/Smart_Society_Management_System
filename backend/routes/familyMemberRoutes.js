const express = require("express");
const router = express.Router();

const {
  addFamilyMember,
  getFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
} = require("../controllers/familyMemberController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { uploadSingle } = require("../middleware/upload");

router.use(protect);

router.post(
  "/",
  authorize("admin", "resident"),
  uploadSingle("photo"),
  addFamilyMember
);

// Resident's own family members
router.get("/me", authorize("resident"), getFamilyMembers);

// Admin/security viewing a specific resident's family members
router.get(
  "/resident/:residentId",
  authorize("admin", "security"),
  getFamilyMembers
);

router
  .route("/:id")
  .put(authorize("admin", "resident"), uploadSingle("photo"), updateFamilyMember)
  .delete(authorize("admin", "resident"), deleteFamilyMember);

module.exports = router;
