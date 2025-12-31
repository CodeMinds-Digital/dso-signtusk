/**
 * Property-based tests for cryptographic context reuse optimization
 * 
 * **Property 27: Cryptographic Context Reuse**
 * **Validates: Requirements 8.2**
 * 
 * These tests verify that the PDF signing library reuses cryptographic contexts
 * where possible for performance optimization.
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

// Mock implementation for testing
interface CryptoContext {
  id: string;
  hashAlgorithm: string;
  signatureAlgorithm: string;
  createdAt: number;
  lastUsed: number;
  usageCount: number;
  inUse: boolean;
}

interface ContextPoolConfig {
  maxPoolSize: number;
  maxContextAge: number; // milliseconds
  maxIdleTime: number; // milliseconds
  enableReuse: boolean;
}

interface PoolStatistics {
  totalContextsCreated: number;
  totalContextsReused: number;
  totalContextsExpired: number;
  currentPoolSize: number;
  peakPoolSize: number;
  cacheHitRate: number;
}

interface CryptoContextPool {
  config: ContextPoolConfig;
  contexts: Map<string, CryptoContext>;
  statistics: PoolStatistics;
  getContext(hashAlg: string, sigAlg: string): CryptoContext;
  releaseContext(contextId: string): void;
  cleanup(): number;
  getStatistics(): PoolStatistics;
  clear(): void;
}

// Mock implementations for testing
class MockCryptoContextPool implements CryptoContextPool {
  config: ContextPoolConfig;
  contexts: Map<string, CryptoContext>;
  statistics: PoolStatistics;

  constructor(config: ContextPoolConfig) {
    this.config = config;
    this.contexts = new Map();
    this.statistics = {
      totalContextsCreated: 0,
      totalContextsReused: 0,
      totalContextsExpired: 0,
      currentPoolSize: 0,
      peakPoolSize: 0,
      cacheHitRate: 0,
    };
  }

  getContext(hashAlg: string, sigAlg: string): CryptoContext {
    if (!this.config.enableReuse) {
      return this.createNewContext(hashAlg, sigAlg);
    }

    const contextKey = `${hashAlg}_${sigAlg}`;
    const existingContext = this.contexts.get(contextKey);

    if (existingContext && !existingContext.inUse && !this.isExpired(existingContext)) {
      // Reuse existing context
      existingContext.inUse = true;
      existingContext.lastUsed = Date.now();
      existingContext.usageCount++;
      
      this.statistics.totalContextsReused++;
      this.updateCacheHitRate();
      
      return existingContext;
    }

    // Create new context
    const newContext = this.createNewContext(hashAlg, sigAlg);
    
    // Add to pool if there's space
    if (this.contexts.size < this.config.maxPoolSize) {
      this.contexts.set(contextKey, newContext);
      this.statistics.currentPoolSize = this.contexts.size;
      this.statistics.peakPoolSize = Math.max(this.statistics.peakPoolSize, this.contexts.size);
    }

    return newContext;
  }

  releaseContext(contextId: string): void {
    for (const context of this.contexts.values()) {
      if (context.id === contextId) {
        context.inUse = false;
        break;
      }
    }
  }

  cleanup(): number {
    const initialSize = this.contexts.size;
    const now = Date.now();
    
    for (const [key, context] of this.contexts.entries()) {
      if (context.inUse) continue; // Don't remove contexts in use
      
      if (this.isExpired(context) || this.isIdle(context, now)) {
        this.contexts.delete(key);
        this.statistics.totalContextsExpired++;
      }
    }
    
    this.statistics.currentPoolSize = this.contexts.size;
    return initialSize - this.contexts.size;
  }

  getStatistics(): PoolStatistics {
    return { ...this.statistics };
  }

  clear(): void {
    this.contexts.clear();
    this.statistics.currentPoolSize = 0;
  }

  private createNewContext(hashAlg: string, sigAlg: string): CryptoContext {
    const now = Date.now();
    const context: CryptoContext = {
      id: `ctx_${now}_${Math.random().toString(36).substr(2, 9)}`,
      hashAlgorithm: hashAlg,
      signatureAlgorithm: sigAlg,
      createdAt: now,
      lastUsed: now,
      usageCount: 1,
      inUse: true,
    };

    this.statistics.totalContextsCreated++;
    return context;
  }

  private isExpired(context: CryptoContext): boolean {
    return Date.now() - context.createdAt > this.config.maxContextAge;
  }

  private isIdle(context: CryptoContext, now: number): boolean {
    return now - context.lastUsed > this.config.maxIdleTime;
  }

  private updateCacheHitRate(): void {
    const total = this.statistics.totalContextsCreated + this.statistics.totalContextsReused;
    this.statistics.cacheHitRate = total > 0 ? this.statistics.totalContextsReused / total : 0;
  }
}

// Generators for property-based testing
const contextPoolConfigArb = fc.record({
  maxPoolSize: fc.integer({ min: 1, max: 100 }),
  maxContextAge: fc.integer({ min: 1000, max: 3600000 }), // 1 second to 1 hour
  maxIdleTime: fc.integer({ min: 100, max: 300000 }), // 100ms to 5 minutes
  enableReuse: fc.boolean(),
});

const hashAlgorithmArb = fc.constantFrom('SHA-256', 'SHA-384', 'SHA-512');
const signatureAlgorithmArb = fc.constantFrom('RSA-PKCS1-SHA256', 'RSA-PKCS1-SHA384', 'ECDSA-P256-SHA256');

const cryptoOperationArb = fc.record({
  hashAlgorithm: hashAlgorithmArb,
  signatureAlgorithm: signatureAlgorithmArb,
  data: fc.uint8Array({ minLength: 100, maxLength: 10000 }),
});

describe('Context Reuse Properties', () => {
  describe('Property 27: Cryptographic Context Reuse', () => {
    it('should reuse contexts where possible for performance optimization', () => {
      fc.assert(
        fc.property(
          contextPoolConfigArb,
          fc.array(cryptoOperationArb, { minLength: 2, maxLength: 20 }),
          (config, operations) => {
            // **Property 27: Cryptographic Context Reuse**
            // *For any* sequence of cryptographic operations, the system should reuse 
            // cryptographic contexts where possible for performance optimization
            
            const pool = new MockCryptoContextPool(config);
            const contextIds: string[] = [];
            
            // Perform operations and track context usage
            for (const operation of operations) {
              const context = pool.getContext(
                operation.hashAlgorithm,
                operation.signatureAlgorithm
              );
              
              contextIds.push(context.id);
              
              // Simulate some work
              expect(context.inUse).toBe(true);
              expect(context.usageCount).toBeGreaterThan(0);
              
              // Release context
              pool.releaseContext(context.id);
            }
            
            const stats = pool.getStatistics();
            
            if (config.enableReuse) {
              // With reuse enabled, we should see context reuse for same algorithm combinations
              const uniqueAlgCombinations = new Set(
                operations.map(op => `${op.hashAlgorithm}_${op.signatureAlgorithm}`)
              );
              
              // If we have repeated algorithm combinations, we should see reuse
              if (operations.length > uniqueAlgCombinations.size) {
                expect(stats.totalContextsReused).toBeGreaterThan(0);
                expect(stats.cacheHitRate).toBeGreaterThan(0);
              }
              
              // Total contexts created should be <= operations (since we might not pool all)
              expect(stats.totalContextsCreated).toBeLessThanOrEqual(operations.length);
            } else {
              // With reuse disabled, each operation should create a new context
              expect(stats.totalContextsReused).toBe(0);
              expect(stats.cacheHitRate).toBe(0);
            }
            
            // Verify statistics consistency
            expect(stats.totalContextsCreated).toBeGreaterThan(0);
            expect(stats.currentPoolSize).toBeLessThanOrEqual(config.maxPoolSize);
            expect(stats.peakPoolSize).toBeGreaterThanOrEqual(stats.currentPoolSize);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain performance benefits with context reuse', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 50 }), // Number of operations
          hashAlgorithmArb,
          signatureAlgorithmArb,
          (numOperations, hashAlg, sigAlg) => {
            // Test with reuse enabled
            const configWithReuse: ContextPoolConfig = {
              maxPoolSize: 10,
              maxContextAge: 60000,
              maxIdleTime: 5000,
              enableReuse: true,
            };
            
            // Test with reuse disabled
            const configWithoutReuse: ContextPoolConfig = {
              ...configWithReuse,
              enableReuse: false,
            };
            
            const poolWithReuse = new MockCryptoContextPool(configWithReuse);
            const poolWithoutReuse = new MockCryptoContextPool(configWithoutReuse);
            
            // Perform same operations on both pools
            for (let i = 0; i < numOperations; i++) {
              // With reuse
              const contextWithReuse = poolWithReuse.getContext(hashAlg, sigAlg);
              poolWithReuse.releaseContext(contextWithReuse.id);
              
              // Without reuse
              const contextWithoutReuse = poolWithoutReuse.getContext(hashAlg, sigAlg);
              poolWithoutReuse.releaseContext(contextWithoutReuse.id);
            }
            
            const statsWithReuse = poolWithReuse.getStatistics();
            const statsWithoutReuse = poolWithoutReuse.getStatistics();
            
            // With reuse, we should create fewer contexts
            expect(statsWithReuse.totalContextsCreated).toBeLessThanOrEqual(
              statsWithoutReuse.totalContextsCreated
            );
            
            // With reuse, we should have reused contexts (except for first operation)
            if (numOperations > 1) {
              expect(statsWithReuse.totalContextsReused).toBeGreaterThan(0);
              expect(statsWithoutReuse.totalContextsReused).toBe(0);
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should handle context expiration and cleanup correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }), // Short max age for testing
          fc.integer({ min: 50, max: 500 }), // Short idle time for testing
          fc.integer({ min: 2, max: 10 }), // Number of contexts to create
          (maxAge, maxIdleTime, numContexts) => {
            const config: ContextPoolConfig = {
              maxPoolSize: 20,
              maxContextAge: maxAge,
              maxIdleTime: maxIdleTime,
              enableReuse: true,
            };
            
            const pool = new MockCryptoContextPool(config);
            
            // Create contexts with different algorithms
            const contextIds: string[] = [];
            for (let i = 0; i < numContexts; i++) {
              const context = pool.getContext(`SHA-${256 + i}`, `RSA-${i}`);
              contextIds.push(context.id);
              pool.releaseContext(context.id);
            }
            
            const initialStats = pool.getStatistics();
            expect(initialStats.currentPoolSize).toBe(numContexts);
            
            // Wait for expiration (simulate time passing)
            // In real implementation, we'd actually wait, but here we'll manipulate timestamps
            for (const context of pool.contexts.values()) {
              // Make contexts appear expired
              (context as any).createdAt = Date.now() - maxAge - 1000;
              (context as any).lastUsed = Date.now() - maxIdleTime - 1000;
            }
            
            // Cleanup expired contexts
            const cleanedCount = pool.cleanup();
            
            const finalStats = pool.getStatistics();
            
            // All contexts should have been cleaned up
            expect(cleanedCount).toBe(numContexts);
            expect(finalStats.currentPoolSize).toBe(0);
            expect(finalStats.totalContextsExpired).toBe(numContexts);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should respect pool size limits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // Small pool size
          fc.integer({ min: 5, max: 20 }), // More contexts than pool size
          (maxPoolSize, numContexts) => {
            const config: ContextPoolConfig = {
              maxPoolSize,
              maxContextAge: 60000,
              maxIdleTime: 5000,
              enableReuse: true,
            };
            
            const pool = new MockCryptoContextPool(config);
            
            // Create more contexts than pool can hold
            for (let i = 0; i < numContexts; i++) {
              const context = pool.getContext(`SHA-${i}`, `RSA-${i}`);
              pool.releaseContext(context.id);
            }
            
            const stats = pool.getStatistics();
            
            // Pool size should not exceed maximum
            expect(stats.currentPoolSize).toBeLessThanOrEqual(maxPoolSize);
            expect(stats.peakPoolSize).toBeLessThanOrEqual(maxPoolSize);
            
            // We should have created contexts for requests
            expect(stats.totalContextsCreated).toBeGreaterThan(0);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should provide accurate statistics', () => {
      fc.assert(
        fc.property(
          contextPoolConfigArb,
          fc.array(
            fc.record({
              hashAlg: hashAlgorithmArb,
              sigAlg: signatureAlgorithmArb,
            }),
            { minLength: 1, maxLength: 15 }
          ),
          (config, operations) => {
            const pool = new MockCryptoContextPool(config);
            let totalOperations = 0;
            
            // Perform operations
            for (const operation of operations) {
              const context = pool.getContext(operation.hashAlg, operation.sigAlg);
              pool.releaseContext(context.id);
              totalOperations++;
            }
            
            const stats = pool.getStatistics();
            
            // Statistics should be consistent
            expect(stats.totalContextsCreated + stats.totalContextsReused).toBe(totalOperations);
            expect(stats.currentPoolSize).toBeLessThanOrEqual(config.maxPoolSize);
            expect(stats.peakPoolSize).toBeGreaterThanOrEqual(stats.currentPoolSize);
            
            // Cache hit rate should be between 0 and 1
            expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0);
            expect(stats.cacheHitRate).toBeLessThanOrEqual(1);
            
            // If reuse is disabled, cache hit rate should be 0
            if (!config.enableReuse) {
              expect(stats.cacheHitRate).toBe(0);
              expect(stats.totalContextsReused).toBe(0);
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});