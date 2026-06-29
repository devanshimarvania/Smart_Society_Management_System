const express = require("express");
const router = express.Router();

const {
  createFlat,
  getFlats,
  getFlatById,
  updateFlat,
  deleteFlat,
} = require("../controllers/flatController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);

router
  .route("/")
  .post(authorize("admin"), createFlat)
  .get(authorize("admin", "security"), getFlats);

router
  .route("/:id")
  .get(authorize("admin", "security", "resident"), getFlatById)
  .put(authorize("admin"), updateFlat)
  .delete(authorize("admin"), deleteFlat);

module.exports = router;
