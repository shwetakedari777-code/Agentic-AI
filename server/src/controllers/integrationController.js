const integrationService = require('../services/integrationService');

class IntegrationController {
  async list(req, res, next) {
    try {
      const integrations = await integrationService.listAvailableIntegrations(req.user.id);
      res.status(200).json({ success: true, data: integrations });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const integrations = await integrationService.listAvailableIntegrations(req.user.id);
      res.status(200).json({
        success: true,
        data: {
          providers: integrations,
          healthy: integrations.some(i => i.isConnected),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async startOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const authUrl = await integrationService.getAuthUrl(provider, req.user.id);
      if (authUrl.startsWith('/')) {
        // Local simulation redirect
        return res.redirect(authUrl);
      }
      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async handleCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/integrations?error=${encodeURIComponent(error)}`);
      }

      let userId = req.user?.id;
      if (state) {
        try {
          const parsed = JSON.parse(state);
          if (parsed.userId) userId = parsed.userId;
        } catch (e) {}
      }

      await integrationService.handleOAuthCallback(provider, code || 'simulated_code', userId || 'anonymous');
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/integrations?connected=${provider}`);
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/integrations?error=${encodeURIComponent(error.message)}`);
    }
  }

  async simulateOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const { state } = req.query;
      let userId = 'demo_user';
      if (state) {
        try {
          const parsed = JSON.parse(state);
          if (parsed.userId) userId = parsed.userId;
        } catch (e) {}
      }
      await integrationService.handleOAuthCallback(provider, 'simulated_dev_code', userId);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/integrations?connected=${provider}`);
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/integrations?error=${encodeURIComponent(error.message)}`);
    }
  }

  async oauthError(req, res) {
    res.status(400).json({
      success: false,
      error: req.query.message || 'OAuth authentication was rejected or failed',
      code: 'OAUTH_ERROR',
    });
  }

  async manualSetup(req, res, next) {
    try {
      const { provider, credentials, accountInfo } = req.body;
      const result = await integrationService.saveManualCredentials(req.user.id, {
        provider,
        credentials,
        accountInfo,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async disconnect(req, res, next) {
    try {
      const { provider } = req.params;
      const result = await integrationService.disconnect(req.user.id, provider);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IntegrationController();
