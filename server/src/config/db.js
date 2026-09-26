const mongoose = require('mongoose');
const env = require('./env');
const { memoryStore } = require('./memoryStore');

let isConnected = false;
let isMemoryMode = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    if (!env.MONGODB_URI || env.MONGODB_URI === 'in-memory') {
      throw new Error('Using in-memory store by configuration');
    }

    console.log('[DB] Connecting to MongoDB...');
    
    // Set a short timeout (2.5s) so local dev won't hang if MongoDB daemon is not running
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });

    isConnected = true;
    isMemoryMode = false;
    console.log('[DB] Successfully connected to MongoDB.');
  } catch (error) {
    console.warn(`[DB] MongoDB connection unavailable (${error.message}).`);
    console.log('[DB] >>> ACTIVATING IN-MEMORY DOCUMENT STORE FALLBACK <<<');
    console.log('[DB] Platform is fully functional in standalone local development mode without external database daemon.');
    isConnected = true;
    isMemoryMode = true;
  }
};

/**
 * Creates a Model that works seamlessly with either Mongoose or In-Memory Store
 */
const createModel = (modelName, schema, schemaMethods = {}) => {
  let mongooseModel = null;
  try {
    if (mongoose.models[modelName]) {
      mongooseModel = mongoose.models[modelName];
    } else {
      mongooseModel = mongoose.model(modelName, schema);
    }
  } catch (e) {
    // Model might already be registered or mongoose is in disconnected state
  }

  const memoryCol = memoryStore.getCollection(modelName);

  // Return a proxy that directs calls to either Mongoose or MemoryStore
  const ModelProxy = function (data) {
    if (!isMemoryMode && mongooseModel && mongoose.connection.readyState === 1) {
      return new mongooseModel(data);
    }
    const doc = new (require('./memoryStore').MemoryDocument)(memoryCol, data);
    Object.assign(doc, schemaMethods);
    return doc;
  };

  // Standard Query methods
  const methods = [
    'find',
    'findOne',
    'findById',
    'create',
    'findByIdAndUpdate',
    'findByIdAndDelete',
    'updateOne',
    'deleteMany',
    'countDocuments',
  ];

  methods.forEach(method => {
    ModelProxy[method] = (...args) => {
      if (!isMemoryMode && mongooseModel && mongoose.connection.readyState === 1) {
        return mongooseModel[method](...args);
      }
      return memoryCol[method](...args);
    };
  });

  ModelProxy.isMemoryMode = () => isMemoryMode;
  ModelProxy.mongooseModel = mongooseModel;
  ModelProxy.memoryCollection = memoryCol;

  return ModelProxy;
};

module.exports = {
  connectDB,
  createModel,
  isMemoryMode: () => isMemoryMode,
};
