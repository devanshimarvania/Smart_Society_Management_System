const express = require("express");
const router = express.Router();

const {
  createResident,
  getResidents,
  getResidentById,
  getMyResidentProfile,
  updateResident,
  reallocateFlat,
  deleteResident,
} = require("../controllers/residentController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);

// IMPORTANT: "/me" must be registered BEFORE "/:id" or Express will treat
// "me" as an :id param and route it to getResidentById instead.
router.get("/me", authorize("resident"), getMyResidentProfile);

router
  .route("/")
  .post(authorize("admin"), createResident)
  .get(authorize("admin", "security"), getResidents);

router
  .route("/:id")
  .get(authorize("admin", "security", "resident"), getResidentById)
  .put(authorize("admin"), updateResident)
  .delete(authorize("admin"), deleteResident);

router.put("/:id/reallocate-flat", authorize("admin"), reallocateFlat);

module.exports = router;
