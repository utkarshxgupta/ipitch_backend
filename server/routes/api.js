const express = require("express");
const {
  register,
  login,
  getUser,
  updateUser,
  getEndUsers,
} = require("../controllers/authController");
const { auth, roleCheck } = require("../middleware/authMiddleware");
const {
  getExamples,
  createExample,
} = require("../controllers/exampleController");
const {
  getUsers,
  updateUserRoles,
  getUserById,
  modifyUserAccess,
} = require("../controllers/adminController");
const {
  getChallenges,
  createChallenge,
  getChallengeById,
} = require("../controllers/challengeController");
const {
  createSubmission,
  getSubmissionsByChallengeId,
  evaluateSubmission,
  getSubmissionsByAssignmentId,
  getSubmissionById,
  getAllSubmissions,
  addComment,
} = require("../controllers/submissionController");
const {
  getNotifications,
  markAsRead,
} = require("../controllers/notificationController");
const {
  createAssignment,
  getAssignments,
  getAssignmentsByUser,
  getAssignmentById,
  getAssignmentProgress,
  updateAssignment,
} = require("../controllers/assignmentController");
const router = express.Router();
const multer = require("multer");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 120 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only video files
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Not a video file!"), false);
    }
  },
});

// Example protected route for admin
router.get("/admin", auth, roleCheck(["admin"]), (req, res) => {
  res.send("Welcome Admin");
});

// Example protected route for manager
router.get("/manager", auth, roleCheck(["manager", "admin"]), (req, res) => {
  res.send("Welcome Manager");
});

// Example protected route for trainer
router.get(
  "/trainer",
  auth,
  roleCheck(["trainer", "manager", "admin"]),
  (req, res) => {
    res.send("Welcome Trainer");
  }
);

// Auth routes
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth", auth, getUser);
router.put("/auth/update", auth, updateUser);
router.get("/auth/users", auth, roleCheck(["manager", "admin"]), getEndUsers);

// Example routes
router.get("/examples", getExamples);
router.post("/examples", createExample);

// Admin routes
router.get("/admin/users", auth, roleCheck(["admin"]), getUsers);
router.put(
  "/admin/users/:id/roles",
  auth,
  roleCheck(["admin"]),
  updateUserRoles
);
router.get("/admin/users/:id", auth, roleCheck(["admin"]), getUserById);
router.put("/admin/users/:id", auth, roleCheck(["admin"]), modifyUserAccess);

// Challenge routes
router.get("/challenges", getChallenges);
router.post(
  "/challenges",
  auth,
  roleCheck(["trainer", "manager", "admin"]),
  createChallenge
);
router.get("/challenges/:id", getChallengeById);

// Submission routes
router.post(
  "/submissions",
  auth,
  roleCheck(["trainee", "trainer"]),
  upload.single("video"),
  createSubmission
);
router.get(
  "/submissions",
  auth,
  roleCheck(["manager", "admin"]),
  getAllSubmissions
);
router.get(
  "/submissions/challenge/:id",
  auth,
  roleCheck(["trainer", "manager", "admin"]),
  getSubmissionsByChallengeId
);
router.post(
  "/submissions/:id/evaluate",
  auth,
  roleCheck(["trainer", "manager", "admin"]),
  evaluateSubmission
);
router.get(
  "/submissions/user/assignment/:id",
  auth,
  getSubmissionsByAssignmentId
);
router.get("/submissions/:id", auth, getSubmissionById);
router.post(
  "/submissions/:id/comment",
  auth,
  roleCheck(["trainer", "manager", "admin"]),
  addComment
);

// Notification routes
router.get("/notifications", auth, getNotifications);
router.put("/notifications/:id/read", auth, markAsRead);

// Assignment routes
router.post(
  "/assignments",
  auth,
  roleCheck(["manager", "admin"]),
  createAssignment
);
router.get(
  "/assignments",
  auth,
  roleCheck(["manager", "admin"]),
  getAssignments
);
router.get("/assignments/user", auth, getAssignmentsByUser);
router.get("/assignments/:id", auth, getAssignmentById);
router.get("/assignments/:id/progress", auth, getAssignmentProgress);
router.put(
  "/assignments/:id",
  auth,
  roleCheck(["manager", "admin"]),
  updateAssignment
);

module.exports = router;
