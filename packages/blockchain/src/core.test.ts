import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import {
    BlockchainManager,
    BlockchainConfigManager,
    BlockchainNetwork,
    BlockchainError,
    generateDocumentHash,
    validateCryptoAddress,
    validateDocumentHash
} from './utils';
import {
    DocumentHashSchema,
    BlockchainAuditEventSchema,
    SmartContractSchema,
    CryptocurrencyPaymentSchema,
    BlockchainConfigSchema
} from './types';

describe('Blockchain Core Functionality', () => {
    let manager: BlockchainManager;
    let configManager: BlockchainConfigManager;

    beforeEach(() => {
        // Create test configuration
        const testEnv = {
            ETHEREUM_RPC_URL: 'http://localhost:8545',
            ETHEREUM_PRIVATE_KEY: '0x' + '0'.repeat(64),
            SOLANA_RPC_URL: 'http://localhost:8899',
            SOLANA_PRIVATE_KEY: '0'.repeat(128),
            BLOCKCHAIN_ENABLED: 'true'
        };

        configManager = new BlockchainConfigManager(testEnv);
        manager = new BlockchainManager(BlockchainNetwork.ETHEREUM);
    });

    describe('Configuration Management', () => {
        it('should parse environment configuration correctly', () => {
            const config = configManager.getConfig(BlockchainNetwork.ETHEREUM);
            expect(config).toBeDefined();
            expect(config?.network).toBe(BlockchainNetwork.ETHEREUM);
            expect(config?.rpcUrl).toBe('http://localhost:8545');
        });

        it('should validate configuration schemas', () => {
            const isValid = configManager.validateConfig(BlockchainNetwork.ETHEREUM);
            expect(isValid).toBe(true);
        });

        it('should return enabled networks', () => {
            const enabledNetworks = configManager.getEnabledNetworks();
            expect(enabledNetworks).toContain(BlockchainNetwork.ETHEREUM);
            expect(enabledNetworks).toContain(BlockchainNetwork.SOLANA);
        });
    });

    describe('Schema Validation', () => {
        it('should validate document hash schema', () => {
            const validDocumentHash = {
                documentId: '123e4567-e89b-12d3-a456-426614174000',
                hash: 'a'.repeat(64), // Valid SHA-256 hash
                blockchainNetwork: BlockchainNetwork.ETHEREUM,
                transactionHash: '0x' + 'a'.repeat(64),
                timestamp: new Date()
            };

            const result = DocumentHashSchema.safeParse(validDocumentHash);
            expect(result.success).toBe(true);
        });

        it('should validate blockchain audit event schema', () => {
            const validAuditEvent = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                eventType: 'DOCUMENT_CREATED' as const,
                documentId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174000',
                organizationId: '123e4567-e89b-12d3-a456-426614174000',
                eventData: { action: 'create' },
                currentHash: 'a'.repeat(64),
                blockchainNetwork: BlockchainNetwork.ETHEREUM,
                transactionHash: '0x' + 'a'.repeat(64),
                timestamp: new Date(),
                signature: 'signature123'
            };

            const result = BlockchainAuditEventSchema.safeParse(validAuditEvent);
            expect(result.success).toBe(true);
        });

        it('should validate smart contract schema', () => {
            const validSmartContract = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Contract',
                contractAddress: '0x' + 'a'.repeat(40),
                abi: [],
                network: BlockchainNetwork.ETHEREUM,
                deploymentTxHash: '0x' + 'a'.repeat(64),
                createdAt: new Date(),
                isActive: true
            };

            const result = SmartContractSchema.safeParse(validSmartContract);
            expect(result.success).toBe(true);
        });

        it('should validate cryptocurrency payment schema', () => {
            const validPayment = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                paymentId: 'pay-123',
                currency: 'ETH' as const,
                amount: '0.1',
                fromAddress: '0x' + 'a'.repeat(40),
                toAddress: '0x' + 'b'.repeat(40),
                transactionHash: '0x' + 'c'.repeat(64),
                network: BlockchainNetwork.ETHEREUM,
                status: 'CONFIRMED' as const,
                confirmations: 1,
                requiredConfirmations: 6,
                timestamp: new Date()
            };

            const result = CryptocurrencyPaymentSchema.safeParse(validPayment);
            expect(result.success).toBe(true);
        });

        it('should validate blockchain config schema', () => {
            const validConfig = {
                network: BlockchainNetwork.ETHEREUM,
                rpcUrl: 'http://localhost:8545',
                gasLimit: 21000,
                confirmations: 6,
                enabled: true
            };

            const result = BlockchainConfigSchema.safeParse(validConfig);
            expect(result.success).toBe(true);
        });
    });

    describe('Document Hash Operations', () => {
        it('should generate valid document hashes', () => {
            const content = 'Test document content';
            const hash = generateDocumentHash(content, 'sha256');

            expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
            expect(validateDocumentHash(hash)).toBe(true);
        });

        it('should generate consistent hashes for same content', () => {
            const content = 'Test document content';
            const hash1 = generateDocumentHash(content, 'sha256');
            const hash2 = generateDocumentHash(content, 'sha256');

            expect(hash1).toBe(hash2);
        });

        /**
         * **Feature: docusign-alternative-comprehensive, Property 54: Advanced Security Effectiveness**
         * **Validates: Requirements 11.4**
         */
        it('should maintain hash integrity across operations', () => {
            fc.assert(fc.property(
                fc.string({ minLength: 1, maxLength: 1000 }),
                (content) => {
                    const hash = generateDocumentHash(content, 'sha256');

                    // Hash should be valid
                    expect(validateDocumentHash(hash)).toBe(true);

                    // Hash should be deterministic
                    const hash2 = generateDocumentHash(content, 'sha256');
                    expect(hash).toBe(hash2);

                    // Different content should produce different hashes
                    const differentContent = content + 'x';
                    const differentHash = generateDocumentHash(differentContent, 'sha256');
                    expect(hash).not.toBe(differentHash);

                    return true;
                }
            ), { numRuns: 100 });
        });
    });

    describe('Cryptocurrency Address Validation', () => {
        it('should validate Ethereum addresses correctly', () => {
            const validEthAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
            const invalidEthAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b';

            expect(validateCryptoAddress(validEthAddress, BlockchainNetwork.ETHEREUM)).toBe(true);
            expect(validateCryptoAddress(invalidEthAddress, BlockchainNetwork.ETHEREUM)).toBe(false);
        });

        it('should validate Solana addresses correctly', () => {
            const validSolAddress = 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1';
            const invalidSolAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';

            expect(validateCryptoAddress(validSolAddress, BlockchainNetwork.SOLANA)).toBe(true);
            expect(validateCryptoAddress(invalidSolAddress, BlockchainNetwork.SOLANA)).toBe(false);
        });

        /**
         * **Feature: docusign-alternative-comprehensive, Property 54: Advanced Security Effectiveness**
         * **Validates: Requirements 11.4**
         */
        it('should validate addresses for all supported networks', () => {
            fc.assert(fc.property(
                fc.constantFrom(...Object.values(BlockchainNetwork)),
                fc.string({ minLength: 20, maxLength: 60 }),
                (network, address) => {
                    // Validation should not throw errors
                    const isValid = validateCryptoAddress(address, network);
                    expect(typeof isValid).toBe('boolean');

                    return true;
                }
            ), { numRuns: 100 });
        });
    });

    describe('Manager Operations', () => {
        it('should handle missing providers gracefully', () => {
            const provider = manager.getProvider(BlockchainNetwork.BITCOIN);
            expect(provider).toBeNull();
        });

        it('should throw appropriate errors for invalid operations', async () => {
            // Test with no providers
            await expect(
                manager.storeDocumentHash('doc-123', 'hash123')
            ).rejects.toThrow(BlockchainError);
        });

        it('should get connected networks', () => {
            const networks = manager.getConnectedNetworks();
            expect(Array.isArray(networks)).toBe(true);
        });
    });

    describe('Audit Trail Hash Chain', () => {
        /**
         * **Feature: docusign-alternative-comprehensive, Property 54: Advanced Security Effectiveness**
         * **Validates: Requirements 11.4**
         */
        it('should maintain audit trail integrity', () => {
            fc.assert(fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    eventType: fc.constantFrom('DOCUMENT_CREATED', 'DOCUMENT_SIGNED', 'DOCUMENT_MODIFIED'),
                    documentId: fc.uuid(),
                    userId: fc.uuid(),
                    organizationId: fc.uuid(),
                    eventData: fc.object()
                }), { minLength: 1, maxLength: 10 }),
                (events) => {
                    // Simulate hash chain creation
                    let previousHash = '';
                    const processedEvents = events.map(event => {
                        const eventDataStr = JSON.stringify(event.eventData);
                        const hashInput = `${event.id}:${event.documentId}:${event.eventType}:${eventDataStr}:${previousHash}`;
                        const currentHash = generateDocumentHash(hashInput, 'sha256');

                        const processedEvent = {
                            ...event,
                            previousHash,
                            currentHash,
                            timestamp: new Date()
                        };

                        previousHash = currentHash;
                        return processedEvent;
                    });

                    // Verify hash chain integrity
                    let prevHash = '';
                    for (const event of processedEvents) {
                        expect(event.previousHash).toBe(prevHash);
                        expect(validateDocumentHash(event.currentHash)).toBe(true);
                        prevHash = event.currentHash;
                    }

                    return true;
                }
            ), { numRuns: 50 });
        });
    });

    describe('Configuration Validation', () => {
        it('should create test configurations', () => {
            const testConfig = BlockchainConfigManager.createTestConfig(BlockchainNetwork.ETHEREUM);
            expect(testConfig.network).toBe(BlockchainNetwork.ETHEREUM);
            expect(testConfig.enabled).toBe(true);
        });

        it('should create production configurations', () => {
            const prodConfig = BlockchainConfigManager.createProductionConfig(
                BlockchainNetwork.ETHEREUM,
                { privateKey: '0x123' }
            );
            expect(prodConfig.network).toBe(BlockchainNetwork.ETHEREUM);
            expect(prodConfig.privateKey).toBe('0x123');
        });

        it('should validate all configurations', () => {
            const results = configManager.validateAllConfigs();
            expect(typeof results).toBe('object');
        });
    });
});