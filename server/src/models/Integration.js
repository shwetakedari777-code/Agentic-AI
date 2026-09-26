const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const integrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    scopes: {
      type: [String],
      default: [],
    },
    encryptedTokens: {
      type: String, // Encrypted payload with CREDENTIAL_ENCRYPTION_KEY
      default: null,
    },
    accountInfo: {
      type: Object, // e.g. email, workspace name, bot name
      default: {},
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Integration = createModel('Integration', integrationSchema);

module.exports = Integration;
