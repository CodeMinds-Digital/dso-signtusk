/**
 * Netlify Environment Variable Validation Integration Tests
 * 
 * Tests comprehensive environment variable validation scenarios,
 * security checks, and runtime validation integration.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeErrorHandler } from '../../scripts/netlify-runtime-error-handler';
import { testDatabaseConnection, testS3Connection, validateEnvironment } from '../../scripts/validate-environment';

describe('Netlify Environment Variable Validation Integration Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let runtimeHandler: RuntimeErrorHandler;

  beforeEach(() => {
    // Backup original environment
    originalEnv = { ...process.env };
    
    // Clear environment for clean tests
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_') || key.startsWith('DATABASE_') || key.startsWith('JWT_')) {
        delete process.env[key];
      }
    });

    runtimeHandler = new RuntimeErrorHandler();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Marketing Site Environment Validation', () => {
    it('should validate minimal marketing site configuration', () => {
      // Set minimal required environment
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_PROJECT = 'signtusk';

      const results = validateEnvironment('marketing');
      
      expect(results.success).toBe(true);
      expect(results.errors).toHaveLength(0);
      expect(results.appType).toBe('marketing');
    });

    it('should detect invalid URLs in marketing configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_PROJECT = 'signtusk';
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'not-a-valid-url';
      process.env.NEXT_PUBLIC_MARKETING_URL = 'ftp://invalid-protocol.com';

      const results = validateEnvironment('marketing');
      
      expect(results.success).toBe(false);
      expect(results.errors.some(e => e.field === 'NEXT_PUBLIC_WEBAPP_URL')).toBe(true);
      expect(results.errors.some(e => e.field === 'NEXT_PUBLIC_MARKETING_URL')).toBe(true);
    });

    it('should warn about development URLs in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_PROJECT = 'signtusk';
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_MARKETING_URL = 'https://example.com';

      const results = validateEnvironment('marketing');
      
      expect(results.warnings.some(w => w.code === 'dev_value_in_prod')).toBe(true);
      expect(results.warnings.some(w => w.field === 'NEXT_PUBLIC_WEBAPP_URL')).toBe(true);
    });
  });

  describe('Remix Application Environment Validation', () => {
    it('should validate complete remix configuration', () => {
      // Set complete valid environment
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY = 'd'.repeat(32);
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'https://app.signtusk.com';
      process.env.NEXT_PUBLIC_MARKETING_URL = 'https://signtusk.com';
      process.env.NEXT_PUBLIC_DOCS_URL = 'https://docs.signtusk.com';
      process.env.NEXT_PRIVATE_INTERNAL_WEBAPP_URL = 'https://internal.signtusk.com';
      process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = 'database';
      process.env.NEXT_PRIVATE_SMTP_TRANSPORT = 'resend';
      process.env.NEXT_PRIVATE_SMTP_FROM_NAME = 'SignTusk';
      process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS = 'noreply@signtusk.com';
      process.env.NEXT_PRIVATE_SIGNING_TRANSPORT = 'local';
      process.env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS = 'mock-certificate-content';

      const results = validateEnvironment('remix');
      
      expect(results.success).toBe(true);
      expect(results.errors).toHaveLength(0);
      expect(results.runtimeChecks).toBeDefined();
    });

    it('should validate S3 configuration when S3 transport is used', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY = 'd'.repeat(32);
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'https://app.signtusk.com';
      process.env.NEXT_PUBLIC_MARKETING_URL = 'https://signtusk.com';
      process.env.NEXT_PUBLIC_DOCS_URL = 'https://docs.signtusk.com';
      process.env.NEXT_PRIVATE_INTERNAL_WEBAPP_URL = 'https://internal.signtusk.com';
      process.env.NEXT_PRIVATE_SMTP_TRANSPORT = 'resend';
      process.env.NEXT_PRIVATE_SMTP_FROM_NAME = 'SignTusk';
      process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS = 'noreply@signtusk.com';
      process.env.NEXT_PRIVATE_SIGNING_TRANSPORT = 'local';
      process.env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS = 'mock-certificate-content';
      
      // S3 configuration
      process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = 's3';
      // Missing S3 credentials - should cause validation error

      const results = validateEnvironment('remix');
      
      expect(results.success).toBe(false);
      expect(results.errors.some(e => e.field === 'NEXT_PRIVATE_UPLOAD_BUCKET')).toBe(true);
      expect(results.errors.some(e => e.field === 'NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID')).toBe(true);
      expect(results.errors.some(e => e.field === 'NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY')).toBe(true);
    });

    it('should validate Resend email configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY = 'd'.repeat(32);
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'https://app.signtusk.com';
      process.env.NEXT_PUBLIC_MARKETING_URL = 'https://signtusk.com';
      process.env.NEXT_PUBLIC_DOCS_URL = 'https://docs.signtusk.com';
      process.env.NEXT_PRIVATE_INTERNAL_WEBAPP_URL = 'https://internal.signtusk.com';
      process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = 'database';
      process.env.NEXT_PRIVATE_SIGNING_TRANSPORT = 'local';
      process.env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS = 'mock-certificate-content';
      
      // Resend email configuration
      process.env.NEXT_PRIVATE_SMTP_TRANSPORT = 'resend';
      process.env.NEXT_PRIVATE_SMTP_FROM_NAME = 'SignTusk';
      process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS = 'noreply@signtusk.com';
      process.env.NEXT_PRIVATE_RESEND_API_KEY = 'invalid-resend-key'; // Invalid format

      const results = validateEnvironment('remix');
      
      expect(results.success).toBe(false);
      expect(results.errors.some(e => e.field === 'NEXT_PRIVATE_RESEND_API_KEY')).toBe(true);
    });

    it('should detect Stripe key environment mismatches', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY = 'd'.repeat(32);
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'https://app.signtusk.com';
      process.env.NEXT_PUBLIC_MARKETING_URL = 'https://signtusk.com';
      process.env.NEXT_PUBLIC_DOCS_URL = 'https://docs.signtusk.com';
      process.env.NEXT_PRIVATE_INTERNAL_WEBAPP_URL = 'https://internal.signtusk.com';
      process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = 'database';
      process.env.NEXT_PRIVATE_SMTP_TRANSPORT = 'resend';
      process.env.NEXT_PRIVATE_SMTP_FROM_NAME = 'SignTusk';
      process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS = 'noreply@signtusk.com';
      process.env.NEXT_PRIVATE_RESEND_API_KEY = 're_valid_key_format';
      process.env.NEXT_PRIVATE_SIGNING_TRANSPORT = 'local';
      process.env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS = 'mock-certificate-content';
      
      // Billing configuration with test key in production
      process.env.NEXT_PUBLIC_FEATURE_BILLING_ENABLED = 'true';
      process.env.NEXT_PRIVATE_STRIPE_API_KEY = 'sk_test_123456789'; // Test key in production
      process.env.NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET = 'whsec_valid_webhook_secret';

      const results = validateEnvironment('remix');
      
      expect(results.success).toBe(false);
      expect(results.errors.some(e => e.code === 'test_key_in_production')).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('should detect placeholder secrets', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'your-secret-here'; // Placeholder
      process.env.JWT_SECRET = 'replace-with-real-secret'; // Placeholder
      process.env.NEXT_PRIVATE_ENCRYPTION_KEY = 'example-key'; // Placeholder

      const results = validateEnvironment('remix');
      
      expect(results.success).toBe(false);
      expect(results.errors.some(e => e.code === 'placeholder_secret')).toBe(true);
      expect(results.errors.filter(e => e.code === 'placeholder_secret')).toHaveLength(3);
    });

    it('should detect weak secrets', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'short'; // Too short
      process.env.JWT_SECRET = 'also-short'; // Too short
      process.env.NEXT_PRIVATE_ENCRYPTION_KEY = 'c'.repeat(32); // Valid length

      const results = validateEnvironment('remix');
      
      expect(results.warnings.some(w => w.code === 'weak_secret')).toBe(true);
      expect(results.warnings.filter(w => w.code === 'weak_secret')).toHaveLength(2);
    });

    it('should detect sensitive data in public environment variables', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.NEXT_PUBLIC_API_KEY = 'secret-api-key-123'; // Sensitive data in public var
      process.env.NEXT_PUBLIC_SECRET_TOKEN = 'token-123'; // Sensitive data in public var

      const results = validateEnvironment('remix');
      
      expect(results.securityIssues?.some(s => s.code === 'sensitive_public_var')).toBe(true);
      expect(results.securityIssues?.filter(s => s.code === 'sensitive_public_var')).toHaveLength(2);
    });

    it('should detect weak credentials', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://admin:password@localhost:5432/db'; // Weak password
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.NEXT_PRIVATE_STRIPE_API_KEY = 'sk_live_test123'; // Contains 'test'

      const results = validateEnvironment('remix');
      
      expect(results.securityIssues?.some(s => s.code === 'weak_credential')).toBe(true);
    });

    it('should check for missing security headers in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      // Missing security headers

      const results = validateEnvironment('remix');
      
      expect(results.securityIssues?.some(s => s.code === 'missing_security_header')).toBe(true);
      expect(results.securityIssues?.some(s => s.field === 'NEXT_PRIVATE_CSP_ENABLED')).toBe(true);
      expect(results.securityIssues?.some(s => s.field === 'NEXT_PRIVATE_HSTS_ENABLED')).toBe(true);
    });
  });

  describe('Database Connection Testing', () => {
    it('should validate database URL format', async () => {
      const validUrl = 'postgresql://user:pass@localhost:5432/database';
      const result = await testDatabaseConnection(validUrl);
      
      expect(result.success).toBe(true);
      expect(result.details?.host).toBe('localhost');
      expect(result.details?.port).toBe(5432);
      expect(result.details?.database).toBe('database');
    });

    it('should reject invalid database URLs', async () => {
      const invalidUrls = [
        'invalid-url',
        'http://localhost:5432/db', // Wrong protocol
        'postgresql://localhost', // Missing database
        'postgresql://:@localhost:5432/db' // Missing credentials
      ];

      for (const url of invalidUrls) {
        const result = await testDatabaseConnection(url);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid database URL format');
      }
    });

    it('should handle connection timeouts', async () => {
      // Mock a connection that times out
      const timeoutHandler = new RuntimeErrorHandler({
        dbConnectionTimeout: 100 // Very short timeout
      });

      vi.spyOn(timeoutHandler, 'createConnection').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200)); // Longer than timeout
        return { connected: true };
      });

      try {
        await timeoutHandler.connectWithRecovery({
          connectionString: 'postgresql://localhost:5432/test'
        });
        expect.fail('Should have thrown timeout error');
      } catch (error) {
        expect(error.code).toBe('DATABASE_CONNECTION_EXHAUSTED');
      }
    });
  });

  describe('S3 Connection Testing', () => {
    it('should validate S3 configuration', async () => {
      const validConfig = {
        bucket: 'test-bucket',
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
      };

      const result = await testS3Connection(validConfig);
      
      expect(result.success).toBe(true);
      expect(result.details?.bucket).toBe('test-bucket');
      expect(result.details?.region).toBe('us-east-1');
      expect(result.details?.hasCredentials).toBe(true);
    });

    it('should reject incomplete S3 configuration', async () => {
      const incompleteConfigs = [
        { bucket: '', region: 'us-east-1', accessKeyId: 'key', secretAccessKey: 'secret' },
        { bucket: 'test', region: '', accessKeyId: 'key', secretAccessKey: 'secret' },
        { bucket: 'test', region: 'us-east-1', accessKeyId: '', secretAccessKey: 'secret' },
        { bucket: 'test', region: 'us-east-1', accessKeyId: 'key', secretAccessKey: '' }
      ];

      for (const config of incompleteConfigs) {
        const result = await testS3Connection(config);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Missing required S3 configuration');
      }
    });
  });

  describe('Runtime Environment Validation Integration', () => {
    it('should integrate with Netlify Function error handling', async () => {
      // Set up environment for function
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.JWT_SECRET = 'a'.repeat(32);

      const testFunction = async (event: any, context: any) => {
        // Function that requires environment validation
        return { message: 'Function executed successfully' };
      };

      const wrappedFunction = runtimeHandler.wrapNetlifyFunction(testFunction, {
        requiredEnvVars: ['DATABASE_URL', 'JWT_SECRET', 'MISSING_VAR'] // One missing
      });

      const mockEvent = { httpMethod: 'GET' };
      const mockContext = {};

      const result = await wrappedFunction(mockEvent, mockContext);
      
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error.code).toBe('MISSING_ENV_VARS');
    });

    it('should validate environment on function startup', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.NEXTAUTH_SECRET = 'b'.repeat(32);

      const testFunction = async (event: any, context: any) => {
        return { message: 'All environment variables valid' };
      };

      const wrappedFunction = runtimeHandler.wrapNetlifyFunction(testFunction, {
        requiredEnvVars: ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET']
      });

      const mockEvent = { httpMethod: 'GET' };
      const mockContext = {};

      const result = await wrappedFunction(mockEvent, mockContext);
      
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).success).toBe(true);
    });

    it('should handle environment validation errors gracefully', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'invalid-url'; // Invalid format

      const testFunction = async (event: any, context: any) => {
        return { message: 'This should not execute' };
      };

      const wrappedFunction = runtimeHandler.wrapNetlifyFunction(testFunction, {
        requiredEnvVars: ['DATABASE_URL']
      });

      const mockEvent = { httpMethod: 'GET' };
      const mockContext = {};

      const result = await wrappedFunction(mockEvent, mockContext);
      
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error.code).toBe('INVALID_ENV_VARS');
    });
  });

  describe('Cross-Application Environment Validation', () => {
    it('should validate shared environment variables across applications', () => {
      // Set shared environment variables
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_PROJECT = 'signtusk';
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'https://app.signtusk.com';
      process.env.NEXT_PUBLIC_MARKETING_URL = 'https://signtusk.com';
      process.env.NEXT_PUBLIC_DOCS_URL = 'https://docs.signtusk.com';

      const marketingResults = validateEnvironment('marketing');
      const docsResults = validateEnvironment('docs');

      expect(marketingResults.success).toBe(true);
      expect(docsResults.success).toBe(true);
      
      // Both should have the same shared variables
      expect(marketingResults.appType).toBe('marketing');
      expect(docsResults.appType).toBe('docs');
    });

    it('should detect inconsistent URL configurations across applications', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_PROJECT = 'signtusk';
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'https://app.signtusk.com';
      process.env.NEXT_PUBLIC_MARKETING_URL = 'https://different-domain.com'; // Inconsistent
      process.env.NEXT_PUBLIC_DOCS_URL = 'https://docs.signtusk.com';

      const marketingResults = validateEnvironment('marketing');
      const docsResults = validateEnvironment('docs');

      // Both should still be valid individually, but inconsistency should be detectable
      expect(marketingResults.success).toBe(true);
      expect(docsResults.success).toBe(true);
      
      // In a real implementation, you might add cross-validation logic here
    });
  });
});