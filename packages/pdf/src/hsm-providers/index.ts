/**
 * HSM Provider Implementations
 * 
 * This module exports all available Hardware Security Module provider implementations
 * for integration with various cloud and on-premises HSM solutions.
 */

export { GoogleCloudHSMService } from './google-cloud-hsm';
export { AWSKMSService } from './aws-kms';
export { AzureKeyVaultService } from './azure-keyvault';
export { PKCS11HSMService } from './pkcs11-hsm';

// Re-export types for convenience
export type {
    HSMProvider,
    HSMService,
    HSMConfig,
    HSMKeyReference,
    HSMSigningRequest,
    HSMSigningResult,
    HSMKeyInfo,
    HSMCredentials,
    HSMIntegrationManager,
    SigningAlgorithm,
} from '../types';

// Re-export errors
export {
    HSMError,
    HSMConnectionError,
    HSMSigningError,
    HSMKeyNotFoundError,
    HSMAuthenticationError,
} from '../types';

// Re-export integration manager
export {
    HSMIntegrationManagerImpl,
    createHSMIntegrationManager,
    createDefaultHSMConfig,
} from '../hsm-integration-manager';

/**
 * Factory function to create HSM service instances
 */
export function createHSMService(provider: any): any {
    switch (provider) {
        case 'google-cloud-hsm':
            const { GoogleCloudHSMService } = require('./google-cloud-hsm');
            return new GoogleCloudHSMService();
        case 'aws-kms':
            const { AWSKMSService } = require('./aws-kms');
            return new AWSKMSService();
        case 'azure-keyvault':
            const { AzureKeyVaultService } = require('./azure-keyvault');
            return new AzureKeyVaultService();
        case 'pkcs11':
            const { PKCS11HSMService } = require('./pkcs11-hsm');
            return new PKCS11HSMService();
        default:
            throw new Error(`Unsupported HSM provider: ${provider}`);
    }
}

/**
 * Get all available HSM providers
 */
export function getAvailableHSMProviders(): any[] {
    return ['google-cloud-hsm', 'aws-kms', 'azure-keyvault', 'pkcs11'];
}

/**
 * Check if a provider is available (dependencies installed)
 */
export function isHSMProviderAvailable(provider: any): boolean {
    try {
        switch (provider) {
            case 'google-cloud-hsm':
                require('@google-cloud/kms');
                return true;
            case 'aws-kms':
                require('aws-sdk');
                return true;
            case 'azure-keyvault':
                require('@azure/keyvault-keys');
                require('@azure/identity');
                return true;
            case 'pkcs11':
                require('pkcs11js');
                return true;
            default:
                return false;
        }
    } catch (error) {
        return false;
    }
}

/**
 * Create a fully configured HSM integration manager with all providers
 */
export function createFullHSMIntegrationManager(): any {
    const manager = new (require('../hsm-integration-manager').HSMIntegrationManagerImpl)();

    // Register all available providers
    const providers = getAvailableHSMProviders();
    providers.forEach(provider => {
        if (isHSMProviderAvailable(provider)) {
            try {
                const service = createHSMService(provider);
                manager.registerProvider(provider, service);
            } catch (error) {
                // Skip providers that can't be instantiated
                console.warn(`Failed to register HSM provider ${provider}:`, error);
            }
        }
    });

    return manager;
}