const express = require("express");
const router = express.Router();

const {
  addVisitor,
  getVisitors,
  getPendingForResident,
  getMyVisitorHistory,
  updateApprovalStatus,
  markExit,
  getVisitorById,
} = require("../controllers/visitorController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { uploadSingle } = require("../middleware/upload");

router.use(protect);

router
  .route("/")
  .post(authorize("security"), uploadSingle("photo"), addVisitor)
  .get(authorize("admin", "security"), getVisitors);

router.get(
  "/pending-for-me",
  authorize("resident"),
  getPendingForResident
);

router.get("/my-history", authorize("resident"), getMyVisitorHistory);

router.get(
  "/:id",
  authorize("admin", "security", "resident"),
  getVisitorById
);

router.put(
  "/:id/approval",
  authorize("resident"),
  updateApprovalStatus
);

router.put("/:id/exit", authorize("security"), markExit);

module.exports = router;
