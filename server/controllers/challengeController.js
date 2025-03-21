const Challenge = require('../models/Challenge');
const EmbeddingService = require('../services/transformerEmbeddingService');
const logger = require('../utils/logger');

// @route    POST api/challenges
// @desc     Create a new challenge
// @access   Private (Trainer, Manager, Admin)
exports.createChallenge = async (req, res) => {
  const { name, description, idealPitch, evaluationCriteria } = req.body;
  
  try {
    // Validate evaluation criteria format
    if (!Array.isArray(evaluationCriteria) || 
        !evaluationCriteria.every(criteria => 
          criteria.keyword && typeof criteria.weight === 'number' &&
          criteria.weight >= -5 && criteria.weight <= 5
        )) {
      return res.status(400).json({ 
        msg: 'Evaluation criteria must be an array of {keyword, weight} objects with weights between -5 and 5'
      });
    }

    // Get embeddings for ideal pitch if provided
    let idealPitchEmbeddings = null;
    if (idealPitch && idealPitch.trim() !== '') {
      logger.info(`Generating embeddings for ideal pitch in challenge: ${name}`);
      idealPitchEmbeddings = await EmbeddingService.getEmbeddings(idealPitch);
    }

    // Generate embeddings for each evaluation criterion
    logger.info(`Generating embeddings for ${evaluationCriteria.length} evaluation criteria`);
    const criteriaWithEmbeddings = await Promise.all(
      evaluationCriteria.map(async (criteria) => {
        const embeddings = await EmbeddingService.getEmbeddings(criteria.keyword);
        return {
          ...criteria,
          embeddings
        };
      })
    );

    const challenge = new Challenge({
      name,
      description,
      idealPitch,
      idealPitchEmbeddings,
      evaluationCriteria: criteriaWithEmbeddings,
      createdBy: req.user.id,
    });

    await challenge.save();
    res.json(challenge);
  } catch (err) {
    logger.error(`Error creating challenge: ${err.message}`, err);
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
    logger.error(`Error getting challenges: ${err.message}`, err);
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
    logger.error(`Error getting challenge by ID: ${err.message}`, err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    res.status(500).send('Server error');
  }
};