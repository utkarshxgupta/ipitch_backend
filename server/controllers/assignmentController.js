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
// @access   Private (Manager/Admin)
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('challenges assignedUsers');
    if (!assignment) {
      return res.status(404).json({ msg: "Assignment not found" });
    }
    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
