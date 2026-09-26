const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const executionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    workflowSnapshot: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentNode: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // ms
      default: 0,
    },
    inputs: {
      type: Object,
      default: {},
    },
    outputs: {
      type: Object,
      default: {},
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    triggerType: {
      type: String,
      default: 'manual',
    },
    owner: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Execution = createModel('Execution', executionSchema);

module.exports = Execution;
