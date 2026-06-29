const express = require("express");
const router = express.Router();

const {
  addVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);

router
  .route("/")
  .post(authorize("admin", "resident"), addVehicle)
  .get(authorize("admin", "security"), getVehicles);

router.get("/me", authorize("resident"), getVehicles);

router.get(
  "/resident/:residentId",
  authorize("admin", "security"),
  getVehicles
);

router
  .route("/:id")
  .put(authorize("admin", "resident"), updateVehicle)
  .delete(authorize("admin", "resident"), deleteVehicle);

module.exports = router;
