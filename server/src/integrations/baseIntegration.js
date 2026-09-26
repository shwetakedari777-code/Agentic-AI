/**
 * BaseIntegration: Abstract interface that all 3rd-party integrations must implement
 */
class BaseIntegration {
  constructor({ id, name, description, requiredScopes = [], icon = '' }) {
    if (this.constructor === BaseIntegration) {
      throw new Error('BaseIntegration cannot be instantiated directly.');
    }
    this.id = id;
    this.name = name;
    this.description = description;
    this.requiredScopes = requiredScopes;
    this.icon = icon;
  }

  /**
   * Generates provider OAuth authorization URL
   */
  getAuthUrl(state = '') {
    throw new Error('getAuthUrl() must be implemented by subclass.');
  }

  /**
   * Exchanges OAuth authorization code for tokens
   */
  async handleCallback(code) {
    throw new Error('handleCallback() must be implemented by subclass.');
  }

  /**
   * Verifies credentials validity with provider API
   */
  async testConnection(credentials) {
    throw new Error('testConnection() must be implemented by subclass.');
  }

  /**
   * Executes a defined action (e.g., 'send_email', 'post_message')
   */
  async executeAction(action, params = {}, credentials = {}) {
    throw new Error('executeAction() must be implemented by subclass.');
  }

  /**
   * Refreshes an expired access token using the refresh token
   */
  async refreshToken(refreshToken) {
    throw new Error('refreshToken() must be implemented by subclass.');
  }
}

module.exports = BaseIntegration;
