const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', notificationController.list);

// PUT /api/notifications/:id/read
router.put('/:id/read', notificationController.markRead);

// POST /api/notifications/clear
router.post('/clear', notificationController.markAllRead);

module.exports = router;
