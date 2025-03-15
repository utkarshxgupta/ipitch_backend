const Submission = require("../models/Submission");
const Challenge = require("../models/Challenge");
const Assignment = require("../models/Assignment");
const StorageService = require("../services/storage");
const TranscriptionService = require("../services/transcription");
// const azureVideoIndexer = require('../services/azureVideoIndexer');

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

    const newSubmission = new Submission({
      assignment: assignment,
      challenge: challenge,
      trainee: req.user.id,
      pitch: fileUrl,
      videoFileName: fileName,
    });

    const submission = await newSubmission.save();

    // In the submission POST endpoint handler
    // Add to the existing endpoint where you handle the video upload

    // If transcript is provided in the request body
    if (req.body.transcript) {
      submission.transcript = req.body.transcript;
      submission.transcriptionStatus = "completed"; // Since we already have the transcript
      await submission.save();
    } else {
      TranscriptionService.transcribeVideo(
        req.file.buffer,
        req.file.originalname,
        submission._id
      );
    }
    // const indexResult = await azureVideoIndexer.uploadVideo(fileUrl, fileName);
    // console.log("Index Result: ", indexResult);

    return res.status(201).json({
      message: "Submission received, transcription in progress...",
      submission,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Error processing submission",
      error: error.message,
    });
  }
};

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
// @route GET /api/submissions/user/:assignmentId
// @access Private (Trainee)
exports.getSubmissionsByAssignmentId = async (req, res) => {
  try {
    const submissions = await Submission.find({
      trainee: req.user.id,
      assignment: req.params.id,
    }).populate("challenge", ["name"]);
    console.log(submissions);
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
