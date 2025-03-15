const Challenge = require('../models/Challenge');
const EmbeddingService = require('../services/embeddingService');

// @route    POST api/challenges
// @desc     Create a new challenge
// @access   Private (Trainer, Manager, Admin)
exports.createChallenge = async (req, res) => {
  const { name, description, idealPitch, evaluationCriteria } = req.body;
  
  try {
    // Validate evaluation criteria format
    if (!Array.isArray(evaluationCriteria) || 
        !evaluationCriteria.every(criteria => 
          criteria.keyword && typeof criteria.weight === 'number'
        )) {
      return res.status(400).json({ 
        msg: 'Evaluation criteria must be an array of {keyword, weight} objects'
      });
    }

    // Get embeddings for ideal pitch
    const idealPitchEmbeddings = await EmbeddingService.getEmbeddings(idealPitch);

    const challenge = new Challenge({
      name,
      description,
      idealPitch,
      idealPitchEmbeddings,
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
    const challenges = await Challenge.find()
      .populate('createdBy', ['name'])
      .sort({ createdDate: -1 }); // Sort by newest first
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
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdBy', ['name']);
      
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