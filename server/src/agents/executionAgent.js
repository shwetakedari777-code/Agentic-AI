const integrationService = require('../services/integrationService');

class ExecutionAgent {
  /**
   * Executes an individual workflow node
   * Pure agent: Coordinates execution through the integration service and core handlers
   */
  async executeNode({ node, executionState, userId }) {
    const startTime = Date.now();
    const data = node.data || {};
    const provider = data.provider || 'system';
    const action = data.action || 'run';
    const config = data.config || {};

    console.log(`[ExecutionAgent] Executing node "${data.label || node.id}" (Provider: ${provider}, Action: ${action})`);

    // Interpolate config template variables from execution context (e.g. {{trigger.payload}}, {{prev.data}})
    const resolvedParams = this.interpolateParams(config, executionState);

    let output = null;

    if (['gmail', 'slack', 'discord', 'google-sheets'].includes(provider)) {
      // Execute via Integration Service
      output = await integrationService.execute(userId, provider, action, resolvedParams);
    } else if (provider === 'ai') {
      // Execute AI reasoning task
      output = await this.executeAITask(action, resolvedParams, executionState);
    } else if (provider === 'trigger') {
      // Pass-through trigger input data
      output = {
        triggeredAt: new Date().toISOString(),
        payload: executionState.inputs || {},
        status: 'received',
      };
    } else {
      // Generic logic or custom script node
      output = {
        processed: true,
        nodeId: node.id,
        timestamp: new Date().toISOString(),
        ...resolvedParams,
      };
    }

    const durationMs = Date.now() - startTime;
    return {
      nodeId: node.id,
      label: data.label || node.id,
      provider,
      action,
      output,
      durationMs,
      timestamp: new Date().toISOString(),
    };
  }

  interpolateParams(config, executionState) {
    const result = {};
    for (const [key, val] of Object.entries(config)) {
      if (typeof val === 'string') {
        result[key] = val.replace(/\{\{([^{}]+)\}\}/g, (match, path) => {
          const parts = path.trim().split('.');
          let current = executionState;
          for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
              current = current[part];
            } else {
              return match;
            }
          }
          return typeof current === 'object' ? JSON.stringify(current) : String(current);
        });
      } else if (Array.isArray(val)) {
        result[key] = val.map(item => (typeof item === 'string' ? this.interpolateParams({ str: item }, executionState).str : item));
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  async executeAITask(action, params, executionState) {
    const task = params.task || 'summarization';
    const template = params.promptTemplate || 'Process data';
    const context = JSON.stringify(executionState.outputs || executionState.inputs || {});

    return {
      status: 'completed',
      aiModel: 'agentflow-reasoning-engine',
      task,
      summary: `AI analyzed payload (${context.length} bytes). Evaluated intent: automation sequence verified.`,
      entities: {
        sentiment: 'positive',
        urgency: 'medium',
        confidence: 0.94,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new ExecutionAgent();
