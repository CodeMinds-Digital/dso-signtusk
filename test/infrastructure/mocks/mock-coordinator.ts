/**
 * Mock Coordinator
 * 
 * Coordinates reset functionality across all mock components.
 * Provides centralized mock management and state restoration.
 */

import { CryptoMock } from './crypto-mock';
import { FieldMock } from './field-mock';
import { PdfMock } from './pdf-mock';
import { MockConfiguration, MockResetState } from './types';

export class MockCoordinator {
  private pdfMock: PdfMock;
  private fieldMock: FieldMock;
  private cryptoMock: CryptoMock;
  private initialState: MockResetState;
  private resetHistory: Array<{ timestamp: Date; reason?: string }> = [];

  constructor(
    pdfMock?: PdfMock,
    fieldMock?: FieldMock,
    cryptoMock?: CryptoMock
  ) {
    this.pdfMock = pdfMock || new PdfMock();
    this.fieldMock = fieldMock || new FieldMock();
    this.cryptoMock = cryptoMock || new CryptoMock();
    
    // Capture initial state
    this.initialState = this.captureCurrentState();
  }

  /**
   * Reset all mock components to clean state
   */
  resetAll(reason?: string): void {
    this.recordReset(reason);
    
    this.pdfMock.reset();
    this.fieldMock.reset();
    this.cryptoMock.reset();
  }

  /**
   * Reset specific mock component
   */
  resetMock(mockType: 'pdf' | 'field' | 'crypto', reason?: string): void {
    this.recordReset(`${mockType}: ${reason || 'manual reset'}`);
    
    switch (mockType) {
      case 'pdf':
        this.pdfMock.reset();
        break;
      case 'field':
        this.fieldMock.reset();
        break;
      case 'crypto':
        this.cryptoMock.reset();
        break;
    }
  }

  /**
   * Restore to initial state
   */
  restoreToInitialState(): void {
    this.recordReset('restore to initial state');
    
    // Reset all mocks first
    this.resetAll();
    
    // Restore initial configurations if they existed
    if (this.initialState.pdf.defaultState) {
      this.pdfMock.updateConfiguration({
        documentState: this.initialState.pdf.defaultState,
        fields: [],
        validationBehavior: { shouldSucceed: true }
      });
    }
  }

  /**
   * Get current state of all mocks
   */
  getCurrentState(): MockResetState {
    return this.captureCurrentState();
  }

  /**
   * Verify all mocks are in clean state
   */
  verifyCleanState(): boolean {
    const pdfClean = this.pdfMock.getLoadedDocuments().length === 0 &&
                     this.pdfMock.getOperationHistory().length === 0;
    
    const fieldClean = this.fieldMock.getRegisteredDocuments().length === 0 &&
                       this.fieldMock.getLookupHistory().length === 0;
    
    const cryptoClean = this.cryptoMock.getOperationHistory().length === 0 &&
                        this.cryptoMock.getOperationCount() === 0;
    
    return pdfClean && fieldClean && cryptoClean;
  }

  /**
   * Get reset history
   */
  getResetHistory(): Array<{ timestamp: Date; reason?: string }> {
    return [...this.resetHistory];
  }

  /**
   * Get mock instances
   */
  getMocks(): { pdf: PdfMock; field: FieldMock; crypto: CryptoMock } {
    return {
      pdf: this.pdfMock,
      field: this.fieldMock,
      crypto: this.cryptoMock
    };
  }

  /**
   * Update configuration for all mocks
   */
  updateAllConfigurations(config: MockConfiguration): void {
    this.pdfMock.updateConfiguration(config.pdf);
    this.cryptoMock.updateConfiguration(config.crypto);
    // Field mock uses pdf configuration
    this.fieldMock.updateConfiguration(config.pdf);
  }

  /**
   * Get all configurations
   */
  getAllConfigurations(): {
    pdf: MockConfiguration['pdf'];
    crypto: MockConfiguration['crypto'];
    field: Partial<MockConfiguration['pdf']>;
  } {
    return {
      pdf: this.pdfMock.getConfiguration(),
      crypto: this.cryptoMock.getConfiguration(),
      field: this.fieldMock.getConfiguration()
    };
  }

  /**
   * Clear all caches across mocks
   */
  clearAllCaches(): void {
    this.cryptoMock.clearCache();
    this.fieldMock.clearValidationCache();
    // PDF mock doesn't have explicit cache, but we can reset operation history
    this.recordReset('cache clear');
  }

  /**
   * Get comprehensive status of all mocks
   */
  getStatus(): {
    pdf: {
      documentsLoaded: number;
      operationsPerformed: number;
      isClean: boolean;
    };
    field: {
      documentsRegistered: number;
      lookupsPerformed: number;
      isClean: boolean;
    };
    crypto: {
      operationsPerformed: number;
      validationCount: number;
      signCount: number;
      verifyCount: number;
      isClean: boolean;
    };
    overall: {
      isClean: boolean;
      lastReset?: Date;
      resetCount: number;
    };
  } {
    const pdfStatus = {
      documentsLoaded: this.pdfMock.getLoadedDocuments().length,
      operationsPerformed: this.pdfMock.getOperationHistory().length,
      isClean: this.pdfMock.getLoadedDocuments().length === 0 && 
               this.pdfMock.getOperationHistory().length === 0
    };

    const fieldStatus = {
      documentsRegistered: this.fieldMock.getRegisteredDocuments().length,
      lookupsPerformed: this.fieldMock.getLookupHistory().length,
      isClean: this.fieldMock.getRegisteredDocuments().length === 0 && 
               this.fieldMock.getLookupHistory().length === 0
    };

    const cryptoStatus = {
      operationsPerformed: this.cryptoMock.getOperationCount(),
      validationCount: this.cryptoMock.getOperationCount('validate'),
      signCount: this.cryptoMock.getOperationCount('sign'),
      verifyCount: this.cryptoMock.getOperationCount('verify'),
      isClean: this.cryptoMock.getOperationCount() === 0
    };

    return {
      pdf: pdfStatus,
      field: fieldStatus,
      crypto: cryptoStatus,
      overall: {
        isClean: pdfStatus.isClean && fieldStatus.isClean && cryptoStatus.isClean,
        lastReset: this.resetHistory.length > 0 ? 
                   this.resetHistory[this.resetHistory.length - 1].timestamp : 
                   undefined,
        resetCount: this.resetHistory.length
      }
    };
  }

  private captureCurrentState(): MockResetState {
    return {
      pdf: {
        documents: new Map(), // Would need to expose this from PdfMock for full state capture
        defaultState: this.pdfMock.getConfiguration().documentState!
      },
      crypto: {
        validationResults: this.cryptoMock.getConfiguration().validationResults,
        operationCount: this.cryptoMock.getOperationCount()
      },
      field: {
        lookupCache: new Map(), // Would need to expose this from FieldMock for full state capture
        validationCache: new Map()
      }
    };
  }

  private recordReset(reason?: string): void {
    this.resetHistory.push({
      timestamp: new Date(),
      reason
    });
  }
}

/**
 * Global mock coordinator instance for easy access
 */
export const globalMockCoordinator = new MockCoordinator();

/**
 * Utility functions for common reset operations
 */
export const MockResetUtils = {
  /**
   * Quick reset all mocks
   */
  resetAll: (reason?: string) => globalMockCoordinator.resetAll(reason),
  
  /**
   * Verify clean state
   */
  verifyClean: () => globalMockCoordinator.verifyCleanState(),
  
  /**
   * Get status
   */
  getStatus: () => globalMockCoordinator.getStatus(),
  
  /**
   * Create new coordinator with fresh mocks
   */
  createFreshCoordinator: () => new MockCoordinator(),
  
  /**
   * Reset and verify clean state
   */
  resetAndVerify: (reason?: string): boolean => {
    globalMockCoordinator.resetAll(reason);
    return globalMockCoordinator.verifyCleanState();
  }
};