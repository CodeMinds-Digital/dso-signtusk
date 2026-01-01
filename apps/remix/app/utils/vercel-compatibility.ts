/**
 * Vercel Serverless Compatibility Utilities
 * 
 * These utilities help ensure code works correctly in Vercel's serverless environment
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

/**
 * Get the current directory in a way that works in both Node.js and serverless environments
 */
export function getCurrentDir(importMetaUrl?: string): string {
  if (importMetaUrl) {
    // ESM environment
    return dirname(fileURLToPath(importMetaUrl));
  }
  
  // CommonJS fallback
  return process.cwd();
}

/**
 * Safely read a file with proper error handling for serverless environments
 */
export async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.warn(`Failed to read file: ${filePath}`, error);
    return null;
  }
}

/**
 * Safely write a file with proper error handling for serverless environments
 */
export async function safeWriteFile(filePath: string, content: string): Promise<boolean> {
  try {
    // Ensure directory exists
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.warn(`Failed to write file: ${filePath}`, error);
    return false;
  }
}

/**
 * Check if a file exists in a serverless-compatible way
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment-specific paths that work in Vercel
 */
export function getVercelPaths() {
  const isVercel = process.env.VERCEL === '1';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isVercel,
    isProduction,
    tempDir: isVercel ? '/tmp' : './tmp',
    uploadsDir: isVercel ? '/tmp/uploads' : './uploads',
    cacheDir: isVercel ? '/tmp/cache' : './cache'
  };
}

/**
 * Execute a function with timeout for serverless environments
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 25000 // Vercel has 30s timeout, leave some buffer
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Memory-efficient file processing for large files in serverless environments
 */
export async function processFileInChunks(
  filePath: string,
  processor: (chunk: string) => Promise<void>,
  chunkSize: number = 1024 * 1024 // 1MB chunks
): Promise<void> {
  const fileHandle = await fs.open(filePath, 'r');
  
  try {
    let position = 0;
    const buffer = Buffer.alloc(chunkSize);
    
    while (true) {
      const { bytesRead } = await fileHandle.read(buffer, 0, chunkSize, position);
      
      if (bytesRead === 0) break;
      
      const chunk = buffer.subarray(0, bytesRead).toString('utf8');
      await processor(chunk);
      
      position += bytesRead;
    }
  } finally {
    await fileHandle.close();
  }
}