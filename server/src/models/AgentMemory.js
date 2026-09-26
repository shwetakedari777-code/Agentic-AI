const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const agentMemorySchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    executionId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    agentId: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

const AgentMemory = createModel('AgentMemory', agentMemorySchema);

module.exports = AgentMemory;
