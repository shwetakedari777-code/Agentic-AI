const Notification = require('../models/Notification');
const { emitNotification } = require('../config/socket');

class NotificationService {
  async listNotifications(userId, { limit = 30 } = {}) {
    const notifications = await Notification.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    const unreadCount = await Notification.countDocuments({ owner: userId, isRead: false });

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(id, userId) {
    const notif = await Notification.findOne({ _id: id, owner: userId });
    if (!notif) {
      const err = new Error('Notification not found');
      err.statusCode = 404;
      throw err;
    }
    notif.isRead = true;
    await notif.save();
    return notif;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany({ owner: userId, isRead: false }, { $set: { isRead: true } });
    return { success: true };
  }

  async createNotification({ owner, workflowId, executionId, type, title, message }) {
    const notif = await Notification.create({
      owner,
      workflowId,
      executionId,
      type,
      title,
      message,
      isRead: false,
    });
    emitNotification(owner, notif.toObject ? notif.toObject() : notif);
    return notif;
  }
}

module.exports = new NotificationService();
