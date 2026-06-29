const Notification = require("../models/Notification");

// Reusable helper to create a notification for a single user.
// Other controllers (complaints, visitors, bills, bookings, polls) call this
// to notify residents/staff/admins of relevant events.
// Swallows errors internally so a notification failure never breaks the
// primary action (e.g. a complaint should still be created even if the
// notification insert fails for some reason).
const createNotification = async ({ recipient, title, message, type, relatedId }) => {
  try {
    await Notification.create({
      recipient,
      title,
      message,
      type: type || "general",
      relatedId: relatedId || null,
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

// Creates the same notification for multiple recipients (e.g. all admins)
const createNotificationForMany = async (recipientIds, { title, message, type, relatedId }) => {
  try {
    const docs = recipientIds.map((recipient) => ({
      recipient,
      title,
      message,
      type: type || "general",
      relatedId: relatedId || null,
    }));
    await Notification.insertMany(docs);
  } catch (error) {
    console.error("Failed to create bulk notifications:", error.message);
  }
};

module.exports = { createNotification, createNotificationForMany };
