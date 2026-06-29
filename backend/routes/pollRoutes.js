const express = require("express");
const router = express.Router();

const {
  createPoll,
  getPolls,
  getPollResults,
  castVote,
  closePoll,
  deletePoll,
} = require("../controllers/pollController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);

router
  .route("/")
  .post(authorize("admin"), createPoll)
  .get(getPolls); // any logged-in role can view

router
  .route("/:id")
  .get(getPollResults)
  .delete(authorize("admin"), deletePoll);

router.post("/:id/vote", authorize("resident"), castVote);
router.put("/:id/close", authorize("admin"), closePoll);

module.exports = router;
