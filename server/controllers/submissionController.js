const Submission = require("../models/Submission");
const Challenge = require("../models/Challenge");
const Assignment = require("../models/Assignment");
const AssignmentProgress = require("../models/AssignmentProgress");
const StorageService = require("../services/storage");
const TranscriptionService = require("../services/transcription");
const SemanticEvaluationService = require("../services/semanticEvaluationService");
const logger = require("../utils/logger");

// @route    POST api/submissions
// @desc     Create a new submission
// @access   Private (Trainee)
exports.createSubmission = async (req, res) => {
  try {
    console.log("We are in create submission ", req.body);
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    // Set timeout for the request
    req.setTimeout(300000); // 5 minutes

    // Upload file to Google Cloud Storage
    const { fileName, fileUrl } = await StorageService.uploadFile(req.file);

    const { assignmentId, challengeId, pitch } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ msg: "Assignment not found" });
    }
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ msg: "Challenge not found" });
    }

    // Increment the attempts counter for this challenge
    await Challenge.findByIdAndUpdate(challengeId, { $inc: { attempts: 1 } });

    const newSubmission = new Submission({
      assignment: assignment,
      challenge: challenge,
      trainee: req.user.id,
      pitch: fileUrl,
      videoFileName: fileName,
    });

    const submission = await newSubmission.save();

    // If transcript is provided in the request body
    if (req.body.transcript) {
      try {
        // Use transcript directly without punctuation restoration
        submission.transcript = req.body.transcript;
        submission.transcriptionStatus = "completed";
        submission.speechMetrics = {
          averageSpeechRate: parseFloat(req.body.averageSpeechRate),
          conversationalSpeechRate: parseFloat(req.body.conversationalSpeechRate),
          longPauses: parseInt(req.body.longPauses),
          speakingTimePercent: parseFloat(req.body.speakingTimePercent),
          pauseDurations: JSON.parse(req.body.pauseDurations)
        };

        await submission.save();
        
        // Initiate semantic evaluation with the original transcript
        performSemanticEvaluation(submission._id, submission.transcript, challenge);
        
        return res.status(201).json({
          message: "Submission received with transcript. Evaluation in progress...",
          submission,
        });
      } catch (error) {
        logger.error(`Error processing transcript: ${error.message}`);
        submission.transcript = req.body.transcript;
        submission.transcriptionStatus = "completed";

        await submission.save();
        
        performSemanticEvaluation(submission._id, req.body.transcript, challenge);
        
        return res.status(201).json({
          message: "Submission received with transcript. Evaluation in progress...",
          submission,
        });
      }
    } else {
      // No transcript provided, start transcription process
      TranscriptionService.transcribeVideo(
        req.file.buffer,
        req.file.originalname,
        submission._id
      );
      
      return res.status(201).json({
        message: "Submission received, transcription in progress...",
        submission,
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Error processing submission",
      error: error.message,
    });
  }
};

/**
 * Perform semantic evaluation in the background
 * @param {string} submissionId - MongoDB ID of the submission
 * @param {string} transcript - Submission transcript
 * @param {Object} challenge - Challenge document with evaluation criteria
 */
async function performSemanticEvaluation(submissionId, transcript, challenge) {
  try {
    logger.info(`Starting background semantic evaluation for submission: ${submissionId}`);
    
    // Check if challenge has evaluation criteria
    if (!challenge?.evaluationCriteria || challenge.evaluationCriteria.length === 0) {
      logger.warn(`No evaluation criteria found for challenge: ${challenge._id}`);
      return;
    }
    
    // Evaluate transcript against criteria
    const evaluationResults = await SemanticEvaluationService.evaluateTranscript(
      transcript, 
      challenge.evaluationCriteria
    );
    
    // Calculate semantic similarity with ideal pitch if available
    let semanticSimilarity = { score: 0, similarity: 0 };
    if (challenge.idealPitchEmbeddings && challenge.idealPitchEmbeddings.length > 0) {
      semanticSimilarity = await SemanticEvaluationService.calculateIdealPitchSimilarity(
        transcript,
        challenge.idealPitchEmbeddings
      );
    }
    
    // Get submission data before updating to use later in progress update
    const submission = await Submission.findById(submissionId);
    
    // Update submission with evaluation results in one operation
    await Submission.findByIdAndUpdate(submissionId, {
      'automaticEvaluation': {
      score: evaluationResults.score,
      details: evaluationResults.details,
      rawScore: evaluationResults.rawScore,
      maxPossibleScore: evaluationResults.maxPossibleScore,
      evaluatedAt: new Date(),
      semanticSimilarity
      },
    });
    
    // Update assignment progress using full submission data
    await updateAssignmentProgress(submission, evaluationResults.score);

    logger.info(`Semantic evaluation completed for submission: ${submissionId}`);
  } catch (error) {
    logger.error(`Error during background semantic evaluation: ${error.message}`, error);
  }
}

// Add to submissionController.js after a submission is saved
async function updateAssignmentProgress(submission, score) {
  try {
    logger.info(`Updating assignment progress for submission: ${submission}`);
    // Find or create progress record
    let progress = await AssignmentProgress.findOne({
      user: submission.trainee,
      assignment: submission.assignment
    });
    
    if (!progress) {
      // Create new progress record
      const assignment = await Assignment.findById(submission.assignment);
      progress = new AssignmentProgress({
        user: submission.trainee,
        assignment: submission.assignment,
        totalChallenges: assignment.challenges.length,
        challengeProgress: []
      });
    }
    
    // Find this challenge in the progress
    const challengeIndex = progress.challengeProgress.findIndex(
      cp => cp.challenge.toString() === submission.challenge.toString()
    );
    
    if (challengeIndex === -1) {
      // First attempt at this challenge
      progress.challengeProgress.push({
        challenge: submission.challenge,
        bestSubmission: submission._id,
        bestScore: score,
        attempts: 1,
        lastAttemptDate: new Date()
      });
      progress.completedChallenges += 1;
    } else {
      // Update existing challenge progress
      progress.challengeProgress[challengeIndex].attempts += 1;
      progress.challengeProgress[challengeIndex].lastAttemptDate = new Date();
      
      // Update best score if this submission is better
      if (score > progress.challengeProgress[challengeIndex].bestScore) {
        progress.challengeProgress[challengeIndex].bestScore = score;
        progress.challengeProgress[challengeIndex].bestSubmission = submission._id;
      }
    }
    
    // Recalculate overall score (sum of best scores)
    progress.overallScore = progress.challengeProgress.reduce(
      (sum, cp) => sum + cp.bestScore, 0
    );
    
    progress.lastUpdated = new Date();
    await progress.save();
    
    return progress;
  } catch (error) {
    logger.error(`Failed to update assignment progress: ${error.message}`);
    throw error;
  }
}

// @route    GET api/submissions/:id
// @desc     Get submissions for a challenge by ID
// @access   Private (Trainer, Manager, Admin)
exports.getSubmissionsByChallengeId = async (req, res) => {
  try {
    const submissions = await Submission.find({ challenge: req.params.id })
      .populate("trainee", ["name"])
      .populate("evaluations.evaluator", ["name"]);
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// @route    POST api/submissions/:id/evaluate
// @desc     Evaluate a submission by ID
// @access   Private (Trainer, Manager, Admin)
exports.evaluateSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ msg: "Submission not found" });
    }

    const newEvaluation = {
      evaluator: req.user.id,
      score,
      feedback,
    };

    submission.evaluations.unshift(newEvaluation);
    await submission.save();
    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// @desc Get all submissions made by a user in a particular assignment
// @route GET /api/submissions/user/assignment/:assignmentId
// @access Private (Trainee)
exports.getSubmissionsByAssignmentId = async (req, res) => {
  try {
    // Determine which trainee ID to use
    let traineeId = req.user.id;
    
    // If userId is provided in query params and user is admin/manager, use that instead
    if (req.query.traineeId && (req.user.role.includes('admin') || req.user.role.includes('manager'))) {
      traineeId = req.query.traineeId;
    }
    
    const submissions = await Submission.find({
      trainee: traineeId,
      assignment: req.params.id,
    }).populate("challenge", ["name"]);
    
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// @desc Get submission by submission ID
// @route GET /api/submissions/:id
// @access Private (Trainee)
exports.getSubmissionById = async (req, res) => {
  try {
    console.log("WE ARE INSIDE GET SUBMISSIONS BY ID");
    const submission = await Submission.findById(req.params.id).populate([
      { path: "trainee", select: "name" },
      { path: "challenge", select: "name" },
      { path: "assignment", select: "name" },
      { path: "comments.commenter", select: "name" },
    ]);
    // if user role is trainee, then check if the submission belongs to the user
    if (req.user.role.includes("trainee")) {
      if (submission.trainee._id.toString() !== req.user.id) {
        return res.status(401).json({ msg: "User not authorized" });
      }
    }
    if (!submission) {
      return res.status(404).json({ msg: "Submission not found" });
    }
    return res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    let { lastId, limit = 10, traineeId, assignmentId } = req.query;
    limit = parseInt(limit, 10);

    // Base query
    const query = {};
    if (traineeId) {
      query.trainee = traineeId;
    }

    if (assignmentId) {
      query.assignment = assignmentId;
    }

    // Add _id condition for infinite scroll
    if (lastId) {
      query._id = { $lt: lastId };
    }

    // If loading more for specific assignment, only get that one
    if (assignmentId) {
      const submissions = await Submission.find(query)
        .sort({ _id: -1 })
        .limit(limit)
        .populate("trainee", ["name"])
        .populate("challenge", ["name"])
        .populate("assignment", ["name"]);

      const group = {
        assignmentId,
        assignmentName: submissions[0]?.assignment?.name || "",
        submissions,
        hasMore: submissions.length === limit,
        lastId: submissions[submissions.length - 1]?._id,
      };

      return res.json({
        groups: [group],
        total: 1,
      });
    }

    // First, get all unique assignment IDs from submissions
    const uniqueAssignments = await Submission.distinct("assignment", query);

    // Get submissions for each assignment
    const groupedSubmissions = await Promise.all(
      uniqueAssignments.map(async (assignmentId) => {
        const assignmentQuery = { ...query, assignment: assignmentId };
        const submissions = await Submission.find(assignmentQuery)
          .sort({ _id: -1 })
          .limit(limit)
          .populate("trainee", ["name"])
          .populate("challenge", ["name"])
          .populate("assignment", ["name"]);

        return {
          assignmentId,
          assignmentName: submissions[0]?.assignment?.name || "",
          submissions,
          hasMore: submissions.length === limit,
          lastId: submissions[submissions.length - 1]?._id,
        };
      })
    );

    // Filter out empty assignment groups
    const filteredGroups = groupedSubmissions.filter(
      (group) => group.submissions.length > 0
    );

    return res.json({
      groups: filteredGroups,
      total: filteredGroups.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
};

exports.addComment = async (req, res) => {
  try {
    // Only manager, trainer, or admin can add comments
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ msg: "Submission not found" });
    }
    // The user’s role check is already handled by roleCheck in routes

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ msg: "Comment text is required" });
    }
    const newComment = {
      commenter: req.user.id,
      text,
    };
    submission.comments.push(newComment);
    await submission.save();
    res.json(submission);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};
