const Submission = require('../models/Submission');
const Challenge = require('../models/Challenge');
const Assignment = require('../models/Assignment');

// @route    POST api/submissions
// @desc     Create a new submission
// @access   Private (Trainee)
exports.createSubmission = async (req, res) => {
  try {
    const { assignmentId, challengeId, pitch } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }

    const newSubmission = new Submission({
      assignment: assignmentId,
      challenge: challengeId,
      trainee: req.user.id,
      pitch
    });

    const submission = await newSubmission.save();
    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

// @route    GET api/submissions/:id
// @desc     Get submissions for a challenge by ID
// @access   Private (Trainer, Manager, Admin)
exports.getSubmissionsByChallengeId = async (req, res) => {
  try {
    const submissions = await Submission.find({ challenge: req.params.id })
      .populate('trainee', ['name'])
      .populate('evaluations.evaluator', ['name']);
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
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
      return res.status(404).json({ msg: 'Submission not found' });
    }

    const newEvaluation = {
      evaluator: req.user.id,
      score,
      feedback
    };

    submission.evaluations.unshift(newEvaluation);
    await submission.save();
    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};