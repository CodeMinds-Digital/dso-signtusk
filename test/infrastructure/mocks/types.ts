/**
 * Mock implementation types for test infrastructure
 */

import { ErrorType, ValidationRule } from '../errors/types';

export enum FieldType {
  TEXT = 'TEXT',
  SIGNATURE = 'SIGNATURE',
  DATE = 'DATE',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DROPDOWN = 'DROPDOWN'
}

export enum DocumentState {
  LOADED = 'LOADED',
  MODIFIED = 'MODIFIED',
  SIGNED = 'SIGNED',
  ERROR = 'ERROR',
  UNLOADED = 'UNLOADED'
}

export enum ComplexityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required: boolean;
  validation: ValidationRule[];
  value?: string;
  position?: { x: number; y: number; width: number; height: number };
}

export interface ValidationBehavior {
  shouldSucceed: boolean;
  errorType?: ErrorType;
  customMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorType?: ErrorType;
  message?: string;
  context?: Record<string, any>;
}

export interface ErrorScenario {
  trigger: string;
  errorType: ErrorType;
  message: string;
  context?: Record<string, any>;
}

export interface MockConfiguration {
  pdf: {
    fields: FieldDefinition[];
    documentState: DocumentState;
    validationBehavior: ValidationBehavior;
  };
  crypto: {
    validationResults: ValidationResult[];
    errorScenarios: ErrorScenario[];
  };
  errorPatterns: Record<string, any>;
}

export interface Range {
  min: number;
  max: number;
}

export interface GeneratorConfiguration {
  dataAlignment: {
    mockCompatibility: boolean;
    fieldConsistency: boolean;
    errorScenarioSupport: boolean;
  };
  constraints: {
    fieldCount: Range;
    documentSize: Range;
    validationComplexity: ComplexityLevel;
  };
}

export interface PdfDocument {
  id: string;
  fields: FieldDefinition[];
  state: DocumentState;
  metadata: Record<string, any>;
}

export interface MockResetState {
  pdf: {
    documents: Map<string, PdfDocument>;
    defaultState: DocumentState;
  };
  crypto: {
    validationResults: ValidationResult[];
    operationCount: number;
  };
  field: {
    lookupCache: Map<string, FieldDefinition[]>;
    validationCache: Map<string, ValidationResult>;
  };
}