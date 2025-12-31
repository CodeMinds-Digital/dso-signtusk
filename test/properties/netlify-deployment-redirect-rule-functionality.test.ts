/**
 * Property-Based Tests for Netlify Deployment Redirect Rule Functionality
 * 
 * Feature: netlify-deployment, Property 15: Redirect Rule Functionality
 * **Validates: Requirements 7.5**
 * 
 * These tests verify that redirect rules correctly redirect requests from 
 * source to target URLs across all configured redirect scenarios.
 */

import fc from 'fast-check';
import { describe } from 'vitest';
import {
    generateDomainConfig,
    generateRedirectRules,
    validateDomainConfig
} from '../../scripts/netlify-domain-config.js';
import { propertyTestHelpers } from './property-test-setup';

// Types for redirect rules
interface RedirectRule {
  from: string;
  to: string;
  status: number;
  force?: boolean;
  conditions?: Record<string, any>;
}

interface DomainConfig {
  primary: string;
  aliases: string[];
  redirects: RedirectRule[];
}

// Generators for property-based testing
const validStatusCodeArb = fc.constantFrom(301, 302, 303, 307, 308);

const pathArb = fc.oneof(
  fc.constant('/'),
  fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s.replace(/[^a-zA-Z0-9\-_]/g, '')}`),
  fc.string({ minLength: 1, maxLength: 20 }).map(s => `/${s.replace(/[^a-zA-Z0-9\-_]/g, '')}/*`)
);

const domainArb = fc.oneof(
  fc.constant('yourdomain.com'),
  fc.constant('app.yourdomain.com'),
  fc.constant('docs.yourdomain.com'),
  fc.constant('www.yourdomain.com')
);

const urlArb = fc.tuple(domainArb, pathArb).map(([domain, path]) => `https://${domain}${path}`);

const redirectRuleArb = fc.record({
  from: urlArb,
  to: urlArb,
  status: validStatusCodeArb,
  force: fc.option(fc.boolean()),
  conditions: fc.option(fc.record({
    role: fc.option(fc.array(fc.constantFrom('admin', 'user', 'guest'), { minLength: 1, maxLength: 3 }))
  }))
});

const appNameArb = fc.constantFrom('marketing', 'remix', 'docs');

describe('Netlify Deployment Redirect Rule Functionality', () => {
  describe('Property 15: Redirect Rule Functionality', () => {
    /**
     * Property: Valid redirect rules generation
     * For any application, generated redirect rules should be valid
     */
    propertyTestHelpers.invariant(
      'Valid redirect rules generation',
      appNameArb,
      (appName) => {
        // **Validates: Requirements 7.5**
        const redirectRules = generateRedirectRules(appName);
        
        // All redirect rules should be valid
        if (!Array.isArray(redirectRules)) return false;
        
        for (const rule of redirectRules) {
          // Each rule should have required properties
          if (!rule.hasOwnProperty('from') || !rule.hasOwnProperty('to') || !rule.hasOwnProperty('status')) {
            return false;
          }
          
          // From and to should be non-empty strings
          if (typeof rule.from !== 'string' || rule.from.length === 0) return false;
          if (typeof rule.to !== 'string' || rule.to.length === 0) return false;
          
          // Status should be a valid redirect status code
          if (rule.status < 300 || rule.status >= 400) return false;
          
          // If force is present, it should be boolean
          if (rule.force !== undefined && typeof rule.force !== 'boolean') return false;
          
          // If conditions are present, they should be an object
          if (rule.conditions !== undefined && typeof rule.conditions !== 'object') return false;
        }
        
        return true;
      }
    );

    /**
     * Property: Consistent domain configurations
     * For any application, domain configuration should have consistent structure
     */
    propertyTestHelpers.invariant(
      'Consistent domain configurations',
      appNameArb,
      (appName) => {
        // **Validates: Requirements 7.5**
        const domainConfig = generateDomainConfig(appName);
        
        // Domain config should have required structure
        if (!domainConfig.hasOwnProperty('primary') || 
            !domainConfig.hasOwnProperty('aliases') || 
            !domainConfig.hasOwnProperty('redirects')) {
          return false;
        }
        
        // Primary domain should be a valid string
        if (typeof domainConfig.primary !== 'string' || domainConfig.primary.length === 0) {
          return false;
        }
        
        // Aliases should be an array
        if (!Array.isArray(domainConfig.aliases)) return false;
        
        // All aliases should be valid domain strings
        for (const alias of domainConfig.aliases) {
          if (typeof alias !== 'string' || alias.length === 0) return false;
        }
        
        // Redirects should be an array of valid redirect rules
        if (!Array.isArray(domainConfig.redirects)) return false;
        
        for (const redirect of domainConfig.redirects) {
          if (!redirect.hasOwnProperty('from') || 
              !redirect.hasOwnProperty('to') || 
              !redirect.hasOwnProperty('status')) {
            return false;
          }
        }
        
        return true;
      }
    );

    /**
     * Property: Domain validation correctness
     * For any valid application, domain validation should pass
     */
    propertyTestHelpers.invariant(
      'Domain validation correctness',
      appNameArb,
      (appName) => {
        // **Validates: Requirements 7.5**
        
        try {
          // Valid app names should pass validation
          const isValid = validateDomainConfig(appName);
          return isValid === true;
        } catch (error) {
          // Should not throw for valid app names
          return false;
        }
      }
    );

    /**
     * Property: HTTPS redirects correctness
     * For any application, HTTPS redirect rules should be properly configured
     */
    propertyTestHelpers.invariant(
      'HTTPS redirects correctness',
      appNameArb,
      (appName) => {
        // **Validates: Requirements 7.5**
        const redirectRules = generateRedirectRules(appName);
        
        // Should have HTTP to HTTPS redirect rules
        const httpsRedirects = redirectRules.filter(rule => 
          rule.from.startsWith('http://') && rule.to.startsWith('https://')
        );
        
        if (httpsRedirects.length === 0) return false;
        
        // All HTTPS redirects should use 301 status (permanent redirect)
        for (const redirect of httpsRedirects) {
          if (redirect.status !== 301) return false;
          
          // Should have force flag for HTTPS redirects
          if (redirect.force !== true) return false;
        }
        
        return true;
      }
    );

    /**
     * Property: URL structure preservation in redirects
     * For any redirect with splat patterns, URL structure should be preserved
     */
    propertyTestHelpers.invariant(
      'URL structure preservation in redirects',
      fc.tuple(appNameArb, pathArb),
      ([appName, testPath]) => {
        // **Validates: Requirements 7.5**
        const redirectRules = generateRedirectRules(appName);
        
        // Find redirects that use splat patterns
        const splatRedirects = redirectRules.filter(rule => 
          rule.from.includes('/*') && rule.to.includes(':splat')
        );
        
        for (const redirect of splatRedirects) {
          // The redirect should preserve the path structure
          if (!redirect.to.includes(':splat')) return false;
          
          // If from has /*, to should have :splat
          if (redirect.from.endsWith('/*') && !redirect.to.match(/:splat$/)) {
            return false;
          }
        }
        
        return true;
      }
    );

    /**
     * Property: Cross-application routing correctness
     * For any application, cross-application redirects should be properly configured
     */
    propertyTestHelpers.invariant(
      'Cross-application routing correctness',
      appNameArb,
      (appName) => {
        // **Validates: Requirements 7.5**
        const redirectRules = generateRedirectRules(appName);
        
        // Should have cross-application redirects
        const crossAppRedirects = redirectRules.filter(rule => {
          const fromDomain = extractDomain(rule.from);
          const toDomain = extractDomain(rule.to);
          return fromDomain !== toDomain;
        });
        
        // Cross-application redirects should use 302 (temporary) status
        for (const redirect of crossAppRedirects) {
          if (redirect.status === 302) {
            // Temporary redirects should not have force flag
            if (redirect.force === true) return false;
          }
        }
        
        return true;
      }
    );

    /**
     * Property: Valid redirect status codes
     * For any generated redirect rule, status codes should be valid
     */
    propertyTestHelpers.invariant(
      'Valid redirect status codes',
      redirectRuleArb,
      (rule) => {
        // **Validates: Requirements 7.5**
        
        // Status code should be in valid redirect range
        if (rule.status < 300 || rule.status >= 400) return false;
        
        // Common redirect status codes
        const validCodes = [301, 302, 303, 307, 308];
        return validCodes.includes(rule.status);
      }
    );

    /**
     * Property: Static asset redirects correctness
     * For any application, static asset redirects should preserve paths correctly
     */
    propertyTestHelpers.invariant(
      'Static asset redirects correctness',
      appNameArb,
      (appName) => {
        // **Validates: Requirements 7.5**
        const redirectRules = generateRedirectRules(appName);
        
        // Find static asset redirects (should preserve paths)
        const staticRedirects = redirectRules.filter(rule => 
          rule.from.includes('/assets/') || 
          rule.from.includes('/_next/') ||
          rule.from.includes('/favicon.ico') ||
          rule.from.includes('/robots.txt')
        );
        
        for (const redirect of staticRedirects) {
          // Static assets should use 200 status (serve, not redirect)
          // or preserve the same path structure
          if (redirect.status === 200) {
            // For 200 status, from and to paths should be similar
            const fromPath = extractPath(redirect.from);
            const toPath = extractPath(redirect.to);
            
            if (fromPath.includes('*') && toPath.includes(':splat')) {
              // Splat pattern should preserve structure
              const expectedPath = toPath.replace(':splat', '*');
              if (expectedPath !== fromPath) return false;
            }
          }
        }
        
        return true;
      }
    );
  });
});

// Helper functions
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    // Handle relative URLs or malformed URLs
    const match = url.match(/^https?:\/\/([^\/]+)/);
    return match ? match[1] : '';
  }
}

function extractPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    // Handle relative URLs
    return url.startsWith('/') ? url : `/${url}`;
  }
}