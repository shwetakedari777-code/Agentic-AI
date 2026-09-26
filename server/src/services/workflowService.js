const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const aiService = require('./aiService');
const { addExecutionJob } = require('../queues/executionQueue');

class WorkflowService {
  async listWorkflows(userId, { search = '', status = '', tag = '', page = 1, limit = 20 } = {}) {
    const query = { owner: userId };

    if (status) {
      query.status = status;
    }
    if (tag) {
      query.tags = tag;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const workflows = await Workflow.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Workflow.countDocuments(query);

    return {
      workflows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getWorkflowById(id, userId) {
    const workflow = await Workflow.findOne({ _id: id, owner: userId });
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      err.code = 'WORKFLOW_NOT_FOUND';
      throw err;
    }
    return workflow;
  }

  async createWorkflow(userId, data) {
    const workflow = await Workflow.create({
      name: data.name || 'Untitled Automation',
      description: data.description || '',
      owner: userId,
      status: data.status || 'draft',
      triggerConfig: data.triggerConfig || { type: 'manual' },
      nodes: data.nodes || [],
      edges: data.edges || [],
      version: 1,
      tags: data.tags || ['automation'],
    });
    return workflow;
  }

  async updateWorkflow(id, userId, data) {
    const existing = await this.getWorkflowById(id, userId);

    const updateFields = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.triggerConfig !== undefined) updateFields.triggerConfig = data.triggerConfig;
    if (data.nodes !== undefined) updateFields.nodes = data.nodes;
    if (data.edges !== undefined) updateFields.edges = data.edges;
    if (data.tags !== undefined) updateFields.tags = data.tags;

    updateFields.version = (existing.version || 1) + 1;

    const updated = await Workflow.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    return updated;
  }

  async duplicateWorkflow(id, userId) {
    const original = await this.getWorkflowById(id, userId);
    const cloned = await Workflow.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      owner: userId,
      status: 'draft',
      triggerConfig: original.triggerConfig,
      nodes: original.nodes,
      edges: original.edges,
      version: 1,
      tags: [...(original.tags || []), 'copy'],
    });
    return cloned;
  }

  async deleteWorkflow(id, userId) {
    await this.getWorkflowById(id, userId);
    await Workflow.findByIdAndDelete(id);
    return { success: true, deletedId: id };
  }

  async generateWorkflow(prompt) {
    return aiService.generateWorkflow(prompt);
  }

  async triggerExecution(workflowId, userId, inputs = {}) {
    const workflow = await this.getWorkflowById(workflowId, userId);

    // Create execution snapshot
    const execution = await Execution.create({
      workflowId: workflow._id,
      workflowSnapshot: {
        name: workflow.name,
        nodes: workflow.nodes,
        edges: workflow.edges,
        triggerConfig: workflow.triggerConfig,
      },
      status: 'PENDING',
      currentNode: null,
      startTime: new Date(),
      inputs,
      outputs: {},
      retryCount: 0,
      triggerType: workflow.triggerConfig?.type || 'manual',
      owner: userId,
    });

    // Enqueue for background execution
    const queueResult = await addExecutionJob({
      executionId: execution._id.toString(),
      workflow: {
        _id: workflow._id.toString(),
        name: workflow.name,
        nodes: workflow.nodes,
        edges: workflow.edges,
        triggerConfig: workflow.triggerConfig,
      },
      inputs,
      userId,
    });

    return {
      executionId: execution._id.toString(),
      status: 'PENDING',
      queue: queueResult,
    };
  }

  async getDashboardStats(userId) {
    const totalWorkflows = await Workflow.countDocuments({ owner: userId });
    const activeWorkflows = await Workflow.countDocuments({ owner: userId, status: 'active' });

    const totalExecutions = await Execution.countDocuments({ owner: userId });
    const completedExecutions = await Execution.countDocuments({ owner: userId, status: 'COMPLETED' });
    const failedExecutions = await Execution.countDocuments({ owner: userId, status: 'FAILED' });
    const runningExecutions = await Execution.countDocuments({ owner: userId, status: 'RUNNING' });

    const successRate = totalExecutions > 0
      ? Math.round((completedExecutions / totalExecutions) * 100)
      : 100;

    const recentExecutions = await Execution.find({ owner: userId })
      .sort({ startTime: -1 })
      .limit(6);

    const recentWorkflows = await Workflow.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .limit(4);

    return {
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        completedExecutions,
        failedExecutions,
        runningExecutions,
        successRate,
      },
      recentExecutions,
      recentWorkflows,
      systemHealth: 'All Agents Operational',
    };
  }
}

module.exports = new WorkflowService();
