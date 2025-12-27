// Vercel serverless function entry point for Remix
const { createRequestHandler } = require('@react-router/node');

let build;
try {
  build = require('../build/server/index.js');
} catch (error) {
  console.error('Failed to load server build:', error);
  throw new Error('Server build not found. Make sure the build completed successfully.');
}

const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV || 'production',
});

module.exports = handler;