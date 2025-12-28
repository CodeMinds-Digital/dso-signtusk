const { RuntimeErrorHandler } = require('./netlify-runtime-error-handler');

/**
 * Template for Netlify Functions with comprehensive error handling
 * 
 * This template provides a standardized way to create Netlify Functions
 * with built-in error handling, timeout management, and monitoring.
 */

// Initialize runtime error handler
const errorHandler = new RuntimeErrorHandler({
  functionTimeout: 30000, // 30 seconds
  dbConnectionTimeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000
});

/**
 * Example API function with error handling
 */
exports.handler = errorHandler.wrapNetlifyFunction(
  async (event, context) => {
    const { httpMethod, path, queryStringParameters, body } = event;
    
    // Handle different HTTP methods
    switch (httpMethod) {
      case 'GET':
        return await handleGet(queryStringParameters);
      case 'POST':
        return await handlePost(JSON.parse(body || '{}'));
      case 'PUT':
        return await handlePut(JSON.parse(body || '{}'));
      case 'DELETE':
        return await handleDelete(queryStringParameters);
      default:
        throw new Error(`Unsupported HTTP method: ${httpMethod}`);
    }
  },
  {
    timeout: 25000, // 25 seconds (less than Netlify's 30s limit)
    requiredEnvVars: [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV'
    ],
    enableRetry: true
  }
);

/**
 * Handle GET requests
 */
async function handleGet(params) {
  // Connect to database with error recovery
  const db = await errorHandler.connectWithRecovery({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
  });
  
  // Your GET logic here
  return {
    message: 'GET request handled successfully',
    params
  };
}

/**
 * Handle POST requests
 */
async function handlePost(data) {
  // Validate input data
  if (!data || Object.keys(data).length === 0) {
    throw new Error('Request body is required');
  }
  
  // Connect to database with error recovery
  const db = await errorHandler.connectWithRecovery({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
  });
  
  // Your POST logic here
  return {
    message: 'POST request handled successfully',
    data
  };
}

/**
 * Handle PUT requests
 */
async function handlePut(data) {
  // Connect to database with error recovery
  const db = await errorHandler.connectWithRecovery({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
  });
  
  // Your PUT logic here
  return {
    message: 'PUT request handled successfully',
    data
  };
}

/**
 * Handle DELETE requests
 */
async function handleDelete(params) {
  // Connect to database with error recovery
  const db = await errorHandler.connectWithRecovery({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
  });
  
  // Your DELETE logic here
  return {
    message: 'DELETE request handled successfully',
    params
  };
}