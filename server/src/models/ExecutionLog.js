const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const executionLogSchema = new mongoose.Schema(
  {
    executionId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    nodeId: {
      type: String,
      default: null,
    },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ExecutionLog = createModel('ExecutionLog', executionLogSchema);

module.exports = ExecutionLog;
