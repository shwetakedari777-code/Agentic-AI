class MonitoringAgent {
  /**
   * Tracks telemetry, formats timeline entries, and monitors execution state
   * Pure agent
   */
  createTimelineEvent({ executionId, workflowId, nodeId, agent, level = 'info', message, metadata = {} }) {
    const memUsage = process.memoryUsage();
    return {
      executionId,
      workflowId,
      nodeId: nodeId || null,
      agent, // 'planner' | 'execution' | 'validation' | 'recovery' | 'monitoring'
      level, // 'info' | 'warning' | 'error' | 'success'
      message,
      metadata: {
        ...metadata,
        heapUsedMb: Math.round((memUsage.heapUsed / 1024 / 1024) * 10) / 10,
      },
      timestamp: new Date().toISOString(),
    };
  }

  summarizeExecution({ executionId, status, durationMs, stepCount, retryCount, errors = [] }) {
    return {
      executionId,
      status,
      durationMs,
      stepCount,
      retryCount,
      errorCount: errors.length,
      healthIndicator: status === 'COMPLETED' ? 'optimal' : status === 'PAUSED' ? 'suspended' : 'degraded',
      summary: `Workflow execution finished with status: ${status} in ${durationMs}ms across ${stepCount} steps.`,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new MonitoringAgent();
