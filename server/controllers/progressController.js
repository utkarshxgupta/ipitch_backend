const AssignmentProgress = require("../models/AssignmentProgress");
const Assignment = require("../models/Assignment");
const logger = require("../utils/logger");

// Get a user's progress on an assignment
exports.getUserAssignmentProgress = async (req, res) => {
  logger.info("getUserAssignmentProgress");
  try {
    const progress = await AssignmentProgress.findOne({
      user: req.user.id,
      assignment: req.params.assignmentId,
    })
      .populate("challengeProgress.challenge", "name")
      .populate("challengeProgress.bestSubmission", "submittedDate");
    logger.info("getUserAssignmentProgress progress", progress);
    if (!progress) {
      logger.info("getUserAssignmentProgress progress not found");
      // find total challenges in assignment
      const assignment = await Assignment.findById(req.params.assignmentId);
      let totalChallengesCount = 0;  // Changed from const to let
      if (!assignment) {
        logger.info("getUserAssignmentProgress assignment not found");
        // No need to set totalChallengesCount = 0 again as it's already 0
      } else {
        totalChallengesCount = assignment.challenges.length;
      }
      logger.info("getUserAssignmentProgress totalChallengesCount", totalChallengesCount);
      return res.json({
        overallScore: 0,
        completedChallenges: 0,
        totalChallenges: totalChallengesCount,
        challengeProgress: [],
      });
    }

    return res.json(progress);
  } catch (error) {
    logger.error("getUserAssignmentProgress error", error);
    res.status(500).json({ message: error.message });
  }
};

// Get progress for all users on an assignment (for managers)
exports.getAssignmentLeaderboard = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const leaderboard = await AssignmentProgress.find({
      assignment: assignmentId,
    })
      .sort({ overallScore: -1 })
      .populate("user", "name")
      .select("user overallScore completedChallenges totalChallenges");

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
