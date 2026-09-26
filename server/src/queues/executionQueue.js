const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const env = require('../config/env');
const orchestrator = require('../agents/orchestrator');

let bullQueue = null;
let bullWorker = null;
let isRedisAvailable = false;

// Simple resilient in-memory queue fallback
const inMemoryQueue = [];
let isProcessingInMemory = false;

const processInMemoryQueue = async () => {
  if (isProcessingInMemory || inMemoryQueue.length === 0) return;
  isProcessingInMemory = true;

  while (inMemoryQueue.length > 0) {
    const job = inMemoryQueue.shift();
    try {
      console.log(`[Queue:InMemory] Processing execution job ${job.executionId}`);
      await orchestrator.run(job);
    } catch (err) {
      console.error(`[Queue:InMemory] Job error ${job.executionId}:`, err.message);
    }
  }

  isProcessingInMemory = false;
};

const initQueue = () => {
  try {
    if (!env.REDIS_URL || env.REDIS_URL === 'in-memory') {
      throw new Error('Redis disabled by configuration');
    }

    console.log('[Queue] Attempting Redis connection at:', env.REDIS_URL);
    const redisConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      retryStrategy: () => null, // Do not endlessly retry if not running
    });

    redisConnection.on('connect', () => {
      console.log('[Queue] BullMQ Redis connection established.');
      isRedisAvailable = true;

      bullQueue = new Queue('agentflow-execution-queue', { connection: redisConnection });
      bullWorker = new Worker(
        'agentflow-execution-queue',
        async (job) => {
          console.log(`[Queue:BullMQ] Worker executing job ${job.id} (Execution ${job.data.executionId})`);
          return orchestrator.run(job.data);
        },
        { connection: redisConnection }
      );

      bullWorker.on('failed', (job, err) => {
        console.error(`[Queue:BullMQ] Job ${job?.id} failed:`, err.message);
      });
    });

    redisConnection.on('error', (err) => {
      if (!isRedisAvailable) {
        console.warn(`[Queue] Redis connection failed (${err.message}). Activating In-Memory Background Queue fallback.`);
        isRedisAvailable = false;
      }
    });
  } catch (err) {
    console.warn(`[Queue] Redis unavailable (${err.message}). Using In-Memory Background Queue fallback.`);
    isRedisAvailable = false;
  }
};

const addExecutionJob = async (jobData) => {
  if (isRedisAvailable && bullQueue) {
    try {
      const job = await bullQueue.add('execute-workflow', jobData, {
        attempts: 1, // Orchestrator handles multi-agent internal recovery
        removeOnComplete: true,
      });
      return { jobId: job.id, mode: 'bullmq-redis' };
    } catch (e) {
      console.warn('[Queue] Failed to enqueue into BullMQ, falling back to in-memory queue:', e.message);
    }
  }

  // In-Memory async scheduling fallback
  inMemoryQueue.push(jobData);
  // Trigger async execution non-blocking
  setTimeout(() => {
    processInMemoryQueue();
  }, 10);

  return { jobId: `in-memory-${Date.now()}`, mode: 'in-memory-queue' };
};

module.exports = {
  initQueue,
  addExecutionJob,
  isRedisAvailable: () => isRedisAvailable,
};
