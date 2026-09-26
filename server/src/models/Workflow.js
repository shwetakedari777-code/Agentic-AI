const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.Mixed, // string or ObjectId
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft',
    },
    triggerConfig: {
      type: Object,
      default: { type: 'manual' },
    },
    nodes: {
      type: Array,
      default: [],
    },
    edges: {
      type: Array,
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Workflow = createModel('Workflow', workflowSchema);

module.exports = Workflow;
