/**
 * HSM Integration Example
 * 
 * This example demonstrates how to use the Hardware Security Module (HSM) integration
 * with various cloud providers and PKCS#11 compatible devices.
 */

import {
    createHSMIntegrationManager,
    createHSMService,
    createDefaultHSMConfig,
    type HSMProvider,
    type HSMKeyReference,
} from '../src';

async function demonstrateHSMIntegration() {
    console.log('🔐 HSM Integration Example');
    console.log('==========================\n');

    // Create HSM integration manager
    const hsmManager = createHSMIntegrationManager();

    // Available HSM providers
    const providers: HSMProvider[] = ['google-cloud-hsm', 'aws-kms', 'azure-keyvault', 'pkcs11'];

    console.log('📋 Available HSM Providers:');
    providers.forEach(provider => {
        console.log(`  - ${provider}`);
    });
    console.log();

    // Register HSM providers
    console.log('🔧 Registering HSM Providers...');
    for (const provider of providers) {
        try {
            const service = createHSMService(provider);
            hsmManager.registerProvider(provider, service);
            console.log(`  ✅ Registered: ${provider}`);
        } catch (error) {
            console.log(`  ❌ Failed to register ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    console.log();

    // List registered providers
    const registeredProviders = hsmManager.getAvailableProviders();
    console.log('✅ Registered Providers:', registeredProviders);
    console.log();

    // Example: Google Cloud HSM Configuration
    console.log('☁️  Google Cloud HSM Configuration Example:');
    const googleCloudConfig = createDefaultHSMConfig('google-cloud-hsm', {
        googleCloudKeyPath: 'projects/my-project/locations/global/keyRings/my-ring/cryptoKeys/my-key/cryptoKeyVersions/1',
        googleApplicationCredentials: '/path/to/service-account.json',
    });
    console.log('  Configuration:', JSON.stringify(googleCloudConfig, null, 2));
    console.log();

    // Example: AWS KMS Configuration
    console.log('☁️  AWS KMS Configuration Example:');
    const awsConfig = createDefaultHSMConfig('aws-kms', {
        awsAccessKeyId: 'YOUR_ACCESS_KEY_ID',
        awsSecretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
        awsRegion: 'us-east-1',
    });
    console.log('  Configuration:', JSON.stringify(awsConfig, null, 2));
    console.log();

    // Example: Azure Key Vault Configuration
    console.log('☁️  Azure Key Vault Configuration Example:');
    const azureConfig = createDefaultHSMConfig('azure-keyvault', {
        vaultUrl: 'https://my-vault.vault.azure.net/',
        azureClientId: 'YOUR_CLIENT_ID',
        azureClientSecret: 'YOUR_CLIENT_SECRET',
        azureTenantId: 'YOUR_TENANT_ID',
    });
    console.log('  Configuration:', JSON.stringify(azureConfig, null, 2));
    console.log();

    // Example: PKCS#11 Configuration
    console.log('🔧 PKCS#11 HSM Configuration Example:');
    const pkcs11Config = createDefaultHSMConfig('pkcs11', {
        pkcs11LibraryPath: '/usr/lib/softhsm/libsofthsm2.so',
        pkcs11SlotId: 0,
        pkcs11Pin: 'YOUR_PIN',
    });
    console.log('  Configuration:', JSON.stringify(pkcs11Config, null, 2));
    console.log();

    // Example: Key Reference
    console.log('🔑 HSM Key Reference Examples:');

    const googleKeyRef: HSMKeyReference = {
        provider: 'google-cloud-hsm',
        keyId: 'my-signing-key',
        projectId: 'my-project',
        region: 'global',
        keyVersion: '1',
    };
    console.log('  Google Cloud:', JSON.stringify(googleKeyRef, null, 2));

    const awsKeyRef: HSMKeyReference = {
        provider: 'aws-kms',
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    };
    console.log('  AWS KMS:', JSON.stringify(awsKeyRef, null, 2));

    const azureKeyRef: HSMKeyReference = {
        provider: 'azure-keyvault',
        keyId: 'my-signing-key',
    };
    console.log('  Azure Key Vault:', JSON.stringify(azureKeyRef, null, 2));

    const pkcs11KeyRef: HSMKeyReference = {
        provider: 'pkcs11',
        keyId: 'my-hsm-key',
    };
    console.log('  PKCS#11:', JSON.stringify(pkcs11KeyRef, null, 2));
    console.log();

    console.log('📚 Usage Instructions:');
    console.log('1. Install the required dependencies for your HSM provider:');
    console.log('   - Google Cloud: npm install @google-cloud/kms');
    console.log('   - AWS KMS: npm install aws-sdk');
    console.log('   - Azure Key Vault: npm install @azure/keyvault-keys @azure/identity');
    console.log('   - PKCS#11: npm install pkcs11js');
    console.log();
    console.log('2. Configure your HSM credentials and connection details');
    console.log('3. Initialize the HSM service with your configuration');
    console.log('4. Use the HSM integration manager to sign documents');
    console.log();

    console.log('🔐 Example Signing Workflow:');
    console.log(`
    // Initialize HSM service
    const service = hsmManager.getProvider('google-cloud-hsm');
    await service.initialize(googleCloudConfig);

    // Sign document
    const document = Buffer.from('Document content to sign');
    const signature = await hsmManager.signWithHSM(
        document,
        googleKeyRef,
        certificate,
        googleCloudConfig
    );

    // Validate signature
    const validationResult = await hsmManager.validateHSMSignature(signature);
    console.log('Signature valid:', validationResult.isValid);
    `);

    console.log('✨ HSM Integration Ready!');
}

// Run the example
if (require.main === module) {
    demonstrateHSMIntegration().catch(console.error);
}

export { demonstrateHSMIntegration };