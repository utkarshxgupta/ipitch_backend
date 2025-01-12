const express = require('express');
const { register, login, getUser, updateUser } = require('../controllers/authController');
const { auth, roleCheck } = require('../middleware/authMiddleware');
const { getExamples, createExample } = require('../controllers/exampleController');
const { getUsers, updateUserRoles, getUserById } = require('../controllers/adminController');
const { getChallenges, createChallenge, getChallengeById } = require('../controllers/challengeController');
const { createSubmission, getSubmissionsByChallengeId, evaluateSubmission } = require('../controllers/submissionController');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { createAssignment, getAssignments, getAssignmentsByUser } = require('../controllers/assignmentController');
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

// Admin routes
router.get('/admin/users', auth, roleCheck(['admin']), getUsers);
router.put('/admin/users/:id/roles', auth, roleCheck(['admin']), updateUserRoles);
router.get('/admin/users/:id', auth, roleCheck(['admin']), getUserById);

// Challenge routes
router.get('/challenges', getChallenges);
router.post('/challenges', auth, roleCheck(['trainer', 'manager', 'admin']), createChallenge);
router.get('/challenges/:id', getChallengeById);

// Submission routes
router.post('/submissions', auth, roleCheck(['trainee']), createSubmission);
router.get('/submissions/:id', auth, roleCheck(['trainer', 'manager', 'admin']), getSubmissionsByChallengeId);
router.post('/submissions/:id/evaluate', auth, roleCheck(['trainer', 'manager', 'admin']), evaluateSubmission);

// Notification routes
router.get('/notifications', auth, getNotifications);
router.put('/notifications/:id/read', auth, markAsRead);

// Assignment routes
router.post('/assignments', auth, roleCheck(['manager', 'admin']), createAssignment);
router.get('/assignments', auth, roleCheck(['manager', 'admin']), getAssignments);
router.get('/assignments/user', auth, getAssignmentsByUser);

module.exports = router;