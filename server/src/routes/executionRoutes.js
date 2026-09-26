const express = require('express');
const executionController = require('../controllers/executionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/executions
router.get('/', executionController.list);

// GET /api/executions/:id
router.get('/:id', executionController.getById);

// GET /api/executions/:id/timeline
router.get('/:id/timeline', executionController.getTimeline);

// POST /api/executions/:id/pause
router.post('/:id/pause', executionController.pause);

// POST /api/executions/:id/resume
router.post('/:id/resume', executionController.resume);

// POST /api/executions/:id/cancel
router.post('/:id/cancel', executionController.cancel);

module.exports = router;
