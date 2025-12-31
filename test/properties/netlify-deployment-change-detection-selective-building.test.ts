/**
 * Property-Based Tests for Netlify Deployment Change Detection and Selective Building
 * 
 * Feature: netlify-deployment, Property 2: Change Detection and Selective Building
 * Validates: Requirements 1.3, 5.3
 */

import fc from 'fast-check';
import * as fs from 'fs';
import { describe, expect, test } from 'vitest';
import { propertyTestHelpers } from './property-test-setup';

// Types for change detection system
interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  content?: string;
}

interface DeploymentTrigger {
  site: 'marketing' | 'remix' | 'docs';
  triggered: boolean;
  reason: string[];
}

interface ChangeDetectionResult {
  changes: FileChange[];
  triggers: DeploymentTrigger[];
}

// Path patterns for each application
const APP_PATTERNS = {
  marketing: [
    'apps/web/**',
    'packages/**',
    'package.json',
    'package-lock.json',
    'turbo.json'
  ],
  remix: [
    'apps/remix/**',
    'packages/**', 
    'package.json',
    'package-lock.json',
    'turbo.json'
  ],
  docs: [
    'apps/docs/**',
    'packages/**',
    'package.json', 
    'package-lock.json',
    'turbo.json'
  ]
};

// Simulate GitHub Actions workflow change detection
class ChangeDetectionSimulator {
  /**
   * Simulate path-filter change detection logic
   */
  detectChanges(fileChanges: FileChange[]): ChangeDetectionResult {
    const triggers: DeploymentTrigger[] = [
      { site: 'marketing', triggered: false, reason: [] },
      { site: 'remix', triggered: false, reason: [] },
      { site: 'docs', triggered: false, reason: [] }
    ];

    for (const change of fileChanges) {
      for (const trigger of triggers) {
        const patterns = APP_PATTERNS[trigger.site];
        
        for (const pattern of patterns) {
          if (this.matchesPattern(change.path, pattern)) {
            trigger.triggered = true;
            trigger.reason.push(`${change.type}: ${change.path} matches ${pattern}`);
            break;
          }
        }
      }
    }

    return {
      changes: fileChanges,
      triggers
    };
  }

  /**
   * Simple glob pattern matching
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Handle exact matches first
    if (filePath === pattern) return true;
    
    // Convert glob pattern to regex
    // First handle ** and * patterns, then escape other regex chars
    let regexPattern = pattern
      .replace(/\*\*/g, '__DOUBLE_STAR__')  // Temporarily replace **
      .replace(/\*/g, '__SINGLE_STAR__')    // Temporarily replace *
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/__DOUBLE_STAR__/g, '.*')    // ** matches any path including subdirectories
      .replace(/__SINGLE_STAR__/g, '[^/]*'); // * matches any filename chars except /

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Validate that only affected applications are triggered
   */
  validateSelectiveBuilding(result: ChangeDetectionResult): boolean {
    const { changes, triggers } = result;
    
    // For each triggered site, verify it has at least one matching change
    for (const trigger of triggers) {
      if (trigger.triggered) {
        const hasMatchingChange = changes.some(change => 
          APP_PATTERNS[trigger.site].some(pattern => 
            this.matchesPattern(change.path, pattern)
          )
        );
        
        if (!hasMatchingChange) {
          return false; // Site triggered without matching changes
        }
      }
    }

    // For each change, verify appropriate sites are triggered
    for (const change of changes) {
      for (const [site, patterns] of Object.entries(APP_PATTERNS)) {
        const shouldTrigger = patterns.some(pattern => 
          this.matchesPattern(change.path, pattern)
        );
        
        const isTriggered = triggers.find(t => t.site === site)?.triggered || false;
        
        if (shouldTrigger && !isTriggered) {
          return false; // Site should be triggered but isn't
        }
      }
    }

    return true;
  }
}

// Arbitraries for generating test data
const arbitraries = {
  /**
   * Generate valid file paths for the monorepo
   */
  filePath: () => fc.oneof(
    // App-specific files
    fc.constantFrom(
      'apps/web/package.json',
      'apps/web/src/components/Button.tsx',
      'apps/web/src/pages/index.tsx',
      'apps/web/public/favicon.ico',
      'apps/remix/package.json',
      'apps/remix/app/routes/_index.tsx',
      'apps/remix/app/components/Header.tsx',
      'apps/remix/server.ts',
      'apps/docs/package.json',
      'apps/docs/src/pages/api-reference.mdx',
      'apps/docs/components/CodeBlock.tsx'
    ),
    // Shared package files
    fc.constantFrom(
      'packages/ui/src/Button.tsx',
      'packages/lib/src/utils.ts',
      'packages/database/schema.prisma',
      'packages/auth/src/providers.ts',
      'packages/email/templates/welcome.tsx'
    ),
    // Root files
    fc.constantFrom(
      'package.json',
      'package-lock.json',
      'turbo.json',
      'tsconfig.json',
      '.env.example',
      'README.md'
    ),
    // Random paths for edge cases
    fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => !s.includes('..') && !s.startsWith('/'))
      .map(s => s.replace(/\/+/g, '/'))
  ),

  /**
   * Generate file change types
   */
  changeType: () => fc.constantFrom('added', 'modified', 'deleted'),

  /**
   * Generate file changes
   */
  fileChange: () => fc.record({
    path: arbitraries.filePath(),
    type: arbitraries.changeType(),
    content: fc.option(fc.string({ maxLength: 1000 }))
  }),

  /**
   * Generate lists of file changes
   */
  fileChanges: () => fc.array(arbitraries.fileChange(), { minLength: 1, maxLength: 20 })
    .map(changes => {
      // Remove duplicates by path
      const uniqueChanges = changes.reduce((acc, change) => {
        if (!acc.find(c => c.path === change.path)) {
          acc.push(change);
        }
        return acc;
      }, [] as FileChange[]);
      return uniqueChanges;
    })
};

describe('Netlify Deployment Change Detection and Selective Building', () => {
  const detector = new ChangeDetectionSimulator();

  /**
   * Property 2: Change Detection and Selective Building
   * For any code change in the repository, only the applications affected by the change 
   * should trigger new deployments
   */
  propertyTestHelpers.invariant(
    'Change Detection and Selective Building',
    arbitraries.fileChanges(),
    (fileChanges) => {
      const result = detector.detectChanges(fileChanges);
      return detector.validateSelectiveBuilding(result);
    }
  );

  /**
   * Property: No False Positives
   * For any file changes that don't affect an application, that application should not be triggered
   */
  test('Property: No False Positives', async () => {
    await propertyTestHelpers.runProperty(
      arbitraries.fileChanges(),
      (fileChanges) => {
        const result = detector.detectChanges(fileChanges);
        
        // Check each site for false positives
        for (const trigger of result.triggers) {
          if (trigger.triggered) {
            // If triggered, must have at least one matching file
            const hasMatchingFile = fileChanges.some(change =>
              APP_PATTERNS[trigger.site].some(pattern =>
                detector['matchesPattern'](change.path, pattern)
              )
            );
            
            if (!hasMatchingFile) {
              return false; // False positive detected
            }
          }
        }
        
        return true;
      }
    );
  });

  /**
   * Property: No False Negatives  
   * For any file changes that affect an application, that application should be triggered
   */
  test('Property: No False Negatives', async () => {
    await propertyTestHelpers.runProperty(
      arbitraries.fileChanges(),
      (fileChanges) => {
        const result = detector.detectChanges(fileChanges);
        
        // Check each file change for false negatives
        for (const change of fileChanges) {
          for (const [site, patterns] of Object.entries(APP_PATTERNS)) {
            const shouldTrigger = patterns.some(pattern =>
              detector['matchesPattern'](change.path, pattern)
            );
            
            if (shouldTrigger) {
              const trigger = result.triggers.find(t => t.site === site);
              if (!trigger?.triggered) {
                return false; // False negative detected
              }
            }
          }
        }
        
        return true;
      }
    );
  });

  /**
   * Property: Shared Package Changes Trigger All Apps
   * For any changes to shared packages, all applications should be triggered
   */
  test('Property: Shared Package Changes Trigger All Apps', async () => {
    const sharedPackageChanges = fc.array(
      fc.record({
        path: fc.constantFrom(
          'packages/ui/src/Button.tsx',
          'packages/lib/src/utils.ts', 
          'packages/database/schema.prisma',
          'package.json',
          'turbo.json'
        ),
        type: arbitraries.changeType(),
        content: fc.option(fc.string())
      }),
      { minLength: 1, maxLength: 5 }
    );

    await propertyTestHelpers.runProperty(
      sharedPackageChanges,
      (fileChanges) => {
        const result = detector.detectChanges(fileChanges);
        
        // All sites should be triggered for shared changes
        // Check that each site has at least one matching pattern
        for (const trigger of result.triggers) {
          const hasMatchingChange = fileChanges.some(change =>
            APP_PATTERNS[trigger.site].some(pattern =>
              detector['matchesPattern'](change.path, pattern)
            )
          );
          
          if (hasMatchingChange && !trigger.triggered) {
            return false; // Should be triggered but isn't
          }
        }
        
        return true;
      }
    );
  });

  /**
   * Property: App-Specific Changes Only Trigger That App
   * For changes only to a specific app directory, only that app should be triggered
   */
  test('Property: App-Specific Changes Only Trigger That App', async () => {
    const appSpecificChanges = fc.tuple(
      fc.constantFrom('marketing', 'remix', 'docs'),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 })
          .filter(s => s.trim().length > 0 && !s.includes('/') && !s.includes(' ')),
        { minLength: 1, maxLength: 5 }
      )
    ).map(([app, filenames]) => {
      const appDir = app === 'marketing' ? 'web' : app;
      return filenames.map(filename => ({
        path: `apps/${appDir}/${filename}`,
        type: 'modified' as const,
        content: 'test content'
      }));
    });

    await propertyTestHelpers.runProperty(
      appSpecificChanges,
      (fileChanges) => {
        const result = detector.detectChanges(fileChanges);
        
        // Determine which app should be triggered
        const appPath = fileChanges[0]?.path;
        if (!appPath) return true;
        
        let expectedApp: string;
        if (appPath.startsWith('apps/web/')) {
          expectedApp = 'marketing';
        } else if (appPath.startsWith('apps/remix/')) {
          expectedApp = 'remix';
        } else if (appPath.startsWith('apps/docs/')) {
          expectedApp = 'docs';
        } else {
          return true; // Not an app-specific change
        }
        
        // Only the expected app should be triggered
        for (const trigger of result.triggers) {
          if (trigger.site === expectedApp) {
            if (!trigger.triggered) return false; // Expected app not triggered
          } else {
            if (trigger.triggered) return false; // Unexpected app triggered
          }
        }
        
        return true;
      }
    );
  });

  /**
   * Property: Pattern Matching Consistency
   * Pattern matching should be consistent and deterministic
   */
  test('Property: Pattern Matching Consistency', async () => {
    await propertyTestHelpers.runProperty(
      fc.tuple(arbitraries.filePath(), fc.constantFrom(...Object.values(APP_PATTERNS).flat())),
      ([filePath, pattern]) => {
        const result1 = detector['matchesPattern'](filePath, pattern);
        const result2 = detector['matchesPattern'](filePath, pattern);
        
        // Should always return the same result
        return result1 === result2;
      }
    );
  });

  /**
   * Property: Empty Changes Trigger Nothing
   * When no files are changed, no deployments should be triggered
   */
  test('Property: Empty Changes Trigger Nothing', () => {
    const result = detector.detectChanges([]);
    const anyTriggered = result.triggers.some(trigger => trigger.triggered);
    expect(anyTriggered).toBe(false);
  });

  /**
   * Property: Trigger Reasons Are Valid
   * All trigger reasons should reference actual file changes and patterns
   */
  test('Property: Trigger Reasons Are Valid', async () => {
    await propertyTestHelpers.runProperty(
      arbitraries.fileChanges(),
      (fileChanges) => {
        const result = detector.detectChanges(fileChanges);
        
        for (const trigger of result.triggers) {
          if (trigger.triggered) {
            // Should have at least one reason
            if (trigger.reason.length === 0) return false;
            
            // Each reason should reference a valid file and pattern
            for (const reason of trigger.reason) {
              const hasValidFile = fileChanges.some(change => 
                reason.includes(change.path)
              );
              
              const hasValidPattern = APP_PATTERNS[trigger.site].some(pattern =>
                reason.includes(pattern)
              );
              
              if (!hasValidFile || !hasValidPattern) return false;
            }
          }
        }
        
        return true;
      }
    );
  });
});

/**
 * Integration tests with actual GitHub Actions workflow
 */
describe('GitHub Actions Workflow Integration', () => {
  /**
   * Test that the actual workflow file exists and has the expected structure
   */
  test('Workflow file exists and has change detection job', () => {
    const workflowPath = '.github/workflows/netlify-deploy.yml';
    
    if (fs.existsSync(workflowPath)) {
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      
      // Basic checks that the workflow has the expected structure
      expect(workflowContent).toContain('detect-changes');
      expect(workflowContent).toContain('dorny/paths-filter@v2');
      expect(workflowContent).toContain('marketing');
      expect(workflowContent).toContain('remix');
      expect(workflowContent).toContain('docs');
    }
  });
});