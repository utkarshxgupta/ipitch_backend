const Example = require('../models/exampleModel');

// @desc    Get all examples
// @route   GET /api/examples
// @access  Public
exports.getExamples = async (req, res) => {
  try {
    const examples = await Example.find();
    res.json(examples);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

// @desc    Create a new example
// @route   POST /api/examples
// @access  Public
exports.createExample = async (req, res) => {
  try {
    const newExample = new Example(req.body);
    const example = await newExample.save();
    res.json(example);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
