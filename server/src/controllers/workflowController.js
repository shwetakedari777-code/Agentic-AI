const workflowService = require('../services/workflowService');

class WorkflowController {
  async list(req, res, next) {
    try {
      const result = await workflowService.listWorkflows(req.user.id, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const stats = await workflowService.getDashboardStats(req.user.id);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const workflow = await workflowService.getWorkflowById(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: workflow });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const workflow = await workflowService.createWorkflow(req.user.id, req.body);
      res.status(201).json({ success: true, data: workflow });
    } catch (error) {
      next(error);
    }
  }

  async generate(req, res, next) {
    try {
      const { prompt } = req.body;
      const generated = await workflowService.generateWorkflow(prompt);
      res.status(200).json({ success: true, data: generated });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await workflowService.updateWorkflow(req.params.id, req.user.id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async duplicate(req, res, next) {
    try {
      const cloned = await workflowService.duplicateWorkflow(req.params.id, req.user.id);
      res.status(201).json({ success: true, data: cloned });
    } catch (error) {
      next(error);
    }
  }

  async execute(req, res, next) {
    try {
      const { inputs } = req.body;
      const result = await workflowService.triggerExecution(req.params.id, req.user.id, inputs);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await workflowService.deleteWorkflow(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkflowController();
