const executionService = require('../services/executionService');

class ExecutionController {
  async list(req, res, next) {
    try {
      const result = await executionService.listExecutions(req.user.id, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const execution = await executionService.getExecutionById(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: execution });
    } catch (error) {
      next(error);
    }
  }

  async getTimeline(req, res, next) {
    try {
      const timeline = await executionService.getExecutionTimeline(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: timeline });
    } catch (error) {
      next(error);
    }
  }

  async pause(req, res, next) {
    try {
      const updated = await executionService.pauseExecution(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async resume(req, res, next) {
    try {
      const updated = await executionService.resumeExecution(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const updated = await executionService.cancelExecution(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExecutionController();
