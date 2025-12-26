// Main exports for the blockchain package
export * from './types';
export * from './manager';
export * from './config';

// Utility functions
export {
    generateDocumentHash,
    validateCryptoAddress,
    validateDocumentHash,
    createBlockchainManager,
    initializeBlockchainProviders
} from './utils';

// Provider exports (conditional to avoid dependency issues in tests)
export type { IBlockchainProvider } from './types';

// Re-export commonly used types for convenience
export type {
    IBlockchainManager,
    DocumentHash,
    BlockchainAuditEvent,
    SmartContract,
    CryptocurrencyPayment,
    BlockchainConfig
} from './types';