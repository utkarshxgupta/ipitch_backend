const Notification = require("../models/Notification");

// @route    GET api/notifications
// @desc     Get all notifications for a user
// @access   Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// @route    PUT api/notifications/:id/read
// @desc     Mark notification as read
// @access   Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    // Only the owner should be able to mark it as read
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
