const Integration = require('../models/Integration');
const { encrypt, decrypt } = require('../utils/crypto');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

class IntegrationService {
  constructor() {
    this.registry = {
      gmail: gmailIntegration,
      slack: slackIntegration,
      discord: discordIntegration,
      'google-sheets': googleSheetsIntegration,
    };
  }

  getProviderHandler(provider) {
    const handler = this.registry[provider];
    if (!handler) {
      const err = new Error(`Integration provider '${provider}' is not supported`);
      err.code = 'PROVIDER_NOT_SUPPORTED';
      err.statusCode = 400;
      throw err;
    }
    return handler;
  }

  async listAvailableIntegrations(userId) {
    const userConnections = await Integration.find({ owner: userId });
    const connectionMap = new Map();
    userConnections.forEach(conn => {
      connectionMap.set(conn.provider, conn);
    });

    return Object.entries(this.registry).map(([id, handler]) => {
      const conn = connectionMap.get(id);
      return {
        id,
        name: handler.name,
        description: handler.description,
        icon: handler.icon,
        requiredScopes: handler.requiredScopes,
        isConnected: Boolean(conn && conn.isConnected),
        accountInfo: conn?.accountInfo || null,
        expiresAt: conn?.expiresAt || null,
      };
    });
  }

  async getAuthUrl(provider, userId) {
    const handler = this.getProviderHandler(provider);
    const state = JSON.stringify({ userId, provider, timestamp: Date.now() });
    return handler.getAuthUrl(state);
  }

  async handleOAuthCallback(provider, code, userId) {
    const handler = this.getProviderHandler(provider);
    const tokenData = await handler.handleCallback(code);

    // Encrypt sensitive tokens at rest
    const encryptedTokens = encrypt({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
    });

    let integration = await Integration.findOne({ owner: userId, provider });
    if (integration) {
      integration.isConnected = true;
      integration.encryptedTokens = encryptedTokens;
      integration.accountInfo = tokenData.accountInfo || {};
      integration.expiresAt = tokenData.expiresAt || null;
      await integration.save();
    } else {
      integration = await Integration.create({
        owner: userId,
        provider,
        isConnected: true,
        encryptedTokens,
        accountInfo: tokenData.accountInfo || {},
        expiresAt: tokenData.expiresAt || null,
      });
    }

    return {
      provider,
      isConnected: true,
      accountInfo: integration.accountInfo,
    };
  }

  async saveManualCredentials(userId, { provider, credentials, accountInfo = {} }) {
    this.getProviderHandler(provider); // validate provider

    const encryptedTokens = encrypt(credentials);
    let integration = await Integration.findOne({ owner: userId, provider });
    if (integration) {
      integration.isConnected = true;
      integration.encryptedTokens = encryptedTokens;
      integration.accountInfo = accountInfo;
      await integration.save();
    } else {
      integration = await Integration.create({
        owner: userId,
        provider,
        isConnected: true,
        encryptedTokens,
        accountInfo,
      });
    }

    return {
      provider,
      isConnected: true,
      accountInfo,
    };
  }

  async disconnect(userId, provider) {
    const integration = await Integration.findOne({ owner: userId, provider });
    if (integration) {
      integration.isConnected = false;
      integration.encryptedTokens = null;
      integration.accountInfo = {};
      await integration.save();
    }
    return { provider, isConnected: false };
  }

  /**
   * Safe execution entry point for agents.
   * Enforces credentials, decrypts safely, handles errors.
   */
  async execute(userId, provider, action, params = {}) {
    const handler = this.getProviderHandler(provider);
    const conn = await Integration.findOne({ owner: userId, provider });

    // In dev / test workflows, if user hasn't explicitly connected, allow sandbox mock execution
    // or check if connection is required
    let credentials = null;

    if (conn && conn.isConnected && conn.encryptedTokens) {
      try {
        credentials = decrypt(conn.encryptedTokens);
      } catch (decErr) {
        const err = new Error(`Failed to decrypt credentials for ${provider}. Token may be corrupted.`);
        err.code = 'AUTH_EXPIRED';
        err.statusCode = 401;
        throw err;
      }
    }

    // Check expiration
    if (conn && conn.expiresAt && new Date(conn.expiresAt) < new Date()) {
      if (credentials?.refreshToken) {
        try {
          const refreshed = await handler.refreshToken(credentials.refreshToken);
          credentials.accessToken = refreshed.accessToken;
          conn.encryptedTokens = encrypt(credentials);
          conn.expiresAt = refreshed.expiresAt;
          await conn.save();
        } catch (refreshErr) {
          const err = new Error(`Integration token for ${provider} has expired. Please reconnect.`);
          err.code = 'AUTH_EXPIRED';
          err.statusCode = 401;
          throw err;
        }
      } else {
        const err = new Error(`Integration token for ${provider} has expired.`);
        err.code = 'AUTH_EXPIRED';
        err.statusCode = 401;
        throw err;
      }
    }

    // If not connected and no credentials
    if (!credentials) {
      // For developer convenience when testing workflows without API keys set up,
      // allow fallback to sandbox execution if params._allowSandbox is enabled or in development
      if (process.env.NODE_ENV === 'development' || params._allowSandbox) {
        console.warn(`[IntegrationService] Running ${provider}.${action} in Sandbox Fallback mode`);
        credentials = { accessToken: `${provider}_mock_token_dev` };
      } else {
        const err = new Error(`Integration '${provider}' is not connected. Please connect it in the Integrations tab.`);
        err.code = 'INTEGRATION_NOT_CONNECTED';
        err.statusCode = 400;
        throw err;
      }
    }

    return handler.executeAction(action, params, credentials);
  }
}

module.exports = new IntegrationService();
