const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const notificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    executionId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    type: {
      type: String,
      enum: ['success', 'failure', 'escalation', 'info'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = createModel('Notification', notificationSchema);

module.exports = Notification;
