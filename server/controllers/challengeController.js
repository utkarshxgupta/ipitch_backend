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
      .select('name description createdDate attempts')
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

// @route    PUT api/challenges/:id
// @desc     Update a challenge by ID
// @access   Private (Trainer, Manager, Admin)
exports.updateChallenge = async (req, res) => {
  const { name, description, idealPitch, evaluationCriteria } = req.body;
  
  try {
    // Find the challenge first
    let challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    
    // // Check if user is authorized to update this challenge
    // // Only the challenge creator or admin should be able to update
    // if (challenge.createdBy.toString() !== req.user.id && 
    //     !req.user.role.includes('admin')) {
    //   return res.status(401).json({ msg: 'Not authorized to update this challenge' });
    // }
    
    // Validate evaluation criteria format if provided
    if (evaluationCriteria) {
      if (!Array.isArray(evaluationCriteria) || 
          !evaluationCriteria.every(criteria => 
            criteria.keyword && typeof criteria.weight === 'number' &&
            criteria.weight >= -5 && criteria.weight <= 5
          )) {
        return res.status(400).json({ 
          msg: 'Evaluation criteria must be an array of {keyword, weight} objects with weights between -5 and 5'
        });
      }
    }

    // Initialize update object with basic fields
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    
    // Generate new embeddings for ideal pitch if provided
    if (idealPitch !== undefined) {
      updateData.idealPitch = idealPitch;
      
      if (idealPitch && idealPitch.trim() !== '') {
        logger.info(`Generating embeddings for updated ideal pitch in challenge: ${name || challenge.name}`);
        updateData.idealPitchEmbeddings = await EmbeddingService.getEmbeddings(idealPitch);
      } else {
        // If ideal pitch is empty, set embeddings to null
        updateData.idealPitchEmbeddings = null;
      }
    }

    // Generate embeddings for evaluation criteria if provided
    if (evaluationCriteria) {
      logger.info(`Generating embeddings for ${evaluationCriteria.length} updated evaluation criteria`);
      updateData.evaluationCriteria = await Promise.all(
        evaluationCriteria.map(async (criteria) => {
          const embeddings = await EmbeddingService.getEmbeddings(criteria.keyword);
          return {
            ...criteria,
            embeddings
          };
        })
      );
    }

    // Update the challenge
    const updatedChallenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('createdBy', ['name']);

    res.json(updatedChallenge);
  } catch (err) {
    logger.error(`Error updating challenge: ${err.message}`, err);
    res.status(500).send('Server error');
  }
};

// @route    DELETE api/challenges
// @desc     Delete multiple challenges by IDs
// @access   Private (Trainer, Admin)
exports.deleteChallenges = async (req, res) => {
  const { challengeIds } = req.body;
  
  try {
    // Validate input
    if (!Array.isArray(challengeIds) || challengeIds.length === 0) {
      return res.status(400).json({ msg: 'Please provide an array of challenge IDs' });
    }
    
    // Check if challenges exist and are not part of active assignments
    const Assignment = require('../models/Assignment');
    const activeAssignmentChallenges = await Assignment.distinct("challenges", { 
      challenges: { $in: challengeIds },
      endDate: { $gte: new Date() }
    });
    
    if (activeAssignmentChallenges.length > 0) {
      return res.status(400).json({ 
        msg: "Some challenges are part of active assignments and cannot be deleted", 
        activeAssignmentChallenges 
      });
    }
    
    // Delete challenges
    const result = await Challenge.deleteMany({ _id: { $in: challengeIds } });
    
    logger.info(`Deleted ${result.deletedCount} challenges`);
    res.json({ 
      msg: "Challenges deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    logger.error(`Error deleting challenges: ${err.message}`, err);
    res.status(500).send('Server error');
  }
};