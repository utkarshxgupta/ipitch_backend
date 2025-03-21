const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  challenges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Challenge" }],
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  enableHints: { type: Boolean, default: false },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
