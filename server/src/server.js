const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const env = require('./config/env');
const { connectDB, isMemoryMode } = require('./config/db');
const { initSocket } = require('./config/socket');
const authService = require('./services/authService');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const httpServer = http.createServer(app);

// Security & Optimization Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow React Flow inline styles and dynamic UI scripts
}));
app.use(compression());
app.use(morgan('dev'));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Origin is not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Socket.IO
initSocket(httpServer);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'Agentflow_AI (Agentic AI Automation Platform)',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    storage: isMemoryMode() ? 'in-memory-fallback' : 'mongodb',
    langGraph: (() => {
      try {
        require.resolve('@langchain/langgraph');
        return 'available';
      } catch (e) {
        return 'not-installed';
      }
    })(),
    aiProviders: {
      openRouter: Boolean(env.OPENROUTER_API_KEY),
      gemini: Boolean(env.GEMINI_API_KEY),
      deterministicEngine: true,
    },
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await authService.seedDefaultUsers();

    // Start background queue listener / runner
    try {
      const { initQueue } = require('./queues/executionQueue');
      initQueue();
    } catch (qErr) {
      console.warn('[Queue] Execution queue notice:', qErr.message);
    }

    httpServer.listen(env.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Agentflow_AI Backend running on port ${env.PORT}`);
      console.log(`🌐 API Base URL: http://localhost:${env.PORT}/api`);
      console.log(`🔌 Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`💾 Storage engine: ${isMemoryMode() ? 'In-Memory Fallback' : 'MongoDB'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = { app, httpServer };
