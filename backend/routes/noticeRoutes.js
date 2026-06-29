const express = require("express");
const router = express.Router();

const {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} = require("../controllers/noticeController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { uploadSingle } = require("../middleware/upload");

router.use(protect);

router
  .route("/")
  .post(authorize("admin"), uploadSingle("attachment"), createNotice)
  .get(getNotices); // any logged-in role can view

router
  .route("/:id")
  .get(getNoticeById)
  .put(authorize("admin"), uploadSingle("attachment"), updateNotice)
  .delete(authorize("admin"), deleteNotice);

module.exports = router;
