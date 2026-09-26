class RecoveryAgent {
  /**
   * Classifies failures and formulates recovery strategy
   * Categories: MISSING_FIELDS | API_FAILURE | AUTH_EXPIRED | RATE_LIMIT | TRANSIENT
   * Strategies: retry_with_backoff | escalate
   */
  async recover({ error, node, attemptCount = 0, maxRetries = 2 }) {
    const errorMsg = (error.message || '').toLowerCase();
    const errorCode = error.code || '';
    const status = error.statusCode || error.status || error.response?.status;

    let classification = 'API_FAILURE';
    let suggestedAction = 'Inspect error logs and check node configuration.';

    // 1. Classification
    if (errorCode === 'MISSING_FIELDS' || error.missingFields) {
      classification = 'MISSING_FIELDS';
      suggestedAction = `The node failed to produce required fields: [${(error.missingFields || []).join(', ')}]. Update downstream mappings or node config.`;
    } else if (
      errorCode === 'AUTH_EXPIRED' ||
      errorCode === 'INTEGRATION_NOT_CONNECTED' ||
      status === 401 ||
      errorMsg.includes('auth') ||
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('token') ||
      errorMsg.includes('not connected')
    ) {
      classification = 'AUTH_EXPIRED';
      suggestedAction = `Authentication failed for provider. Navigate to the Integrations page to authorize or refresh credentials.`;
    } else if (status === 429 || errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
      classification = 'RATE_LIMIT';
      suggestedAction = `Provider rate limit reached. System should backoff and throttle subsequent requests.`;
    } else if (
      status === 502 ||
      status === 503 ||
      status === 504 ||
      errorMsg.includes('timeout') ||
      errorMsg.includes('econnreset') ||
      errorMsg.includes('socket hang up') ||
      errorMsg.includes('econnrefused')
    ) {
      classification = 'TRANSIENT';
      suggestedAction = `Temporary network or upstream infrastructure fluctuation detected. Safe for automatic retry.`;
    } else {
      classification = 'API_FAILURE';
      suggestedAction = `Target API returned an unhandled error: ${error.message}. Verify input payload and endpoint availability.`;
    }

    // 2. Decision strategy: retry_with_backoff vs escalate
    const isRetryable = (classification === 'TRANSIENT' || classification === 'RATE_LIMIT') && attemptCount < maxRetries;
    const strategy = isRetryable ? 'retry_with_backoff' : 'escalate';

    let backoffMs = 0;
    if (strategy === 'retry_with_backoff') {
      const baseMs = classification === 'RATE_LIMIT' ? 3000 : 1000;
      const jitter = Math.floor(Math.random() * 300);
      backoffMs = baseMs * Math.pow(2, attemptCount) + jitter;
    }

    console.log(
      `[RecoveryAgent] Failure classified as [${classification}]. Strategy: [${strategy}]. Backoff: ${backoffMs}ms. Attempt: ${attemptCount + 1}/${maxRetries + 1}`
    );

    return {
      classification,
      strategy,
      attemptCount,
      backoffMs,
      suggestedAction,
      errorDetails: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new RecoveryAgent();
