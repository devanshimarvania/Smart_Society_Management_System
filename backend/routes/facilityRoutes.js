const express = require("express");
const router = express.Router();

const {
  createFacility,
  getFacilities,
  getFacilityById,
  updateFacility,
  deleteFacility,
} = require("../controllers/facilityController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { uploadSingle } = require("../middleware/upload");

router.use(protect);

router
  .route("/")
  .post(authorize("admin"), uploadSingle("image"), createFacility)
  .get(getFacilities); // any logged-in role can view

router
  .route("/:id")
  .get(getFacilityById)
  .put(authorize("admin"), uploadSingle("image"), updateFacility)
  .delete(authorize("admin"), deleteFacility);

module.exports = router;
