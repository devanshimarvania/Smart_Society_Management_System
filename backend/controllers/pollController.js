const Poll = require("../models/Poll");
const Vote = require("../models/Vote");
const Resident = require("../models/Resident");

// @desc    Create a poll
// @route   POST /api/polls
// @access  Private (admin only)
const createPoll = async (req, res, next) => {
  try {
    const { question, description, options, expiresAt } = req.body;

    if (!question || !options || !expiresAt) {
      res.statusCode = 400;
      throw new Error("question, options, and expiresAt are required");
    }

    if (!Array.isArray(options) || options.length < 2) {
      res.statusCode = 400;
      throw new Error("At least 2 options are required");
    }

    const poll = await Poll.create({
      question,
      description,
      options: options.map((text) => ({ text })),
      createdBy: req.user._id,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: "Poll created successfully",
      poll,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all polls (auto-marks expired polls as inactive)
// @route   GET /api/polls
// @access  Private (any logged-in role)
const getPolls = async (req, res, next) => {
  try {
    // Auto-deactivate expired polls
    await Poll.updateMany(
      { expiresAt: { $lt: new Date() }, isActive: true },
      { isActive: false }
    );

    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const polls = await Poll.find(filter)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: polls.length,
      polls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single poll with vote results
// @route   GET /api/polls/:id
// @access  Private (any logged-in role)
const getPollResults = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id).populate(
      "createdBy",
      "name"
    );

    if (!poll) {
      res.statusCode = 404;
      throw new Error("Poll not found");
    }

    const votes = await Vote.find({ poll: poll._id });

    const results = poll.options.map((option) => {
      const voteCount = votes.filter(
        (v) => v.optionId.toString() === option._id.toString()
      ).length;
      return {
        optionId: option._id,
        text: option.text,
        voteCount,
      };
    });

    const totalVotes = votes.length;

    // Check if logged-in resident has already voted
    let myVote = null;
    if (req.user.role === "resident") {
      const resident = await Resident.findOne({ user: req.user._id });
      if (resident) {
        const existingVote = await Vote.findOne({
          poll: poll._id,
          resident: resident._id,
        });
        if (existingVote) myVote = existingVote.optionId;
      }
    }

    res.status(200).json({
      success: true,
      poll,
      results,
      totalVotes,
      myVote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resident casts a vote
// @route   POST /api/polls/:id/vote
// @access  Private (resident only)
const castVote = async (req, res, next) => {
  try {
    const { optionId } = req.body;

    if (!optionId) {
      res.statusCode = 400;
      throw new Error("optionId is required");
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      res.statusCode = 404;
      throw new Error("Poll not found");
    }

    if (!poll.isActive || new Date(poll.expiresAt) < new Date()) {
      res.statusCode = 400;
      throw new Error("This poll has expired and is no longer accepting votes");
    }

    const validOption = poll.options.some(
      (opt) => opt._id.toString() === optionId
    );
    if (!validOption) {
      res.statusCode = 400;
      throw new Error("Invalid optionId for this poll");
    }

    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.statusCode = 404;
      throw new Error("Resident profile not found for this account");
    }

    const existingVote = await Vote.findOne({
      poll: poll._id,
      resident: resident._id,
    });
    if (existingVote) {
      res.statusCode = 400;
      throw new Error("You have already voted on this poll");
    }

    const vote = await Vote.create({
      poll: poll._id,
      optionId,
      resident: resident._id,
    });

    res.status(201).json({
      success: true,
      message: "Vote cast successfully",
      vote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close a poll early
// @route   PUT /api/polls/:id/close
// @access  Private (admin only)
const closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      res.statusCode = 404;
      throw new Error("Poll not found");
    }

    poll.isActive = false;
    await poll.save();

    res.status(200).json({
      success: true,
      message: "Poll closed successfully",
      poll,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a poll (and all its votes)
// @route   DELETE /api/polls/:id
// @access  Private (admin only)
const deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      res.statusCode = 404;
      throw new Error("Poll not found");
    }

    await Vote.deleteMany({ poll: poll._id });
    await poll.deleteOne();

    res.status(200).json({
      success: true,
      message: "Poll and all associated votes deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPoll,
  getPolls,
  getPollResults,
  castVote,
  closePoll,
  deletePoll,
};
