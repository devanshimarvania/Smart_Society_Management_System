const express = require("express");
const router = express.Router();

const {
  getAdminDashboard,
  getResidentDashboard,
  getSecurityDashboard,
  getMaintenanceDashboard,
} = require("../controllers/dashboardController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);

router.get("/admin", authorize("admin"), getAdminDashboard);
router.get("/resident", authorize("resident"), getResidentDashboard);
router.get("/security", authorize("security"), getSecurityDashboard);
router.get("/maintenance", authorize("maintenance"), getMaintenanceDashboard);

module.exports = router;
