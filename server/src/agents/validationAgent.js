class ValidationAgent {
  /**
   * Verifies required output fields and contracts for executed nodes
   * Pure agent
   */
  async validateNodeOutput({ node, executionResult }) {
    const data = node.data || {};
    const provider = data.provider || 'system';
    const action = data.action || 'run';
    const output = executionResult?.output;

    if (!output || typeof output !== 'object') {
      const err = new Error(`ValidationAgent: Node "${data.label || node.id}" produced null or non-object output.`);
      err.code = 'MISSING_FIELDS';
      err.missingFields = ['output'];
      throw err;
    }

    const verifiedFields = [];
    const missingFields = [];

    switch (provider) {
      case 'gmail':
        if (action === 'send_email') {
          if (!output.recipient) missingFields.push('recipient');
          else verifiedFields.push('recipient');

          if (!output.status || output.status !== 'sent') missingFields.push('status (sent)');
          else verifiedFields.push('status');
        }
        break;

      case 'slack':
      case 'discord':
        if (!output.status || output.status !== 'delivered') missingFields.push('status (delivered)');
        else verifiedFields.push('status');
        break;

      case 'google-sheets':
        if (action === 'append_row') {
          if (!output.status || output.status !== 'appended') missingFields.push('status (appended)');
          else verifiedFields.push('status');
        }
        break;

      case 'ai':
        if (!output.status || output.status !== 'completed') missingFields.push('status (completed)');
        else verifiedFields.push('status');
        break;

      default:
        verifiedFields.push('generic_output_payload');
        break;
    }

    if (missingFields.length > 0) {
      const err = new Error(
        `ValidationAgent: Node "${data.label || node.id}" missing required output contracts: [${missingFields.join(', ')}]`
      );
      err.code = 'MISSING_FIELDS';
      err.missingFields = missingFields;
      throw err;
    }

    return {
      valid: true,
      verifiedFields,
      message: `Output verified: satisfies schema contracts [${verifiedFields.join(', ')}]`,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new ValidationAgent();
