/**
 * PDF Mock Implementation
 * 
 * Simulates PDF document operations for testing purposes.
 * Provides configurable behavior for field discovery and document state management.
 */

import { ErrorType } from '../errors/types';
import { RealisticErrorPatterns } from './realistic-error-patterns';
import {
    DocumentState,
    FieldDefinition,
    MockConfiguration,
    PdfDocument
} from './types';

// Create a singleton instance for use in this mock
const realisticErrorPatterns = new RealisticErrorPatterns();

export class PdfMock {
  private documents: Map<string, PdfDocument> = new Map();
  private configuration: MockConfiguration['pdf'];
  private operationHistory: Array<{ operation: string; documentId: string; timestamp: Date }> = [];

  constructor(configuration?: Partial<MockConfiguration['pdf']>) {
    this.configuration = {
      fields: configuration?.fields || [],
      documentState: configuration?.documentState || DocumentState.LOADED,
      validationBehavior: configuration?.validationBehavior || { shouldSucceed: true }
    };
  }

  /**
   * Load a PDF document with the given ID and field configuration
   */
  async loadDocument(documentId: string, fields?: FieldDefinition[]): Promise<PdfDocument & { success: boolean }> {
    this.recordOperation('load', documentId);

    // Check if validation should fail
    if (!this.configuration.validationBehavior.shouldSucceed) {
      // Use custom message if available (from realistic error patterns)
      if (this.configuration.validationBehavior.customMessage) {
        throw new Error(this.configuration.validationBehavior.customMessage);
      }
      
      throw new Error(this.getErrorMessage(
        this.configuration.validationBehavior.errorType || ErrorType.PDF_LOAD_ERROR,
        { documentId }
      ));
    }

    const document: PdfDocument & { success: boolean } = {
      id: documentId,
      fields: fields || this.configuration.fields,
      state: this.configuration.documentState,
      metadata: {
        loadedAt: new Date(),
        fieldCount: (fields || this.configuration.fields).length
      },
      success: true
    };

    this.documents.set(documentId, document);
    return document;
  }

  /**
   * Discover fields in a loaded document
   */
  async discoverFields(documentId: string): Promise<FieldDefinition[]> {
    this.recordOperation('discoverFields', documentId);

    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(this.getErrorMessage(ErrorType.PDF_LOAD_ERROR, { documentId }));
    }

    // Return consistent results based on document configuration
    return [...document.fields];
  }

  /**
   * Get a specific field by name from a document
   */
  async getField(documentId: string, fieldName: string): Promise<FieldDefinition | null> {
    this.recordOperation('getField', documentId);

    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(this.getErrorMessage(ErrorType.PDF_LOAD_ERROR, { documentId }));
    }

    const field = document.fields.find(f => f.name === fieldName);
    return field || null;
  }

  /**
   * Update document state
   */
  async updateDocumentState(documentId: string, newState: DocumentState): Promise<void> {
    this.recordOperation('updateState', documentId);

    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(this.getErrorMessage(ErrorType.PDF_LOAD_ERROR, { documentId }));
    }

    document.state = newState;
    document.metadata.lastModified = new Date();
  }

  /**
   * Set field value in a document
   */
  async setFieldValue(documentId: string, fieldName: string, value: string): Promise<void> {
    this.recordOperation('setFieldValue', documentId);

    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(this.getErrorMessage(ErrorType.PDF_LOAD_ERROR, { documentId }));
    }

    const field = document.fields.find(f => f.name === fieldName);
    if (!field) {
      throw new Error(this.getErrorMessage(ErrorType.FIELD_NOT_FOUND, { documentId, fieldName }));
    }

    field.value = value;
    document.state = DocumentState.MODIFIED;
    document.metadata.lastModified = new Date();
  }

  /**
   * Get current document state
   */
  getDocumentState(documentId: string): DocumentState | null {
    const document = this.documents.get(documentId);
    return document ? document.state : null;
  }

  /**
   * Get document metadata
   */
  getDocumentMetadata(documentId: string): Record<string, any> | null {
    const document = this.documents.get(documentId);
    return document ? { ...document.metadata } : null;
  }

  /**
   * Check if document exists
   */
  hasDocument(documentId: string): boolean {
    return this.documents.has(documentId);
  }

  /**
   * Get all loaded document IDs
   */
  getLoadedDocuments(): string[] {
    return Array.from(this.documents.keys());
  }

  /**
   * Get operation history for debugging
   */
  getOperationHistory(): Array<{ operation: string; documentId: string; timestamp: Date }> {
    return [...this.operationHistory];
  }

  /**
   * Configure realistic error scenarios for testing
   */
  configureRealisticErrorScenario(errorType: ErrorType, context?: Record<string, any>): void {
    const realisticScenario = realisticErrorPatterns.generateRealisticError(errorType, context || {});
    
    // Configure validation behavior to trigger this error
    this.configuration.validationBehavior = {
      shouldSucceed: false,
      errorType: realisticScenario.errorType,
      customMessage: realisticScenario.message
    };
  }

  /**
   * Update mock configuration
   */
  updateConfiguration(config: Partial<MockConfiguration['pdf']>): void {
    this.configuration = {
      ...this.configuration,
      ...config
    };
  }

  /**
   * Reset mock to clean state
   */
  reset(): void {
    this.documents.clear();
    this.operationHistory = [];
    this.configuration = {
      fields: [],
      documentState: DocumentState.LOADED,
      validationBehavior: { shouldSucceed: true }
    };
    
    // Ensure documents map is truly empty
    this.documents = new Map();
  }

  /**
   * Get current configuration
   */
  getConfiguration(): MockConfiguration['pdf'] {
    return { ...this.configuration };
  }

  private recordOperation(operation: string, documentId: string): void {
    this.operationHistory.push({
      operation,
      documentId,
      timestamp: new Date()
    });
  }

  private getErrorMessage(errorType: ErrorType, context: Record<string, any>): string {
    // Use realistic error patterns for production-like error messages
    const errorScenario = realisticErrorPatterns.generateRealisticError(errorType, context);
    return errorScenario.message;
  }
}