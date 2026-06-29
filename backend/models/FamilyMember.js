const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    relation: {
      type: String,
      enum: [
        "spouse",
        "son",
        "daughter",
        "father",
        "mother",
        "brother",
        "sister",
        "other",
      ],
      required: [true, "Relation is required"],
    },
    age: {
      type: Number,
      min: 0,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    phone: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FamilyMember", familyMemberSchema);
