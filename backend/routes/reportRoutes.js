const express = require("express");
const router = express.Router();

const {
  generateInvoicePDF,
  exportBillsExcel,
  exportComplaintsExcel,
} = require("../controllers/reportController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);

router.get(
  "/invoice/:billId",
  authorize("admin", "resident"),
  generateInvoicePDF
);

router.get("/bills-excel", authorize("admin"), exportBillsExcel);
router.get("/complaints-excel", authorize("admin"), exportComplaintsExcel);

module.exports = router;
