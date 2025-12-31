/**
 * Crypto Mock Implementation
 * 
 * Simulates PKCS#7 signature validation and cryptographic operations for testing purposes.
 * Provides configurable success/failure scenarios and maintains operation state.
 */

import { ErrorType } from '../errors/types';
import { RealisticErrorPatterns } from './realistic-error-patterns';
import {
    ErrorScenario,
    MockConfiguration,
    ValidationResult
} from './types';

// Create a singleton instance for use in this mock
const realisticErrorPatterns = new RealisticErrorPatterns();

export interface PKCS7Data {
  signature: string;
  certificate?: string;
  timestamp?: Date;
  algorithm?: string;
}

export interface CryptoOperation {
  id: string;
  type: 'validate' | 'sign' | 'verify';
  data: PKCS7Data;
  result?: ValidationResult;
  timestamp: Date;
}

export class CryptoMock {
  private configuration: MockConfiguration['crypto'];
  private operationHistory: CryptoOperation[] = [];
  private validationCache: Map<string, ValidationResult> = new Map();
  private operationCounter: number = 0;

  constructor(configuration?: Partial<MockConfiguration['crypto']>) {
    this.configuration = {
      validationResults: configuration?.validationResults || [],
      errorScenarios: configuration?.errorScenarios || []
    };
  }

  /**
   * Validate PKCS#7 signature data
   */
  async validatePKCS7(data: PKCS7Data): Promise<ValidationResult> {
    const operationId = this.generateOperationId();
    const operation: CryptoOperation = {
      id: operationId,
      type: 'validate',
      data: { ...data },
      timestamp: new Date()
    };

    // Check cache for consistent results
    const cacheKey = this.getCacheKey('validate', data);
    if (this.validationCache.has(cacheKey)) {
      const cachedResult = this.validationCache.get(cacheKey)!;
      operation.result = cachedResult;
      this.operationHistory.push(operation);
      return { ...cachedResult };
    }

    // Check for configured error scenarios first
    const errorScenario = this.findMatchingErrorScenario('validate', data);
    if (errorScenario) {
      // Use the original error scenario message for consistency in tests
      const result: ValidationResult = {
        isValid: false,
        errorType: errorScenario.errorType,
        message: errorScenario.message,
        context: { ...errorScenario.context }
      };
      
      // Create a version with operationId for operation history
      const resultWithOpId = {
        ...result,
        context: { ...result.context, operationId }
      };
      
      operation.result = resultWithOpId;
      this.operationHistory.push(operation);
      this.validationCache.set(cacheKey, result); // Cache without operationId
      return { ...result }; // Return without operationId for consistency
    }

    // Use configured validation results or default behavior
    const result = this.getValidationResult(data);
    operation.result = result;
    this.operationHistory.push(operation);
    this.validationCache.set(cacheKey, result);
    
    return { ...result };
  }

  /**
   * Simulate signature creation
   */
  async createSignature(data: { content: string; certificate: string }): Promise<PKCS7Data> {
    const operationId = this.generateOperationId();
    const operation: CryptoOperation = {
      id: operationId,
      type: 'sign',
      data: {
        signature: this.generateMockSignature(data.content),
        certificate: data.certificate,
        timestamp: new Date(),
        algorithm: 'SHA256withRSA'
      },
      timestamp: new Date()
    };

    // Check for error scenarios
    const errorScenario = this.findMatchingErrorScenario('sign', operation.data);
    if (errorScenario) {
      throw new Error(errorScenario.message);
    }

    this.operationHistory.push(operation);
    return { ...operation.data };
  }

  /**
   * Validate signature (simplified interface for compatibility)
   */
  async validateSignature(signature: string, certificate?: string): Promise<ValidationResult> {
    const pkcs7Data: PKCS7Data = {
      signature,
      certificate,
      timestamp: new Date(),
      algorithm: 'SHA256withRSA'
    };
    
    return this.validatePKCS7(pkcs7Data);
  }
  async verifySignature(signature: PKCS7Data, content: string): Promise<ValidationResult> {
    const operationId = this.generateOperationId();
    const operation: CryptoOperation = {
      id: operationId,
      type: 'verify',
      data: { ...signature },
      timestamp: new Date()
    };

    const cacheKey = this.getCacheKey('verify', { ...signature, content });
    if (this.validationCache.has(cacheKey)) {
      const cachedResult = this.validationCache.get(cacheKey)!;
      operation.result = cachedResult;
      this.operationHistory.push(operation);
      return { ...cachedResult };
    }

    // Check for error scenarios
    const errorScenario = this.findMatchingErrorScenario('verify', signature);
    if (errorScenario) {
      const result: ValidationResult = {
        isValid: false,
        errorType: errorScenario.errorType,
        message: errorScenario.message,
        context: { ...errorScenario.context, content }
      };
      
      // Create a version with operationId for operation history
      const resultWithOpId = {
        ...result,
        context: { ...result.context, operationId }
      };
      
      operation.result = resultWithOpId;
      this.operationHistory.push(operation);
      this.validationCache.set(cacheKey, result); // Cache without operationId
      return { ...result }; // Return without operationId for consistency
    }

    // Simulate verification logic
    const result = this.simulateVerification(signature, content);
    operation.result = result;
    this.operationHistory.push(operation);
    this.validationCache.set(cacheKey, result);
    
    return { ...result };
  }

  /**
   * Get certificate information from PKCS#7 data
   */
  getCertificateInfo(data: PKCS7Data): Record<string, any> {
    // Create consistent dates based on input data to ensure same input produces same output
    const baseTime = this.getConsistentBaseTime(data);
    
    return {
      subject: 'CN=Test Certificate',
      issuer: 'CN=Test CA',
      validFrom: new Date(baseTime - 365 * 24 * 60 * 60 * 1000),
      validTo: new Date(baseTime + 365 * 24 * 60 * 60 * 1000),
      serialNumber: '123456789',
      algorithm: data.algorithm || 'SHA256withRSA'
    };
  }

  /**
   * Check if signature is expired
   */
  isSignatureExpired(data: PKCS7Data): boolean {
    if (!data.timestamp) {
      return false;
    }
    
    // Mock expiration logic - signatures expire after 1 year
    const expirationTime = new Date(data.timestamp.getTime() + 365 * 24 * 60 * 60 * 1000);
    return new Date() > expirationTime;
  }

  /**
   * Get operation history
   */
  getOperationHistory(): CryptoOperation[] {
    return [...this.operationHistory];
  }

  /**
   * Get operation count by type
   */
  getOperationCount(type?: 'validate' | 'sign' | 'verify'): number {
    if (!type) {
      return this.operationHistory.length;
    }
    return this.operationHistory.filter(op => op.type === type).length;
  }

  /**
   * Add realistic error scenario configuration
   */
  addRealisticErrorScenario(errorType: ErrorType, context?: Record<string, any>): void {
    const realisticScenario = realisticErrorPatterns.generateRealisticError(errorType, context || {});
    this.configuration.errorScenarios.push(realisticScenario);
  }

  /**
   * Generate multiple realistic error scenarios for testing
   */
  generateRealisticErrorScenarios(errorType: ErrorType, count: number = 3): ErrorScenario[] {
    const scenarios = realisticErrorPatterns.generateErrorScenarios(errorType, count);
    this.configuration.errorScenarios.push(...scenarios);
    return scenarios;
  }

  /**
   * Add error scenario configuration
   */
  addErrorScenario(scenario: ErrorScenario): void {
    this.configuration.errorScenarios.push(scenario);
  }

  /**
   * Remove error scenario
   */
  removeErrorScenario(trigger: string): void {
    this.configuration.errorScenarios = this.configuration.errorScenarios
      .filter(scenario => scenario.trigger !== trigger);
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<MockConfiguration['crypto']>): void {
    this.configuration = {
      ...this.configuration,
      ...config
    };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): MockConfiguration['crypto'] {
    return {
      validationResults: [...this.configuration.validationResults],
      errorScenarios: [...this.configuration.errorScenarios]
    };
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Reset mock to clean state
   */
  reset(): void {
    this.operationHistory = [];
    this.validationCache.clear();
    this.operationCounter = 0;
    this.configuration = {
      validationResults: [],
      errorScenarios: []
    };
    
    // Ensure operation history is truly empty
    this.operationHistory = [];
    this.validationCache = new Map();
  }

  private generateOperationId(): string {
    return `crypto_op_${++this.operationCounter}_${Date.now()}`;
  }

  private getCacheKey(operation: string, data: any): string {
    // Create a consistent cache key from operation and data
    const dataStr = JSON.stringify(data, Object.keys(data).sort());
    return `${operation}:${Buffer.from(dataStr).toString('base64')}`;
  }

  private findMatchingErrorScenario(operation: string, data: any): ErrorScenario | null {
    return this.configuration.errorScenarios.find(scenario => {
      // Simple trigger matching - could be enhanced with more sophisticated matching
      return scenario.trigger === operation || 
             scenario.trigger === 'all' ||
             (data.signature && scenario.trigger === data.signature);
    }) || null;
  }

  private getValidationResult(data: PKCS7Data): ValidationResult {
    // Use configured validation results if available
    if (this.configuration.validationResults.length > 0) {
      // Use a hash of the input data to select a consistent result
      const dataHash = this.getDataHash(data);
      const configuredResult = this.configuration.validationResults[
        dataHash % this.configuration.validationResults.length
      ];
      return { ...configuredResult };
    }

    // Default validation logic
    return this.defaultValidation(data);
  }

  private defaultValidation(data: PKCS7Data): ValidationResult {
    // Simple validation rules for mock
    if (!data.signature || data.signature.length === 0 || data.signature.trim().length === 0) {
      const errorScenario = realisticErrorPatterns.generateRealisticError(ErrorType.PKCS7_INVALID, {
        pkcs7Error: 'Empty signature data',
        certificate: data.certificate || 'unknown'
      });
      return {
        isValid: false,
        errorType: ErrorType.PKCS7_INVALID,
        message: errorScenario.message,
        context: { reason: 'empty_signature', ...errorScenario.context }
      };
    }

    if (data.signature.includes('invalid')) {
      const errorScenario = realisticErrorPatterns.generateRealisticError(ErrorType.PKCS7_INVALID, {
        pkcs7Error: 'Invalid signature format detected',
        certificate: data.certificate || 'unknown'
      });
      return {
        isValid: false,
        errorType: ErrorType.PKCS7_INVALID,
        message: errorScenario.message,
        context: { reason: 'invalid_format', ...errorScenario.context }
      };
    }

    if (this.isSignatureExpired(data)) {
      const errorScenario = realisticErrorPatterns.generateRealisticError(ErrorType.CRYPTO_VALIDATION_ERROR, {
        cryptoReason: 'Signature timestamp has expired',
        algorithm: data.algorithm || 'SHA256withRSA'
      });
      return {
        isValid: false,
        errorType: ErrorType.CRYPTO_VALIDATION_ERROR,
        message: errorScenario.message,
        context: { reason: 'expired', ...errorScenario.context }
      };
    }

    return {
      isValid: true,
      context: { algorithm: data.algorithm || 'SHA256withRSA' }
    };
  }

  private simulateVerification(signature: PKCS7Data, content: string): ValidationResult {
    // Mock verification logic
    const expectedSignature = this.generateMockSignature(content);
    
    if (signature.signature === expectedSignature) {
      return {
        isValid: true,
        context: { content, verified: true }
      };
    }

    const errorScenario = realisticErrorPatterns.generateRealisticError(ErrorType.SIGNATURE_ERROR, {
      signatureReason: 'Signature verification mismatch',
      algorithm: signature.algorithm || 'SHA256withRSA'
    });

    return {
      isValid: false,
      errorType: ErrorType.SIGNATURE_ERROR,
      message: errorScenario.message,
      context: { 
        content, 
        expected: expectedSignature, 
        actual: signature.signature,
        ...errorScenario.context
      }
    };
  }

  private generateMockSignature(content: string): string {
    // Simple mock signature generation
    const hash = Buffer.from(content).toString('base64');
    return `mock_signature_${hash.substring(0, 16)}`;
  }

  private getConsistentBaseTime(data: PKCS7Data): number {
    // Generate consistent timestamp based on input data
    // This ensures same input always produces same certificate dates
    let hash = 0;
    const str = JSON.stringify(data, Object.keys(data).sort());
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use a fixed base time (2024-01-01) plus the hash offset
    const baseTime = new Date('2024-01-01T00:00:00Z').getTime();
    return baseTime + (Math.abs(hash) % (365 * 24 * 60 * 60 * 1000));
  }

  private getDataHash(data: any): number {
    // Generate consistent hash based on input data
    let hash = 0;
    const str = JSON.stringify(data, Object.keys(data).sort());
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private enhanceErrorScenario(scenario: ErrorScenario, data: any): ErrorScenario {
    // If scenario already has realistic patterns, return as-is
    if (scenario.message.includes('Code:') || scenario.context?.errorCode) {
      return scenario;
    }

    // Generate realistic error pattern for this scenario
    const realisticError = realisticErrorPatterns.generateRealisticError(scenario.errorType, {
      ...scenario.context,
      ...data
    });

    return {
      ...scenario,
      message: realisticError.message,
      context: {
        ...scenario.context,
        ...realisticError.context
      }
    };
  }
}