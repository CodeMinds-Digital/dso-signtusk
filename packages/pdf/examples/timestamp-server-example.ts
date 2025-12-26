/**
 * Example usage of Timestamp Server Integration
 * 
 * This example demonstrates how to use the RFC 3161 compliant timestamp server integration
 * for adding trusted timestamps to documents and signatures.
 */

import {
    createTimestampServerManager,
    TSAConfig,
    TSAFailoverConfig,
    TimestampRequestOptions,
    TimestampServerManager,
    CMSSignature
} from '../src';

async function timestampServerExample() {
    console.log('🕒 Timestamp Server Integration Example');
    console.log('=====================================\n');

    // Create timestamp server manager
    const timestampManager = createTimestampServerManager();

    // Example document data
    const documentData = Buffer.from('This is a test document that needs to be timestamped for legal compliance.');

    try {
        // 1. Basic Timestamp Request
        console.log('1. Creating RFC 3161 compliant timestamp request...');

        const basicOptions: TimestampRequestOptions = {
            hashAlgorithm: 'SHA-256',
            includeNonce: true,
            requestCertificate: true,
            policy: '1.2.3.4.5.6.7.8.9' // Example policy OID
        };

        const timestampRequest = await timestampManager.createTimestampRequest(documentData, basicOptions);

        console.log('✅ Timestamp request created successfully');
        console.log(`   - Hash Algorithm: ${timestampRequest.messageImprint.hashAlgorithm}`);
        console.log(`   - Message Hash Length: ${timestampRequest.messageImprint.hashedMessage.length} bytes`);
        console.log(`   - Nonce Included: ${timestampRequest.nonce ? 'Yes' : 'No'}`);
        console.log(`   - Certificate Requested: ${timestampRequest.certReq ? 'Yes' : 'No'}`);
        console.log(`   - Policy: ${timestampRequest.reqPolicy || 'None'}\n`);

        // 2. Single TSA Configuration
        console.log('2. Configuring single TSA server...');

        const tsaConfig: TSAConfig = {
            url: 'http://timestamp.digicert.com',
            timeout: 30000,
            retryAttempts: 3,
            requireNonce: true,
            hashAlgorithm: 'SHA-256'
        };

        console.log('✅ TSA configuration created');
        console.log(`   - URL: ${tsaConfig.url}`);
        console.log(`   - Timeout: ${tsaConfig.timeout}ms`);
        console.log(`   - Retry Attempts: ${tsaConfig.retryAttempts}\n`);

        // 3. Failover TSA Configuration
        console.log('3. Configuring TSA failover setup...');

        const failoverConfig: TSAFailoverConfig = {
            primary: {
                url: 'http://timestamp.digicert.com',
                timeout: 15000,
                retryAttempts: 2
            },
            fallbacks: [
                {
                    url: 'http://timestamp.sectigo.com',
                    timeout: 15000,
                    retryAttempts: 2
                },
                {
                    url: 'http://timestamp.globalsign.com',
                    timeout: 15000,
                    retryAttempts: 2
                }
            ],
            maxFailoverAttempts: 3,
            failoverTimeout: 45000
        };

        console.log('✅ Failover configuration created');
        console.log(`   - Primary TSA: ${failoverConfig.primary.url}`);
        console.log(`   - Fallback TSAs: ${failoverConfig.fallbacks.length}`);
        console.log(`   - Max Failover Attempts: ${failoverConfig.maxFailoverAttempts}\n`);

        // 4. Demonstrate timestamp request (will fail with real servers due to network)
        console.log('4. Demonstrating timestamp request process...');

        try {
            // This would normally succeed with a real TSA server
            const response = await timestampManager.requestTimestamp(timestampRequest, tsaConfig);
            console.log('✅ Timestamp response received');
            console.log(`   - Status: ${response.status.status}`);
            console.log(`   - Has Token: ${response.timeStampToken ? 'Yes' : 'No'}`);
        } catch (error) {
            console.log('⚠️  Timestamp request failed (expected in example)');
            console.log(`   - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.log('   - This is normal for the example as we\'re not connecting to real TSA servers\n');
        }

        // 5. Demonstrate failover mechanism
        console.log('5. Demonstrating failover mechanism...');

        try {
            const failoverResponse = await timestampManager.requestTimestampWithFailover(timestampRequest, failoverConfig);
            console.log('✅ Failover timestamp response received');
        } catch (error) {
            console.log('⚠️  All TSA servers failed (expected in example)');
            console.log(`   - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.log('   - Failover mechanism attempted all configured servers\n');
        }

        // 6. Demonstrate timestamp verification
        console.log('6. Demonstrating timestamp verification...');

        // Create a mock timestamp response for verification demo
        const mockResponse = createMockTimestampResponse(documentData);

        try {
            const verificationResult = await timestampManager.verifyTimestampResponse(mockResponse, documentData);
            console.log('✅ Timestamp verification completed');
            console.log(`   - Valid: ${verificationResult.isValid}`);
            console.log(`   - Timestamp: ${verificationResult.timestamp.toISOString()}`);
            console.log(`   - Errors: ${verificationResult.errors.length}`);
            console.log(`   - Warnings: ${verificationResult.warnings.length}\n`);
        } catch (error) {
            console.log('⚠️  Timestamp verification failed');
            console.log(`   - Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }

        // 7. Demonstrate audit trail generation
        console.log('7. Demonstrating audit trail generation...');

        const operation = {
            type: 'REQUEST' as const,
            documentHash: require('node:crypto').createHash('sha256').update(documentData).digest('hex'),
            tsaUrl: tsaConfig.url,
            timestamp: new Date(),
            userId: 'user-123',
            organizationId: 'org-456',
            metadata: {
                documentName: 'example-document.pdf',
                requestId: 'req-789'
            }
        };

        const mockVerificationResult = {
            isValid: true,
            timestamp: new Date(),
            tsaUrl: tsaConfig.url,
            certificate: {} as any,
            messageImprint: timestampRequest.messageImprint,
            errors: [],
            warnings: []
        };

        const auditEntry = await timestampManager.generateTimestampAuditTrail(operation, mockVerificationResult);

        console.log('✅ Audit trail entry generated');
        console.log(`   - Entry ID: ${auditEntry.id}`);
        console.log(`   - Operation Type: ${auditEntry.operation.type}`);
        console.log(`   - Success: ${auditEntry.success}`);
        console.log(`   - Created At: ${auditEntry.createdAt.toISOString()}\n`);

        // 8. Demonstrate signature timestamping
        console.log('8. Demonstrating signature timestamping...');

        const mockSignature = createMockCMSSignature();

        try {
            const timestampedSignature = await timestampManager.addTimestampToSignature(mockSignature, tsaConfig);
            console.log('✅ Timestamp added to signature');
            console.log(`   - Original unsigned attributes: ${mockSignature.signerInfo.unsignedAttributes.length}`);
            console.log(`   - Updated unsigned attributes: ${timestampedSignature.signerInfo.unsignedAttributes.length}`);
            console.log(`   - Has timestamp: ${timestampedSignature.timestamp ? 'Yes' : 'No'}\n`);
        } catch (error) {
            console.log('⚠️  Signature timestamping failed (expected in example)');
            console.log(`   - Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }

        // 9. Show audit trail
        console.log('9. Reviewing audit trail...');

        const auditTrail = timestampManager.getAuditTrail();
        console.log(`✅ Audit trail contains ${auditTrail.length} entries`);

        auditTrail.forEach((entry, index) => {
            console.log(`   Entry ${index + 1}:`);
            console.log(`     - ID: ${entry.id}`);
            console.log(`     - Operation: ${entry.operation.type}`);
            console.log(`     - Success: ${entry.success}`);
            console.log(`     - Created: ${entry.createdAt.toISOString()}`);
        });

        console.log('\n🎉 Timestamp Server Integration example completed successfully!');
        console.log('\nKey Features Demonstrated:');
        console.log('- RFC 3161 compliant timestamp request generation');
        console.log('- Multiple TSA server support with failover');
        console.log('- Timestamp response validation and verification');
        console.log('- Signature timestamping integration');
        console.log('- Comprehensive audit trail generation');
        console.log('- Error handling and retry mechanisms');

    } catch (error) {
        console.error('❌ Example failed:', error);
    }
}

// Helper functions for creating mock data

function createMockTimestampResponse(data: Buffer) {
    const crypto = require('node:crypto');

    return {
        status: {
            status: 0 // TSAStatusCode.GRANTED
        },
        timeStampToken: {
            contentInfo: {
                contentType: '1.2.840.113549.1.7.2',
                content: Buffer.alloc(100)
            },
            timeStampInfo: {
                version: 1,
                policy: '1.2.3.4.5.6.7.8.9',
                messageImprint: {
                    hashAlgorithm: '2.16.840.1.101.3.4.2.1',
                    hashedMessage: crypto.createHash('sha256').update(data).digest()
                },
                serialNumber: Buffer.from('123456789abcdef', 'hex'),
                genTime: new Date(),
                accuracy: {
                    seconds: 1,
                    millis: 500
                }
            },
            certificates: [{
                subject: {
                    commonName: 'Example TSA',
                    organizationName: 'Example Organization',
                    countryName: 'US'
                },
                issuer: {
                    commonName: 'Example CA',
                    organizationName: 'Example Organization',
                    countryName: 'US'
                },
                serialNumber: '987654321',
                notBefore: new Date('2020-01-01'),
                notAfter: new Date('2030-01-01'),
                publicKey: {
                    algorithm: 'RSA',
                    keySize: 2048,
                    raw: Buffer.alloc(256)
                },
                fingerprint: crypto.randomBytes(20).toString('hex'),
                extensions: [],
                raw: Buffer.alloc(1000)
            }]
        }
    };
}

function createMockCMSSignature(): CMSSignature {
    const crypto = require('node:crypto');

    const certificate = {
        subject: {
            commonName: 'Test Signer',
            organizationName: 'Test Organization',
            countryName: 'US'
        },
        issuer: {
            commonName: 'Test CA',
            organizationName: 'Test Organization',
            countryName: 'US'
        },
        serialNumber: '123456789',
        notBefore: new Date('2020-01-01'),
        notAfter: new Date('2030-01-01'),
        publicKey: {
            algorithm: 'RSA',
            keySize: 2048,
            raw: Buffer.alloc(256)
        },
        fingerprint: crypto.randomBytes(20).toString('hex'),
        extensions: [],
        raw: Buffer.alloc(1000)
    };

    return {
        signerInfo: {
            certificate,
            signedAttributes: [],
            unsignedAttributes: [],
            signatureAlgorithm: 'RSA-SHA256',
            signature: Buffer.alloc(256)
        },
        certificates: [certificate],
        content: Buffer.from('test document content'),
        signature: Buffer.alloc(256),
        raw: Buffer.alloc(1000)
    };
}

// Run the example if this file is executed directly
if (require.main === module) {
    timestampServerExample().catch(console.error);
}

export { timestampServerExample };