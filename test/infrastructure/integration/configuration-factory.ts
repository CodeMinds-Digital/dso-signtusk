/**
 * Configuration Factory
 * 
 * Unified configuration management for test infrastructure components.
 * Provides test framework integration points and configuration presets.
 */

import { ErrorPatternRegistry } from '../errors/error-pattern-registry';
import { ErrorType } from '../errors/types';
import { AlignedDataGenerator } from '../generators/aligned-data-generator';
import { ConfigurationGenerator } from '../generators/configuration-generator';
import {
    ComplexityLevel,
    DocumentState,
    FieldType,
    GeneratorConfiguration,
    MockConfiguration
} from '../mocks/types';

export interface TestFrameworkIntegration {
  framework: 'jest' | 'vitest' | 'mocha' | 'custom';
  setupHooks: {
    beforeEach?: () => void | Promise<void>;
    afterEach?: () => void | Promise<void>;
    beforeAll?: () => void | Promise<void>;
    afterAll?: () => void | Promise<void>;
  };
  configurationOverrides?: Partial<MockConfiguration>;
  generatorOverrides?: Partial<GeneratorConfiguration>;
}

export interface ConfigurationPreset {
  name: string;
  description: string;
  mockConfiguration: MockConfiguration;
  generatorConfiguration: GeneratorConfiguration;
  testFrameworkIntegration?: TestFrameworkIntegration;
  tags: string[];
}

export interface ConfigurationFactoryOptions {
  defaultPreset?: string;
  enableCaching?: boolean;
  validateConfigurations?: boolean;
  logConfigurationChanges?: boolean;
}

export class ConfigurationFactory {
  private readonly configGenerator: ConfigurationGenerator;
  private readonly dataGenerator: AlignedDataGenerator;
  private readonly errorPatternRegistry: ErrorPatternRegistry;
  private readonly options: Required<ConfigurationFactoryOptions>;
  private readonly presets: Map<string, ConfigurationPreset> = new Map();
  private readonly configurationCache: Map<string, MockConfiguration> = new Map();
  private currentPreset: string | null = null;

  constructor(options: ConfigurationFactoryOptions = {}) {
    this.options = {
      defaultPreset: options.defaultPreset ?? 'standard',
      enableCaching: options.enableCaching ?? true,
      validateConfigurations: options.validateConfigurations ?? true,
      logConfigurationChanges: options.logConfigurationChanges ?? false
    };

    this.configGenerator = new ConfigurationGenerator();
    this.dataGenerator = new AlignedDataGenerator();
    this.errorPatternRegistry = new ErrorPatternRegistry();

    this.initializeDefaultPresets();
    this.log('ConfigurationFactory initialized', { options: this.options });
  }

  /**
   * Create configuration for specific test scenario
   */
  createConfiguration(scenario: 'unit-testing' | 'integration-testing' | 'property-testing' | 'error-testing' | 'performance-testing', options?: {
    complexity?: ComplexityLevel;
    documentState?: DocumentState;
    fieldTypes?: FieldType[];
    errorTypes?: ErrorType[];
    customOverrides?: Partial<MockConfiguration>;
  }): MockConfiguration {
    const cacheKey = this.generateCacheKey(scenario, options);
    
    if (this.options.enableCaching && this.configurationCache.has(cacheKey)) {
      this.log(`Using cached configuration for: ${scenario}`);
      return this.configurationCache.get(cacheKey)!;
    }

    this.log(`Creating configuration for scenario: ${scenario}`, options);

    const baseConfig = this.createBaseConfigurationForScenario(scenario, options);
    const finalConfig = this.applyCustomOverrides(baseConfig, options?.customOverrides);

    if (this.options.validateConfigurations) {
      this.validateConfiguration(finalConfig);
    }

    if (this.options.enableCaching) {
      this.configurationCache.set(cacheKey, finalConfig);
    }

    return finalConfig;
  }

  /**
   * Create test framework integration configuration
   */
  createTestFrameworkIntegration(framework: 'jest' | 'vitest' | 'mocha' | 'custom', options?: {
    autoReset?: boolean;
    enableLogging?: boolean;
    configurationPreset?: string;
    customSetup?: {
      beforeEach?: () => void | Promise<void>;
      afterEach?: () => void | Promise<void>;
      beforeAll?: () => void | Promise<void>;
      afterAll?: () => void | Promise<void>;
    };
  }): TestFrameworkIntegration {
    const autoReset = options?.autoReset ?? true;
    const enableLogging = options?.enableLogging ?? false;
    const preset = options?.configurationPreset ?? this.options.defaultPreset;

    this.log(`Creating test framework integration for: ${framework}`, { autoReset, enableLogging, preset });

    const presetConfig = this.getPreset(preset);
    
    const integration: TestFrameworkIntegration = {
      framework,
      setupHooks: {
        beforeAll: async () => {
          this.log(`Test framework setup: ${framework} - beforeAll`);
          if (options?.customSetup?.beforeAll) {
            await options.customSetup.beforeAll();
          }
        },
        beforeEach: async () => {
          this.log(`Test framework setup: ${framework} - beforeEach`);
          if (autoReset) {
            // Reset would be handled by TestCoordinator
            this.log('Auto-reset enabled for test framework integration');
          }
          if (options?.customSetup?.beforeEach) {
            await options.customSetup.beforeEach();
          }
        },
        afterEach: async () => {
          this.log(`Test framework cleanup: ${framework} - afterEach`);
          if (options?.customSetup?.afterEach) {
            await options.customSetup.afterEach();
          }
        },
        afterAll: async () => {
          this.log(`Test framework cleanup: ${framework} - afterAll`);
          if (options?.customSetup?.afterAll) {
            await options.customSetup.afterAll();
          }
        }
      },
      configurationOverrides: presetConfig?.mockConfiguration,
      generatorOverrides: presetConfig?.generatorConfiguration
    };

    return integration;
  }

  /**
   * Register custom configuration preset
   */
  registerPreset(preset: ConfigurationPreset): void {
    this.log(`Registering preset: ${preset.name}`, { description: preset.description, tags: preset.tags });
    
    if (this.options.validateConfigurations) {
      this.validateConfiguration(preset.mockConfiguration);
    }

    this.presets.set(preset.name, preset);
  }

  /**
   * Get configuration preset by name
   */
  getPreset(name: string): ConfigurationPreset | null {
    return this.presets.get(name) || null;
  }

  /**
   * List all available presets
   */
  listPresets(): ConfigurationPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Set current active preset
   */
  setActivePreset(name: string): void {
    if (!this.presets.has(name)) {
      throw new Error(`Preset not found: ${name}`);
    }
    
    this.currentPreset = name;
    this.log(`Active preset changed to: ${name}`);
  }

  /**
   * Get current active preset
   */
  getActivePreset(): ConfigurationPreset | null {
    return this.currentPreset ? this.getPreset(this.currentPreset) : null;
  }

  /**
   * Create configuration batch for property-based testing
   */
  createPropertyTestingBatch(count: number, options?: {
    scenario?: 'unit-testing' | 'integration-testing' | 'error-testing';
    complexity?: ComplexityLevel;
    includeVariations?: boolean;
  }): MockConfiguration[] {
    const scenario = options?.scenario ?? 'property-testing';
    const complexity = options?.complexity ?? ComplexityLevel.MEDIUM;
    const includeVariations = options?.includeVariations ?? true;

    this.log(`Creating property testing batch: ${count} configurations`, { scenario, complexity, includeVariations });

    const configurations: MockConfiguration[] = [];

    for (let i = 0; i < count; i++) {
      const batchComplexity = includeVariations 
        ? this.getRandomComplexity() 
        : complexity;

      const batchDocumentState = includeVariations
        ? this.getRandomDocumentState()
        : DocumentState.LOADED;

      const config = this.createConfiguration(scenario as any, {
        complexity: batchComplexity,
        documentState: batchDocumentState
      });

      configurations.push(config);
    }

    return configurations;
  }

  /**
   * Validate configuration compatibility
   */
  validateConfigurationCompatibility(mockConfig: MockConfiguration, generatorConfig: GeneratorConfiguration): {
    isCompatible: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check field count compatibility
    const mockFieldCount = mockConfig.pdf.fields.length;
    const generatorFieldRange = generatorConfig.constraints.fieldCount;
    
    if (mockFieldCount < generatorFieldRange.min || mockFieldCount > generatorFieldRange.max) {
      issues.push(`Mock field count (${mockFieldCount}) outside generator range (${generatorFieldRange.min}-${generatorFieldRange.max})`);
      recommendations.push('Adjust generator field count constraints or mock field configuration');
    }

    // Check error scenario compatibility
    const mockHasErrorScenarios = mockConfig.crypto.errorScenarios.length > 0;
    const generatorSupportsErrors = generatorConfig.dataAlignment.errorScenarioSupport;

    if (mockHasErrorScenarios && !generatorSupportsErrors) {
      issues.push('Mock has error scenarios but generator does not support error scenario generation');
      recommendations.push('Enable error scenario support in generator configuration');
    }

    // Check data alignment settings
    if (!generatorConfig.dataAlignment.mockCompatibility) {
      issues.push('Generator mock compatibility is disabled');
      recommendations.push('Enable mock compatibility in generator configuration');
    }

    if (!generatorConfig.dataAlignment.fieldConsistency) {
      issues.push('Generator field consistency is disabled');
      recommendations.push('Enable field consistency in generator configuration');
    }

    return {
      isCompatible: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configurationCache.clear();
    this.log('Configuration cache cleared');
  }

  /**
   * Get factory status and statistics
   */
  getStatus(): {
    presets: {
      total: number;
      active: string | null;
      available: string[];
    };
    cache: {
      enabled: boolean;
      size: number;
      hitRate?: number;
    };
    options: ConfigurationFactoryOptions;
  } {
    return {
      presets: {
        total: this.presets.size,
        active: this.currentPreset,
        available: Array.from(this.presets.keys())
      },
      cache: {
        enabled: this.options.enableCaching,
        size: this.configurationCache.size
      },
      options: this.options
    };
  }

  // Private helper methods

  private initializeDefaultPresets(): void {
    // Unit Testing Preset
    this.registerPreset({
      name: 'unit-testing',
      description: 'Optimized for unit testing with minimal complexity',
      mockConfiguration: this.configGenerator.generateMockConfiguration({
        fieldCount: { min: 1, max: 3 },
        documentState: DocumentState.LOADED,
        validationComplexity: ComplexityLevel.LOW,
        includeErrorScenarios: false
      }),
      generatorConfiguration: this.configGenerator.generateGeneratorConfiguration('minimal'),
      tags: ['unit', 'fast', 'minimal']
    });

    // Integration Testing Preset
    this.registerPreset({
      name: 'integration-testing',
      description: 'Balanced configuration for integration testing',
      mockConfiguration: this.configGenerator.generateMockConfiguration({
        fieldCount: { min: 3, max: 10 },
        documentState: DocumentState.LOADED,
        validationComplexity: ComplexityLevel.MEDIUM,
        includeErrorScenarios: true
      }),
      generatorConfiguration: this.configGenerator.generateGeneratorConfiguration('standard'),
      tags: ['integration', 'balanced', 'standard']
    });

    // Property Testing Preset
    this.registerPreset({
      name: 'property-testing',
      description: 'High-variation configuration for property-based testing',
      mockConfiguration: this.configGenerator.generateMockConfiguration({
        fieldCount: { min: 5, max: 20 },
        documentState: DocumentState.LOADED,
        validationComplexity: ComplexityLevel.HIGH,
        includeErrorScenarios: true,
        errorScenarioCount: 5
      }),
      generatorConfiguration: this.configGenerator.generateGeneratorConfiguration('comprehensive'),
      tags: ['property', 'comprehensive', 'high-variation']
    });

    // Error Testing Preset
    this.registerPreset({
      name: 'error-testing',
      description: 'Focused on error scenarios and edge cases',
      mockConfiguration: this.configGenerator.generateMockConfiguration({
        fieldCount: { min: 2, max: 8 },
        documentState: DocumentState.ERROR,
        validationComplexity: ComplexityLevel.HIGH,
        includeErrorScenarios: true,
        errorScenarioCount: 8
      }),
      generatorConfiguration: this.configGenerator.generateScenarioConfiguration('error-testing'),
      tags: ['error', 'edge-cases', 'validation']
    });

    // Performance Testing Preset
    this.registerPreset({
      name: 'performance-testing',
      description: 'Large-scale configuration for performance testing',
      mockConfiguration: this.configGenerator.generateMockConfiguration({
        fieldCount: { min: 20, max: 100 },
        documentState: DocumentState.LOADED,
        validationComplexity: ComplexityLevel.HIGH,
        includeErrorScenarios: false
      }),
      generatorConfiguration: this.configGenerator.generateScenarioConfiguration('performance-testing'),
      tags: ['performance', 'large-scale', 'stress']
    });

    // Standard Preset (default)
    this.registerPreset({
      name: 'standard',
      description: 'Default balanced configuration for general testing',
      mockConfiguration: this.configGenerator.generateMockConfiguration({
        fieldCount: { min: 3, max: 8 },
        documentState: DocumentState.LOADED,
        validationComplexity: ComplexityLevel.MEDIUM,
        includeErrorScenarios: true
      }),
      generatorConfiguration: this.configGenerator.generateGeneratorConfiguration('standard'),
      tags: ['default', 'balanced', 'general']
    });

    this.log('Default presets initialized', { count: this.presets.size });
  }

  private createBaseConfigurationForScenario(
    scenario: 'unit-testing' | 'integration-testing' | 'property-testing' | 'error-testing' | 'performance-testing',
    options?: {
      complexity?: ComplexityLevel;
      documentState?: DocumentState;
      fieldTypes?: FieldType[];
      errorTypes?: ErrorType[];
    }
  ): MockConfiguration {
    const preset = this.getPreset(scenario);
    if (preset) {
      return { ...preset.mockConfiguration };
    }

    // Fallback to generating configuration based on scenario
    const complexity = options?.complexity ?? ComplexityLevel.MEDIUM;
    const documentState = options?.documentState ?? DocumentState.LOADED;

    switch (scenario) {
      case 'unit-testing':
        return this.configGenerator.generateMockConfiguration({
          fieldCount: { min: 1, max: 3 },
          documentState,
          validationComplexity: ComplexityLevel.LOW,
          includeErrorScenarios: false
        });

      case 'integration-testing':
        return this.configGenerator.generateMockConfiguration({
          fieldCount: { min: 3, max: 10 },
          documentState,
          validationComplexity: complexity,
          includeErrorScenarios: true
        });

      case 'property-testing':
        return this.configGenerator.generateMockConfiguration({
          fieldCount: { min: 5, max: 20 },
          documentState,
          validationComplexity: ComplexityLevel.HIGH,
          includeErrorScenarios: true,
          errorScenarioCount: 5
        });

      case 'error-testing':
        return this.configGenerator.generateMockConfiguration({
          fieldCount: { min: 2, max: 8 },
          documentState: DocumentState.ERROR,
          validationComplexity: ComplexityLevel.HIGH,
          includeErrorScenarios: true,
          errorScenarioCount: 8
        });

      case 'performance-testing':
        return this.configGenerator.generateMockConfiguration({
          fieldCount: { min: 20, max: 100 },
          documentState,
          validationComplexity: ComplexityLevel.HIGH,
          includeErrorScenarios: false
        });

      default:
        return this.configGenerator.generateMockConfiguration({
          fieldCount: { min: 3, max: 8 },
          documentState,
          validationComplexity: complexity,
          includeErrorScenarios: true
        });
    }
  }

  private applyCustomOverrides(baseConfig: MockConfiguration, overrides?: Partial<MockConfiguration>): MockConfiguration {
    if (!overrides) {
      return baseConfig;
    }

    return {
      pdf: {
        ...baseConfig.pdf,
        ...overrides.pdf
      },
      crypto: {
        ...baseConfig.crypto,
        ...overrides.crypto
      },
      errorPatterns: {
        ...baseConfig.errorPatterns,
        ...overrides.errorPatterns
      }
    };
  }

  private validateConfiguration(config: MockConfiguration): void {
    // Validate PDF configuration
    if (!config.pdf.fields || config.pdf.fields.length === 0) {
      throw new Error('Mock configuration must have at least one field');
    }

    // Validate field definitions
    for (const field of config.pdf.fields) {
      if (!field.name || field.name.trim() === '') {
        throw new Error('All fields must have non-empty names');
      }
      if (!Object.values(FieldType).includes(field.type)) {
        throw new Error(`Invalid field type: ${field.type}`);
      }
    }

    // Validate crypto configuration
    if (!config.crypto.validationResults) {
      throw new Error('Crypto configuration must have validation results array');
    }

    if (!config.crypto.errorScenarios) {
      throw new Error('Crypto configuration must have error scenarios array');
    }

    // Validate error patterns
    if (!config.errorPatterns || typeof config.errorPatterns !== 'object') {
      throw new Error('Error patterns must be an object');
    }
  }

  private generateCacheKey(scenario: string, options?: any): string {
    return `${scenario}-${JSON.stringify(options || {})}`;
  }

  private getRandomComplexity(): ComplexityLevel {
    const complexities = Object.values(ComplexityLevel);
    return complexities[Math.floor(Math.random() * complexities.length)];
  }

  private getRandomDocumentState(): DocumentState {
    const states = [DocumentState.LOADED, DocumentState.MODIFIED, DocumentState.SIGNED];
    return states[Math.floor(Math.random() * states.length)];
  }

  private log(message: string, data?: any): void {
    if (this.options.logConfigurationChanges) {
      console.log(`[ConfigurationFactory] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
}

/**
 * Global configuration factory instance
 */
export const globalConfigurationFactory = new ConfigurationFactory({
  defaultPreset: 'standard',
  enableCaching: true,
  validateConfigurations: true,
  logConfigurationChanges: false
});

/**
 * Utility functions for common configuration operations
 */
export const ConfigurationFactoryUtils = {
  /**
   * Quick configuration creation for common scenarios
   */
  createQuickConfig: (scenario: 'unit' | 'integration' | 'property' | 'error' | 'performance') => {
    const scenarioMap = {
      'unit': 'unit-testing',
      'integration': 'integration-testing', 
      'property': 'property-testing',
      'error': 'error-testing',
      'performance': 'performance-testing'
    } as const;
    
    return globalConfigurationFactory.createConfiguration(scenarioMap[scenario] as any);
  },

  /**
   * Create test framework integration with default settings
   */
  createFrameworkIntegration: (framework: 'jest' | 'vitest' | 'mocha') =>
    globalConfigurationFactory.createTestFrameworkIntegration(framework, {
      autoReset: true,
      enableLogging: false,
      configurationPreset: 'standard'
    }),

  /**
   * Get preset by name
   */
  getPreset: (name: string) => globalConfigurationFactory.getPreset(name),

  /**
   * List all available presets
   */
  listPresets: () => globalConfigurationFactory.listPresets(),

  /**
   * Clear cache
   */
  clearCache: () => globalConfigurationFactory.clearCache(),

  /**
   * Get factory status
   */
  getStatus: () => globalConfigurationFactory.getStatus()
};