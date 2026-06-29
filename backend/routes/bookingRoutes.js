const express = require("express");
const router = express.Router();

const {
  createBooking,
  getBookings,
  getMyBookings,
  updateBookingApproval,
  cancelBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);

router
  .route("/")
  .post(authorize("resident"), createBooking)
  .get(authorize("admin"), getBookings);

router.get("/me", authorize("resident"), getMyBookings);

router.put("/:id/approval", authorize("admin"), updateBookingApproval);
router.put("/:id/cancel", authorize("resident"), cancelBooking);

module.exports = router;
