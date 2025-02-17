const User = require("../models/userModel");

// @route    GET api/admin/users
// @desc     Get all users
// @access   Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route    GET api/admin/users/:id
// @desc     Get user by ID
// @access   Private (Admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route    PUT api/admin/users/:id/roles
// @desc     Update user roles
// @access   Private (Admin only)
exports.updateUserRoles = async (req, res) => {
  const { roles } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    user.role = roles;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route    PUT api/admin/users/:id
// @desc     Enable or disable the user
// @access   Private (Admin only)
exports.modifyUserAccess = async (req, res) => {
  const { isActive } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    user.isActive = isActive;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};