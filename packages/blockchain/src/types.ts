import { z } from 'zod';

// Blockchain Network Types
export enum BlockchainNetwork {
    ETHEREUM = 'ethereum',
    POLYGON = 'polygon',
    SOLANA = 'solana',
    BITCOIN = 'bitcoin',
    BINANCE_SMART_CHAIN = 'bsc',
    AVALANCHE = 'avalanche'
}

// Document Hash Storage Schema
export const DocumentHashSchema = z.object({
    documentId: z.string().uuid(),
    hash: z.string().min(64).max(128), // SHA-256 or SHA-512 hash
    blockchainNetwork: z.nativeEnum(BlockchainNetwork),
    transactionHash: z.string(),
    blockNumber: z.number().optional(),
    timestamp: z.date(),
    gasUsed: z.number().optional(),
    metadata: z.record(z.any()).optional()
});

export type DocumentHash = z.infer<typeof DocumentHashSchema>;

// Audit Trail Schema
export const BlockchainAuditEventSchema = z.object({
    id: z.string().uuid(),
    eventType: z.enum(['DOCUMENT_CREATED', 'DOCUMENT_SIGNED', 'DOCUMENT_MODIFIED', 'WORKFLOW_COMPLETED']),
    documentId: z.string().uuid(),
    userId: z.string().uuid(),
    organizationId: z.string().uuid(),
    eventData: z.record(z.any()),
    previousHash: z.string().optional(),
    currentHash: z.string(),
    blockchainNetwork: z.nativeEnum(BlockchainNetwork),
    transactionHash: z.string(),
    blockNumber: z.number().optional(),
    timestamp: z.date(),
    signature: z.string() // Cryptographic signature
});

export type BlockchainAuditEvent = z.infer<typeof BlockchainAuditEventSchema>;

// Smart Contract Schema
export const SmartContractSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    contractAddress: z.string(),
    abi: z.array(z.any()),
    bytecode: z.string().optional(),
    network: z.nativeEnum(BlockchainNetwork),
    deploymentTxHash: z.string(),
    createdAt: z.date(),
    isActive: z.boolean().default(true)
});

export type SmartContract = z.infer<typeof SmartContractSchema>;

// Cryptocurrency Payment Schema
export const CryptocurrencyPaymentSchema = z.object({
    id: z.string().uuid(),
    paymentId: z.string(),
    currency: z.enum(['BTC', 'ETH', 'USDC', 'USDT', 'SOL', 'MATIC', 'BNB', 'AVAX']),
    amount: z.string(), // Use string for precise decimal handling
    fromAddress: z.string(),
    toAddress: z.string(),
    transactionHash: z.string(),
    network: z.nativeEnum(BlockchainNetwork),
    status: z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED']),
    confirmations: z.number().default(0),
    requiredConfirmations: z.number().default(6),
    gasPrice: z.string().optional(),
    gasUsed: z.number().optional(),
    blockNumber: z.number().optional(),
    timestamp: z.date(),
    metadata: z.record(z.any()).optional()
});

export type CryptocurrencyPayment = z.infer<typeof CryptocurrencyPaymentSchema>;

// Blockchain Configuration
export const BlockchainConfigSchema = z.object({
    network: z.nativeEnum(BlockchainNetwork),
    rpcUrl: z.string().url(),
    privateKey: z.string().optional(),
    contractAddress: z.string().optional(),
    gasLimit: z.number().default(21000),
    gasPrice: z.string().optional(),
    confirmations: z.number().default(6),
    enabled: z.boolean().default(true)
});

export type BlockchainConfig = z.infer<typeof BlockchainConfigSchema>;

// Interfaces
export interface IBlockchainProvider {
    network: BlockchainNetwork;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    storeDocumentHash(documentId: string, hash: string, metadata?: Record<string, any>): Promise<DocumentHash>;
    getDocumentHash(documentId: string): Promise<DocumentHash | null>;
    createAuditEvent(event: Omit<BlockchainAuditEvent, 'transactionHash' | 'blockNumber'>): Promise<BlockchainAuditEvent>;
    getAuditTrail(documentId: string): Promise<BlockchainAuditEvent[]>;
    deploySmartContract(contract: Omit<SmartContract, 'id' | 'contractAddress' | 'deploymentTxHash' | 'createdAt'>): Promise<SmartContract>;
    executeSmartContract(contractAddress: string, method: string, params: any[]): Promise<any>;
    processPayment(payment: Omit<CryptocurrencyPayment, 'id' | 'transactionHash' | 'status' | 'timestamp'>): Promise<CryptocurrencyPayment>;
    getPaymentStatus(paymentId: string): Promise<CryptocurrencyPayment | null>;
}

export interface IBlockchainManager {
    addProvider(provider: IBlockchainProvider): void;
    getProvider(network: BlockchainNetwork): IBlockchainProvider | null;
    storeDocumentHash(documentId: string, hash: string, network?: BlockchainNetwork): Promise<DocumentHash>;
    createImmutableAuditEvent(event: Omit<BlockchainAuditEvent, 'transactionHash' | 'blockNumber' | 'currentHash' | 'signature'>): Promise<BlockchainAuditEvent>;
    verifyAuditTrail(documentId: string): Promise<boolean>;
    deployWorkflowContract(workflow: any, network?: BlockchainNetwork): Promise<SmartContract>;
    executeWorkflowStep(contractAddress: string, step: string, data: any): Promise<any>;
    processPayment(payment: Omit<CryptocurrencyPayment, 'id' | 'transactionHash' | 'status' | 'timestamp'>): Promise<CryptocurrencyPayment>;
    getPaymentHistory(organizationId: string): Promise<CryptocurrencyPayment[]>;
}

// Error Types
export class BlockchainError extends Error {
    constructor(
        message: string,
        public code: string,
        public network?: BlockchainNetwork,
        public transactionHash?: string
    ) {
        super(message);
        this.name = 'BlockchainError';
    }
}

export class SmartContractError extends BlockchainError {
    constructor(
        message: string,
        public contractAddress: string,
        public method?: string,
        network?: BlockchainNetwork
    ) {
        super(message, 'SMART_CONTRACT_ERROR', network);
        this.name = 'SmartContractError';
    }
}

export class PaymentError extends BlockchainError {
    constructor(
        message: string,
        public paymentId: string,
        network?: BlockchainNetwork
    ) {
        super(message, 'PAYMENT_ERROR', network);
        this.name = 'PaymentError';
    }
}