const express = require('express');
const { body } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Public/OAuth routes
router.get('/oauth/error', integrationController.oauthError);
router.get('/oauth/:provider/simulate', integrationController.simulateOAuth);
router.get('/oauth/:provider/callback', integrationController.handleCallback);

// Authenticated routes
router.use(authenticate);

router.get('/', integrationController.list);
router.get('/status', integrationController.getStatus);
router.get('/oauth/:provider/start', integrationController.startOAuth);
router.post(
  '/',
  [
    body('provider').notEmpty().withMessage('Provider is required'),
    body('credentials').notEmpty().withMessage('Credentials object or token is required'),
  ],
  validate,
  integrationController.manualSetup
);
router.delete('/:provider', integrationController.disconnect);

module.exports = router;
