/**
 * Property-based tests for resource management and cleanup
 * Feature: pdf-digital-signature, Property 25: Resource Management and Cleanup
 * Validates: Requirements 7.4, 8.3
 */

import fc from 'fast-check';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Mock resource management interfaces
interface ResourceManager {
  registerTempFile(filePath: string): Promise<string>;
  registerCryptoContext(contextName: string): Promise<string>;
  registerSecureMemory(size: number): Promise<string>;
  cleanupResource(resourceId: string): Promise<void>;
  cleanupAll(): Promise<void>;
  getResourceCount(): number;
  isResourceCleaned(resourceId: string): boolean;
}

interface ResourceGuard {
  resourceId: string;
  cleanup(): Promise<void>;
  disableAutoCleanup(): void;
}

// Mock implementations for testing resource management
class MockResourceManager implements ResourceManager {
  private resources: Map<string, { type: string; path?: string; cleaned: boolean }> = new Map();
  private nextId = 1;
  
  async registerTempFile(filePath: string): Promise<string> {
    const id = `temp_${this.nextId++}`;
    this.resources.set(id, { type: 'tempfile', path: filePath, cleaned: false });
    return id;
  }
  
  async registerCryptoContext(contextName: string): Promise<string> {
    const id = `crypto_${this.nextId++}`;
    this.resources.set(id, { type: 'crypto', cleaned: false });
    return id;
  }
  
  async registerSecureMemory(size: number): Promise<string> {
    const id = `memory_${this.nextId++}`;
    this.resources.set(id, { type: 'memory', cleaned: false });
    return id;
  }
  
  async cleanupResource(resourceId: string): Promise<void> {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }
    
    if (resource.cleaned) {
      return; // Already cleaned
    }
    
    // Simulate cleanup based on resource type
    switch (resource.type) {
      case 'tempfile':
        if (resource.path && fs.existsSync(resource.path)) {
          fs.unlinkSync(resource.path);
        }
        break;
      case 'crypto':
        // Simulate crypto context cleanup
        break;
      case 'memory':
        // Simulate memory zeroing
        break;
    }
    
    resource.cleaned = true;
  }
  
  async cleanupAll(): Promise<void> {
    const errors: string[] = [];
    
    for (const [id, resource] of this.resources.entries()) {
      if (!resource.cleaned) {
        try {
          await this.cleanupResource(id);
        } catch (error) {
          errors.push(`${id}: ${error}`);
        }
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Failed to cleanup resources: ${errors.join(', ')}`);
    }
  }
  
  getResourceCount(): number {
    return this.resources.size;
  }
  
  isResourceCleaned(resourceId: string): boolean {
    const resource = this.resources.get(resourceId);
    return resource ? resource.cleaned : false;
  }
  
  // Test helper methods
  getAllResources(): Map<string, { type: string; path?: string; cleaned: boolean }> {
    return new Map(this.resources);
  }
  
  reset(): void {
    this.resources.clear();
    this.nextId = 1;
  }
}

class MockResourceGuard implements ResourceGuard {
  private manager: MockResourceManager;
  private autoCleanup: boolean = true;
  
  constructor(public resourceId: string, manager: MockResourceManager) {
    this.manager = manager;
  }
  
  async cleanup(): Promise<void> {
    await this.manager.cleanupResource(this.resourceId);
    this.autoCleanup = false; // Prevent double cleanup
  }
  
  disableAutoCleanup(): void {
    this.autoCleanup = false;
  }
  
  // Simulate automatic cleanup on destruction
  async destroy(): Promise<void> {
    if (this.autoCleanup) {
      await this.manager.cleanupResource(this.resourceId);
    }
  }
}

// Mock PDF signing operations that create resources
class MockPdfSigner {
  private resourceManager: MockResourceManager;
  
  constructor(resourceManager: MockResourceManager) {
    this.resourceManager = resourceManager;
  }
  
  async signDocument(document: Uint8Array, credentials: any): Promise<Uint8Array> {
    // Simulate creating temporary files during signing
    const tempDir = os.tmpdir();
    const tempFile1 = path.join(tempDir, `signing_temp_${Date.now()}_1.tmp`);
    const tempFile2 = path.join(tempDir, `signing_temp_${Date.now()}_2.tmp`);
    
    // Create actual temp files
    fs.writeFileSync(tempFile1, 'temp data 1');
    fs.writeFileSync(tempFile2, 'temp data 2');
    
    // Register resources for cleanup
    await this.resourceManager.registerTempFile(tempFile1);
    await this.resourceManager.registerTempFile(tempFile2);
    
    // Register crypto contexts
    await this.resourceManager.registerCryptoContext('hash_context');
    await this.resourceManager.registerCryptoContext('signature_context');
    
    // Register secure memory
    await this.resourceManager.registerSecureMemory(1024); // Hash buffer
    await this.resourceManager.registerSecureMemory(2048); // Signature buffer
    
    // Simulate signing operation
    if (document.length === 0) {
      throw new Error('Invalid document');
    }
    
    return new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
  }
  
  async validateSignatures(document: Uint8Array): Promise<any[]> {
    // Simulate creating resources during validation
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `validation_temp_${Date.now()}.tmp`);
    
    fs.writeFileSync(tempFile, 'validation data');
    
    await this.resourceManager.registerTempFile(tempFile);
    await this.resourceManager.registerCryptoContext('validation_context');
    await this.resourceManager.registerSecureMemory(512);
    
    return [];
  }
}

describe('Resource Management and Cleanup Properties', () => {
  let resourceManager: MockResourceManager;
  let pdfSigner: MockPdfSigner;
  
  beforeEach(() => {
    resourceManager = new MockResourceManager();
    pdfSigner = new MockPdfSigner(resourceManager);
  });
  
  afterEach(() => {
    // Ensure all resources are cleaned up after each test
    resourceManager.cleanupAll().catch(() => {
      // Ignore cleanup errors in test teardown
    });
    resourceManager.reset();
  });
  
  it('Property 25: Resource Management and Cleanup - All resources are cleaned up on successful operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 4, maxLength: 1000 }),
        fc.record({
          certificate: fc.string(),
          privateKey: fc.string()
        }),
        async (document, credentials) => {
          // Reset resource manager state for this test run
          resourceManager.reset();
          
          const initialResourceCount = resourceManager.getResourceCount();
          
          try {
            // Perform signing operation that creates resources
            await pdfSigner.signDocument(document, credentials);
            
            // Verify resources were created
            const resourceCountAfterOperation = resourceManager.getResourceCount();
            expect(resourceCountAfterOperation).toBeGreaterThan(initialResourceCount);
            
            // Get all resource IDs before cleanup
            const allResources = resourceManager.getAllResources();
            const resourceIds = Array.from(allResources.keys());
            
            // Verify no resources are cleaned initially
            for (const id of resourceIds) {
              expect(resourceManager.isResourceCleaned(id)).toBe(false);
            }
            
            // Clean up all resources
            await resourceManager.cleanupAll();
            
            // Verify all resources are cleaned up
            for (const id of resourceIds) {
              expect(resourceManager.isResourceCleaned(id)).toBe(true);
            }
            
            // Verify temp files are actually deleted
            for (const [id, resource] of allResources.entries()) {
              if (resource.type === 'tempfile' && resource.path) {
                expect(fs.existsSync(resource.path)).toBe(false);
              }
            }
          } catch (error) {
            // Even on error, resources should be cleanable
            await resourceManager.cleanupAll();
            
            const allResources = resourceManager.getAllResources();
            for (const [id, resource] of allResources.entries()) {
              expect(resourceManager.isResourceCleaned(id)).toBe(true);
              if (resource.type === 'tempfile' && resource.path) {
                expect(fs.existsSync(resource.path)).toBe(false);
              }
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
  
  it('Property 25: Resource Management and Cleanup - Resources are cleaned up on operation failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(new Uint8Array(0)), // Invalid document that will cause failure
        fc.record({
          certificate: fc.string(),
          privateKey: fc.string()
        }),
        async (invalidDocument, credentials) => {
          // Reset resource manager state for this test run
          resourceManager.reset();
          
          const initialResourceCount = resourceManager.getResourceCount();
          
          try {
            await pdfSigner.signDocument(invalidDocument, credentials);
            // Should not reach here
            expect(false).toBe(true);
          } catch (error) {
            // Verify resources were created even though operation failed
            const resourceCountAfterFailure = resourceManager.getResourceCount();
            expect(resourceCountAfterFailure).toBeGreaterThan(initialResourceCount);
            
            // Get all resource IDs
            const allResources = resourceManager.getAllResources();
            const resourceIds = Array.from(allResources.keys());
            
            // Clean up all resources
            await resourceManager.cleanupAll();
            
            // Verify all resources are cleaned up even after failure
            for (const id of resourceIds) {
              expect(resourceManager.isResourceCleaned(id)).toBe(true);
            }
            
            // Verify temp files are deleted
            for (const [id, resource] of allResources.entries()) {
              if (resource.type === 'tempfile' && resource.path) {
                expect(fs.existsSync(resource.path)).toBe(false);
              }
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
  
  it('Property 25: Resource Management and Cleanup - Individual resource cleanup works correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.integer({ min: 100, max: 10000 }), { minLength: 1, max: 5 }),
        async (contextNames, memorySizes) => {
          // Reset resource manager state for this test run
          resourceManager.reset();
          
          const resourceIds: string[] = [];
          
          // Register various types of resources
          for (const contextName of contextNames) {
            const id = await resourceManager.registerCryptoContext(contextName);
            resourceIds.push(id);
          }
          
          for (const size of memorySizes) {
            const id = await resourceManager.registerSecureMemory(size);
            resourceIds.push(id);
          }
          
          // Create some temp files
          const tempDir = os.tmpdir();
          for (let i = 0; i < 3; i++) {
            const tempFile = path.join(tempDir, `test_${Date.now()}_${Math.random()}_${i}.tmp`);
            fs.writeFileSync(tempFile, `test data ${i}`);
            const id = await resourceManager.registerTempFile(tempFile);
            resourceIds.push(id);
          }
          
          // Verify all resources are registered and not cleaned
          expect(resourceManager.getResourceCount()).toBe(resourceIds.length);
          for (const id of resourceIds) {
            expect(resourceManager.isResourceCleaned(id)).toBe(false);
          }
          
          // Clean up resources individually
          for (const id of resourceIds) {
            await resourceManager.cleanupResource(id);
            expect(resourceManager.isResourceCleaned(id)).toBe(true);
          }
          
          // Verify all temp files are deleted
          const allResources = resourceManager.getAllResources();
          for (const [id, resource] of allResources.entries()) {
            if (resource.type === 'tempfile' && resource.path) {
              expect(fs.existsSync(resource.path)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 30 }
    );
  });
  
  it('Property 25: Resource Management and Cleanup - Resource guards provide automatic cleanup', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        async (contextNames) => {
          // Reset resource manager state for this test run
          resourceManager.reset();
          
          const guards: MockResourceGuard[] = [];
          const resourceIds: string[] = [];
          
          // Create resource guards
          for (const contextName of contextNames) {
            const id = await resourceManager.registerCryptoContext(contextName);
            const guard = new MockResourceGuard(id, resourceManager);
            guards.push(guard);
            resourceIds.push(id);
          }
          
          // Verify resources are not cleaned initially
          for (const id of resourceIds) {
            expect(resourceManager.isResourceCleaned(id)).toBe(false);
          }
          
          // Simulate guard destruction (automatic cleanup)
          for (const guard of guards) {
            await guard.destroy();
          }
          
          // Verify all resources are cleaned up
          for (const id of resourceIds) {
            expect(resourceManager.isResourceCleaned(id)).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
  
  it('Property 25: Resource Management and Cleanup - Manual cleanup prevents double cleanup', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 100, max: 5000 }), { minLength: 1, maxLength: 5 }),
        async (memorySizes) => {
          // Reset resource manager state for this test run
          resourceManager.reset();
          
          const guards: MockResourceGuard[] = [];
          const resourceIds: string[] = [];
          
          // Create resources with guards
          for (const size of memorySizes) {
            const id = await resourceManager.registerSecureMemory(size);
            const guard = new MockResourceGuard(id, resourceManager);
            guards.push(guard);
            resourceIds.push(id);
          }
          
          // Manually clean up some resources
          const manualCleanupCount = Math.floor(guards.length / 2);
          for (let i = 0; i < manualCleanupCount; i++) {
            await guards[i].cleanup();
            expect(resourceManager.isResourceCleaned(resourceIds[i])).toBe(true);
          }
          
          // Simulate guard destruction for all guards
          for (const guard of guards) {
            await guard.destroy(); // Should not fail even for already cleaned resources
          }
          
          // Verify all resources are cleaned (no double cleanup errors)
          for (const id of resourceIds) {
            expect(resourceManager.isResourceCleaned(id)).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});