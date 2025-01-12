const mongoose = require("mongoose");
const { create } = require("./Submission");

const AssignmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  challenges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Challenge" }],
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  submissions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      submissionContent: [
        {
          challenge: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge" },
          video: String,
        },
      ],
      date: { type: Date },
      score: Number,
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
