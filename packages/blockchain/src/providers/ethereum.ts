// Optional blockchain provider imports - only import if available
let ethers: any;
try {
    ethers = require('ethers');
} catch (e) {
    // ethers not available - Ethereum provider will be disabled
}
import { createHash } from 'node:crypto';
import {
    IBlockchainProvider,
    BlockchainNetwork,
    DocumentHash,
    BlockchainAuditEvent,
    SmartContract,
    CryptocurrencyPayment,
    BlockchainError,
    SmartContractError,
    PaymentError,
    BlockchainConfig
} from '../types';

export class EthereumProvider implements IBlockchainProvider {
    public readonly network = BlockchainNetwork.ETHEREUM;
    private provider: any = null;
    private wallet: any = null;
    private documentStorageContract: any = null;
    private auditContract: any = null;

    constructor(private config: BlockchainConfig) {
        if (!ethers) {
            throw new BlockchainError('ethers package not available - install ethers to use Ethereum provider', 'DEPENDENCY_MISSING');
        }
        if (config.network !== BlockchainNetwork.ETHEREUM) {
            throw new BlockchainError('Invalid network for Ethereum provider', 'INVALID_NETWORK');
        }
    }

    async connect(): Promise<void> {
        try {
            this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

            if (this.config.privateKey) {
                this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
            }

            // Initialize contracts if addresses are provided
            if (this.config.contractAddress && this.wallet) {
                await this.initializeContracts();
            }
        } catch (error) {
            throw new BlockchainError(
                `Failed to connect to Ethereum: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'CONNECTION_ERROR',
                this.network
            );
        }
    }

    async disconnect(): Promise<void> {
        this.provider = null;
        this.wallet = null;
        this.documentStorageContract = null;
        this.auditContract = null;
    }

    isConnected(): boolean {
        return this.provider !== null;
    }

    private async initializeContracts(): Promise<void> {
        if (!this.wallet || !this.config.contractAddress) return;

        // Document Storage Contract ABI (simplified)
        const documentStorageABI = [
            "function storeDocumentHash(string memory documentId, string memory hash, string memory metadata) public returns (bool)",
            "function getDocumentHash(string memory documentId) public view returns (string memory, uint256, string memory)",
            "event DocumentStored(string indexed documentId, string hash, uint256 timestamp)"
        ];

        // Audit Trail Contract ABI (simplified)
        const auditTrailABI = [
            "function addAuditEvent(string memory eventId, string memory documentId, string memory eventType, string memory eventData, string memory previousHash, string memory currentHash) public returns (bool)",
            "function getAuditEvents(string memory documentId) public view returns (tuple(string eventId, string eventType, string eventData, string currentHash, uint256 timestamp)[])",
            "event AuditEventAdded(string indexed documentId, string indexed eventId, string eventType, uint256 timestamp)"
        ];

        this.documentStorageContract = new ethers.Contract(
            this.config.contractAddress,
            documentStorageABI,
            this.wallet
        );

        // For simplicity, using same contract address for audit trail
        // In production, these would be separate contracts
        this.auditContract = new ethers.Contract(
            this.config.contractAddress,
            auditTrailABI,
            this.wallet
        );
    }

    async storeDocumentHash(
        documentId: string,
        hash: string,
        metadata?: Record<string, any>
    ): Promise<DocumentHash> {
        if (!this.isConnected() || !this.wallet) {
            throw new BlockchainError('Not connected to Ethereum network', 'NOT_CONNECTED', this.network);
        }

        try {
            if (!this.documentStorageContract) {
                // Fallback: create a simple transaction with data
                const data = ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify({ documentId, hash, metadata })));
                const tx = await this.wallet.sendTransaction({
                    to: this.config.contractAddress || ethers.ZeroAddress,
                    data,
                    gasLimit: this.config.gasLimit,
                    gasPrice: this.config.gasPrice ? ethers.parseUnits(this.config.gasPrice, 'gwei') : undefined
                });

                const receipt = await tx.wait();
                if (!receipt) {
                    throw new BlockchainError('Transaction failed', 'TRANSACTION_FAILED', this.network);
                }

                return {
                    documentId,
                    hash,
                    blockchainNetwork: this.network,
                    transactionHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    timestamp: new Date(),
                    gasUsed: Number(receipt.gasUsed),
                    metadata
                };
            }

            // Use smart contract
            const metadataStr = metadata ? JSON.stringify(metadata) : '';
            const tx = await this.documentStorageContract.storeDocumentHash(documentId, hash, metadataStr);
            const receipt = await tx.wait();

            return {
                documentId,
                hash,
                blockchainNetwork: this.network,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                timestamp: new Date(),
                gasUsed: Number(receipt.gasUsed),
                metadata
            };
        } catch (error) {
            throw new BlockchainError(
                `Failed to store document hash: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'STORAGE_ERROR',
                this.network
            );
        }
    }

    async getDocumentHash(documentId: string): Promise<DocumentHash | null> {
        if (!this.isConnected() || !this.documentStorageContract) {
            throw new BlockchainError('Not connected or contract not initialized', 'NOT_CONNECTED', this.network);
        }

        try {
            const result = await this.documentStorageContract.getDocumentHash(documentId);
            if (!result || result[0] === '') {
                return null;
            }

            return {
                documentId,
                hash: result[0],
                blockchainNetwork: this.network,
                transactionHash: '', // Would need to be stored separately or retrieved from events
                timestamp: new Date(Number(result[1]) * 1000),
                metadata: result[2] ? JSON.parse(result[2]) : undefined
            };
        } catch (error) {
            throw new BlockchainError(
                `Failed to get document hash: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'RETRIEVAL_ERROR',
                this.network
            );
        }
    }

    async createAuditEvent(
        event: Omit<BlockchainAuditEvent, 'transactionHash' | 'blockNumber'>
    ): Promise<BlockchainAuditEvent> {
        if (!this.isConnected() || !this.wallet) {
            throw new BlockchainError('Not connected to Ethereum network', 'NOT_CONNECTED', this.network);
        }

        try {
            // Create cryptographic signature
            const eventDataStr = JSON.stringify(event.eventData);
            const message = `${event.id}:${event.documentId}:${event.eventType}:${eventDataStr}:${event.previousHash || ''}`;
            const signature = await this.wallet.signMessage(message);

            if (!this.auditContract) {
                // Fallback: create transaction with audit data
                const auditData = {
                    ...event,
                    signature,
                    message
                };
                const data = ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify(auditData)));
                const tx = await this.wallet.sendTransaction({
                    to: this.config.contractAddress || ethers.ZeroAddress,
                    data,
                    gasLimit: this.config.gasLimit,
                    gasPrice: this.config.gasPrice ? ethers.parseUnits(this.config.gasPrice, 'gwei') : undefined
                });

                const receipt = await tx.wait();
                if (!receipt) {
                    throw new BlockchainError('Audit transaction failed', 'TRANSACTION_FAILED', this.network);
                }

                return {
                    ...event,
                    transactionHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    signature
                };
            }

            // Use smart contract
            const tx = await this.auditContract.addAuditEvent(
                event.id,
                event.documentId,
                event.eventType,
                eventDataStr,
                event.previousHash || '',
                event.currentHash
            );
            const receipt = await tx.wait();

            return {
                ...event,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                signature
            };
        } catch (error) {
            throw new BlockchainError(
                `Failed to create audit event: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'AUDIT_ERROR',
                this.network
            );
        }
    }

    async getAuditTrail(documentId: string): Promise<BlockchainAuditEvent[]> {
        if (!this.isConnected() || !this.auditContract) {
            throw new BlockchainError('Not connected or contract not initialized', 'NOT_CONNECTED', this.network);
        }

        try {
            const events = await this.auditContract.getAuditEvents(documentId);
            return events.map((event: any) => ({
                id: event.eventId,
                eventType: event.eventType,
                documentId,
                userId: '', // Would need to be extracted from eventData
                organizationId: '', // Would need to be extracted from eventData
                eventData: JSON.parse(event.eventData),
                currentHash: event.currentHash,
                blockchainNetwork: this.network,
                transactionHash: '', // Would need to be retrieved separately
                timestamp: new Date(Number(event.timestamp) * 1000),
                signature: '' // Would need to be stored separately
            }));
        } catch (error) {
            throw new BlockchainError(
                `Failed to get audit trail: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'RETRIEVAL_ERROR',
                this.network
            );
        }
    }

    async deploySmartContract(
        contract: Omit<SmartContract, 'id' | 'contractAddress' | 'deploymentTxHash' | 'createdAt'>
    ): Promise<SmartContract> {
        if (!this.isConnected() || !this.wallet) {
            throw new BlockchainError('Not connected to Ethereum network', 'NOT_CONNECTED', this.network);
        }

        try {
            const factory = new ethers.ContractFactory(contract.abi, contract.bytecode!, this.wallet);
            const deployedContract = await factory.deploy();
            await deployedContract.waitForDeployment();

            const address = await deployedContract.getAddress();
            const deploymentTx = deployedContract.deploymentTransaction();

            if (!deploymentTx) {
                throw new SmartContractError('Deployment transaction not found', address, undefined, this.network);
            }

            return {
                id: crypto.randomUUID(),
                name: contract.name,
                description: contract.description,
                contractAddress: address,
                abi: contract.abi,
                bytecode: contract.bytecode,
                network: this.network,
                deploymentTxHash: deploymentTx.hash,
                createdAt: new Date(),
                isActive: true
            };
        } catch (error) {
            throw new SmartContractError(
                `Failed to deploy smart contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
                '',
                undefined,
                this.network
            );
        }
    }

    async executeSmartContract(contractAddress: string, method: string, params: any[]): Promise<any> {
        if (!this.isConnected() || !this.wallet) {
            throw new BlockchainError('Not connected to Ethereum network', 'NOT_CONNECTED', this.network);
        }

        try {
            // This would need the contract ABI to be provided or stored
            // For now, we'll create a generic interface
            const contract = new ethers.Contract(contractAddress, [], this.wallet);
            const result = await contract[method](...params);

            if (result.wait) {
                // If it's a transaction, wait for confirmation
                const receipt = await result.wait();
                return receipt;
            }

            return result;
        } catch (error) {
            throw new SmartContractError(
                `Failed to execute smart contract method: ${error instanceof Error ? error.message : 'Unknown error'}`,
                contractAddress,
                method,
                this.network
            );
        }
    }

    async processPayment(
        payment: Omit<CryptocurrencyPayment, 'id' | 'transactionHash' | 'status' | 'timestamp'>
    ): Promise<CryptocurrencyPayment> {
        if (!this.isConnected() || !this.wallet) {
            throw new BlockchainError('Not connected to Ethereum network', 'NOT_CONNECTED', this.network);
        }

        try {
            const tx = await this.wallet.sendTransaction({
                to: payment.toAddress,
                value: ethers.parseEther(payment.amount),
                gasLimit: this.config.gasLimit,
                gasPrice: payment.gasPrice ? ethers.parseUnits(payment.gasPrice, 'gwei') : undefined
            });

            const receipt = await tx.wait();
            if (!receipt) {
                throw new PaymentError('Payment transaction failed', payment.paymentId, this.network);
            }

            return {
                id: crypto.randomUUID(),
                paymentId: payment.paymentId,
                currency: payment.currency,
                amount: payment.amount,
                fromAddress: payment.fromAddress,
                toAddress: payment.toAddress,
                transactionHash: receipt.hash,
                network: this.network,
                status: 'CONFIRMED',
                confirmations: 1,
                requiredConfirmations: payment.requiredConfirmations,
                gasPrice: payment.gasPrice,
                gasUsed: Number(receipt.gasUsed),
                blockNumber: receipt.blockNumber,
                timestamp: new Date(),
                metadata: payment.metadata
            };
        } catch (error) {
            throw new PaymentError(
                `Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
                payment.paymentId,
                this.network
            );
        }
    }

    async getPaymentStatus(paymentId: string): Promise<CryptocurrencyPayment | null> {
        // This would typically query a database or blockchain explorer
        // For now, return null as this requires additional infrastructure
        return null;
    }
}