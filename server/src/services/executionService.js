const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const { emitExecutionEvent } = require('../config/socket');
const { addExecutionJob } = require('../queues/executionQueue');

class ExecutionService {
  async listExecutions(userId, { status = '', workflowId = '', page = 1, limit = 20 } = {}) {
    const query = {};
    if (userId) query.owner = userId;
    if (status) query.status = status;
    if (workflowId) query.workflowId = workflowId;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const executions = await Execution.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Execution.countDocuments(query);

    return {
      executions,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getExecutionById(id, userId) {
    const query = { _id: id };
    if (userId) query.owner = userId;

    const execution = await Execution.findOne(query);
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      err.code = 'EXECUTION_NOT_FOUND';
      throw err;
    }
    return execution;
  }

  async getExecutionTimeline(id, userId) {
    await this.getExecutionById(id, userId);

    const logs = await ExecutionLog.find({ executionId: id })
      .sort({ timestamp: 1 });

    return logs;
  }

  async pauseExecution(id, userId) {
    const execution = await this.getExecutionById(id, userId);
    if (execution.status !== 'RUNNING' && execution.status !== 'RETRYING') {
      const err = new Error(`Cannot pause execution with status ${execution.status}`);
      err.statusCode = 400;
      throw err;
    }

    execution.status = 'PAUSED';
    await execution.save();

    emitExecutionEvent(id, 'execution:status', {
      executionId: id,
      status: 'PAUSED',
    });

    return execution;
  }

  async resumeExecution(id, userId) {
    const execution = await this.getExecutionById(id, userId);
    if (execution.status !== 'PAUSED') {
      const err = new Error(`Cannot resume execution with status ${execution.status}`);
      err.statusCode = 400;
      throw err;
    }

    execution.status = 'RUNNING';
    await execution.save();

    emitExecutionEvent(id, 'execution:status', {
      executionId: id,
      status: 'RUNNING',
    });

    // Re-enqueue remaining execution
    await addExecutionJob({
      executionId: execution._id.toString(),
      workflow: execution.workflowSnapshot,
      inputs: execution.inputs,
      userId,
    });

    return execution;
  }

  async cancelExecution(id, userId) {
    const execution = await this.getExecutionById(id, userId);
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(execution.status)) {
      const err = new Error(`Cannot cancel execution with status ${execution.status}`);
      err.statusCode = 400;
      throw err;
    }

    execution.status = 'CANCELLED';
    execution.endTime = new Date();
    await execution.save();

    emitExecutionEvent(id, 'execution:status', {
      executionId: id,
      status: 'CANCELLED',
    });

    return execution;
  }
}

module.exports = new ExecutionService();
