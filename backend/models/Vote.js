const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
    },
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
  },
  { timestamps: true }
);

// One vote per resident per poll
voteSchema.index({ poll: 1, resident: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
