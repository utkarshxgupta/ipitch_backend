const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');
const { body, validationResult } = require('express-validator');

const secret = process.env.JWT_SECRET || 'yoursecretkey';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = [
  // Validate and sanitize input
  body('name').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).trim().escape(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      user = new User({
        name,
        email,
        password,
        role: role ? role.split(',') : ['trainee']
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email
        }
      };
      console.log(payload);
      const token = jwt.encode(payload, secret);
      res.json({ token });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
];

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().trim().escape(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const payload = {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email
        }
      };

      const token = jwt.encode(payload, secret);
      res.json({ token });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
];

// @desc    Get current user info
// @route   GET /api/auth
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Ensure to import User model in the controller if not already imported
exports.updateUser = async (req, res) => {
  const { name, email } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all users except admins and managers
// @route   GET /api/auth/users
// @access  Private
exports.getEndUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $nin: ['admin', 'manager'] } }).select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
