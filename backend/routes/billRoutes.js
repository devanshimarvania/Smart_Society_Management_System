const express = require("express");
const router = express.Router();

const {
  generateBill,
  bulkGenerateBills,
  getBills,
  getMyBills,
  getBillById,
  applyPenalty,
  runOverdueCheck,
  deleteBill,
} = require("../controllers/billController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);

router
  .route("/")
  .post(authorize("admin"), generateBill)
  .get(authorize("admin"), getBills);

router.post("/bulk-generate", authorize("admin"), bulkGenerateBills);
router.post("/run-overdue-check", authorize("admin"), runOverdueCheck);
router.get("/me", authorize("resident"), getMyBills);

router
  .route("/:id")
  .get(authorize("admin", "resident"), getBillById)
  .delete(authorize("admin"), deleteBill);

router.put("/:id/apply-penalty", authorize("admin"), applyPenalty);

module.exports = router;
