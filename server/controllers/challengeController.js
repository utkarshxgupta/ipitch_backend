const Challenge = require('../models/Challenge');

// @route    POST api/challenges
// @desc     Create a new challenge
// @access   Private (Trainer, Manager, Admin)
exports.createChallenge = async (req, res) => {
  const { name, description, prompts, idealPitch, evaluationCriteria } = req.body;
  try {
    const challenge = new Challenge({
      name,
      description,
      prompts,
      idealPitch,
      evaluationCriteria,
      createdBy: req.user.id,
    });
    await challenge.save();
    res.json(challenge);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route    GET api/challenges
// @desc     Get all challenges
// @access   Private
exports.getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find().populate('createdBy', ['name']);
    res.json(challenges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route    GET api/challenges/:id
// @desc     Get a challenge by ID
// @access   Private
exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate('createdBy', ['name']);
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    res.status(500).send('Server error');
  }
};