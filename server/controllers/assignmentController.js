const Assignment = require("../models/Assignment");

// @route    POST api/assignments
// @desc     Create a new assignment
// @access   Private (Manager/Admin)
exports.createAssignment = async (req, res) => {
  const { name, challenges, assignedUsers, startDate, endDate } = req.body;
  try {
    const assignment = new Assignment({
      name,
      challenges,
      assignedUsers,
      startDate,
      endDate,
      createdBy: req.user.id,
    });
    await assignment.save();
    res.json(assignment);
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
    console.log("REQ USER ", req.user);
    const isManagerAdmin = req.user.role.includes("manager") || req.user.role.includes("admin");

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
    console.log("ASSIGNMENT ", assignment);
    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

