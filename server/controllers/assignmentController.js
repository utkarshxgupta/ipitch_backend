const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const AssignmentProgress = require("../models/AssignmentProgress");
const logger = require("../utils/logger");

// @route    POST api/assignments
// @desc     Create a new assignment
// @access   Private (Manager/Admin)
exports.createAssignment = async (req, res) => {
  const { name, challenges, assignedUsers, startDate, endDate, enableHints } = req.body;
  try {
    const assignment = new Assignment({
      name,
      challenges,
      assignedUsers,
      startDate,
      endDate,
      enableHints: enableHints || false,
      createdBy: req.user.id,
    });
    
    // Save the assignment
    const savedAssignment = await assignment.save();
    
    // Create assignment progress records for all assigned users
    if (assignedUsers && assignedUsers.length > 0) {
      const progressRecords = assignedUsers.map(userId => ({
        user: userId,
        assignment: savedAssignment._id,
        challengeProgress: [],
        overallScore: 0,
        completedChallenges: 0,
        totalChallenges: challenges.length,
        lastUpdated: new Date()
      }));
      
      try {
        // Create all progress records in a single operation
        await AssignmentProgress.insertMany(progressRecords);
        logger.info(`Created progress records for ${assignedUsers.length} users in assignment: ${savedAssignment._id}`);
      } catch (progressError) {
        logger.error(`Error creating progress records: ${progressError.message}`);
        // We don't want to fail the assignment creation if progress creation fails
        // Just log the error and continue
      }
    }
    
    res.json(savedAssignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route    GET api/assignments
// @desc     Get all assignments (for manager/admin)
// @access   Private (Manager/Admin)
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('challenges assignedUsers');
    res.json(assignments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route    GET api/assignments/user
// @desc     Get assignments for the authenticated user
// @access   Private
exports.getAssignmentsByUser = async (req, res) => {
  try {
    const assignments = await Assignment.find({ assignedUsers: req.user.id }).populate('challenges');
    res.json(assignments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route    GET api/assignments/:id
// @desc     Get assignment by ID
// @access   Private
exports.getAssignmentById = async (req, res) => {
  try {
    // if user role is not manager or admin, check if the assignment is assigned to the user and we don't need to send assignedUsers
    // console.log("REQ USER ", req.user);
    const isManagerAdmin = req.user.role.includes("manager") || req.user.role.includes("admin");

    // don't send entire challenge object, only send name

    const assignment = await Assignment.findById(req.params.id).populate([
      { path: "challenges" },
      { path: "createdBy", select: "name" },
      ...(isManagerAdmin ? [{ path: "assignedUsers", select: "name email" }] : [])
    ]);
    if (!assignment) {
      return res.status(404).json({ msg: "Assignment not found" });
    }
    if (!isManagerAdmin) {
      assignment.assignedUsers = null;
    }
    // console.log("ASSIGNMENT ", assignment);
    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route    PUT api/assignments/:id
// @desc     Update an assignment
// @access   Private (Manager/Admin)
exports.updateAssignment = async (req, res) => {
  const { name, challenges, assignedUsers, startDate, endDate, enableHints } = req.body;
  
  // Build assignment object
  const assignmentFields = {};
  if (name) assignmentFields.name = name;
  if (challenges) assignmentFields.challenges = challenges;
  if (assignedUsers) assignmentFields.assignedUsers = assignedUsers;
  if (startDate) assignmentFields.startDate = startDate;
  if (endDate) assignmentFields.endDate = endDate;
  if (enableHints !== undefined) assignmentFields.enableHints = enableHints;
  
  try {
    let assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }
    
    // Make sure user is the assignment creator or an admin
    if (assignment.createdBy.toString() !== req.user.id && 
        !req.user.role.includes('admin')) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { $set: assignmentFields },
      { new: true }
    ).populate([
      { path: "challenges" },
      { path: "createdBy", select: "name" },
      { path: "assignedUsers", select: "name email" }
    ]);
    
    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route GET api/assignments/:id/progress 
// @desc Gets the progress of challenges in assignment
// @access Private
exports.getAssignmentProgress = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Get the assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }
    
    const totalChallenges = assignment.challenges.length;
    
    // Get submissions by current user for this assignment
    const submissions = await Submission.find({
      assignment: assignmentId,
      trainee: req.user.id
    });
    
    // Get unique challenge IDs that have been attempted
    const completedChallengeIds = [...new Set(submissions.map(sub => sub.challenge.toString()))];
    const completedChallenges = completedChallengeIds.length;
    
    return res.json({
      totalChallenges,
      completedChallenges,
      challenges: assignment.challenges,
      completedChallengeIds
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
