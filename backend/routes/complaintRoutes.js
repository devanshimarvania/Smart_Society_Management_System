const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/complaintController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { uploadMultiple } = require("../middleware/upload");

router.use(protect);

router
  .route("/")
  .post(authorize("resident"), uploadMultiple("images", 5), raiseComplaint)
  .get(authorize("admin"), getComplaints);

router.get("/me", authorize("resident"), getMyComplaints);
router.get("/assigned-to-me", authorize("maintenance"), getAssignedComplaints);

router.get(
  "/:id",
  authorize("admin", "resident", "maintenance"),
  getComplaintById
);

router.put("/:id/assign", authorize("admin"), assignComplaint);

router.put(
  "/:id/status",
  authorize("maintenance"),
  uploadMultiple("completionImages", 5),
  updateComplaintStatus
);

router.put("/:id/close", authorize("admin"), closeComplaint);
router.put("/:id/reopen", authorize("resident"), reopenComplaint);

router.delete("/:id", authorize("admin"), deleteComplaint);

module.exports = router;
