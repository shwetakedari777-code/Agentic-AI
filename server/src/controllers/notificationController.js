const notificationService = require('../services/notificationService');

class NotificationController {
  async list(req, res, next) {
    try {
      const result = await notificationService.listNotifications(req.user.id, req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
