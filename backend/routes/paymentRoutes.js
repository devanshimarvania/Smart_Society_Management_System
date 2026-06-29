const express = require("express");
const router = express.Router();

const {
  recordPayment,
  getPayments,
  getMyPayments,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);

router
  .route("/")
  .post(authorize("admin"), recordPayment)
  .get(authorize("admin"), getPayments);

router.get("/me", authorize("resident"), getMyPayments);

module.exports = router;
