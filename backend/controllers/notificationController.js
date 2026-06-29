const Notification = require("../models/Notification");

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications?isRead=false
// @access  Private (any logged-in role)
const getMyNotifications = async (req, res, next) => {
  try {
    const filter = { recipient: req.user._id };
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === "true";
    }

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (any logged-in role - must be the recipient)
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.statusCode = 404;
      throw new Error("Notification not found");
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      res.statusCode = 403;
      throw new Error("Access denied. This is not your notification");
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all of the logged-in user's notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private (any logged-in role)
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (any logged-in role - must be the recipient)
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.statusCode = 404;
      throw new Error("Notification not found");
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      res.statusCode = 403;
      throw new Error("Access denied. This is not your notification");
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
