const express = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// GET /api/workflows/dashboard
router.get('/dashboard', workflowController.getDashboard);

// GET /api/workflows
router.get('/', workflowController.list);

// POST /api/workflows/generate
router.post(
  '/generate',
  [
    body('prompt').trim().notEmpty().withMessage('Prompt cannot be empty'),
  ],
  validate,
  workflowController.generate
);

// POST /api/workflows
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Workflow name is required'),
  ],
  validate,
  workflowController.create
);

// GET /api/workflows/:id
router.get('/:id', workflowController.getById);

// PUT /api/workflows/:id
router.put('/:id', workflowController.update);

// POST /api/workflows/:id/duplicate
router.post('/:id/duplicate', workflowController.duplicate);

// POST /api/workflows/:id/execute
router.post('/:id/execute', workflowController.execute);

// DELETE /api/workflows/:id
router.delete('/:id', workflowController.delete);

module.exports = router;
