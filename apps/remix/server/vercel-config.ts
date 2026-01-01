/**
 * Vercel Server Configuration
 * 
 * This configuration ensures the server works correctly in Vercel's serverless environment
 */

import type { ServerBuild } from '@react-router/node';

// Vercel-specific environment detection
export const isVercelEnvironment = process.env.VERCEL === '1';
export const isProduction = process.env.NODE_ENV === 'production';

// Vercel-compatible paths
export const vercelPaths = {
  tempDir: isVercelEnvironment ? '/tmp' : './tmp',
  uploadsDir: isVercelEnvironment ? '/tmp/uploads' : './uploads',
  cacheDir: isVercelEnvironment ? '/tmp/cache' : './cache',
  staticDir: isVercelEnvironment ? '/var/task/build/client' : './build/client'
};

// Vercel-specific server options
export const vercelServerOptions = {
  // Disable clustering in serverless environment
  cluster: !isVercelEnvironment,
  
  // Adjust timeouts for serverless
  timeout: isVercelEnvironment ? 25000 : 30000,
  
  // Memory limits
  maxMemory: isVercelEnvironment ? '1024mb' : '2048mb',
  
  // File upload limits
  maxFileSize: isVercelEnvironment ? '50mb' : '100mb'
};

/**
 * Initialize server with Vercel-specific configuration
 */
export function initializeVercelServer(build: ServerBuild) {
  // Ensure temp directories exist
  if (isVercelEnvironment) {
    const fs = require('fs');
    Object.values(vercelPaths).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  return {
    build,
    paths: vercelPaths,
    options: vercelServerOptions
  };
}