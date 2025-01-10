const express = require('express');
const { register, login, getUser, updateUser } = require('../controllers/authController');
const { auth, roleCheck } = require('../middleware/authMiddleware');
const { getExamples, createExample } = require('../controllers/exampleController');
const router = express.Router();

// Example protected route for admin
router.get('/admin', auth, roleCheck(['admin']), (req, res) => {
    res.send('Welcome Admin');
  });
  
  // Example protected route for manager
  router.get('/manager', auth, roleCheck(['manager', 'admin']), (req, res) => {
    res.send('Welcome Manager');
  });
  
  // Example protected route for trainer
  router.get('/trainer', auth, roleCheck(['trainer', 'manager', 'admin']), (req, res) => {
    res.send('Welcome Trainer');
  });

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth', auth, getUser);
router.put('/auth/update', auth, updateUser);

// Example routes
router.get('/examples', getExamples);
router.post('/examples', createExample);

module.exports = router;
