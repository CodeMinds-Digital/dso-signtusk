import { createHash } from 'node:crypto';
import {
    IBlockchainManager,
    IBlockchainProvider,
    BlockchainNetwork,
    DocumentHash,
    BlockchainAuditEvent,
    SmartContract,
    CryptocurrencyPayment,
    BlockchainError
} from './types';

export class BlockchainManager implements IBlockchainManager {
    private providers: Map<BlockchainNetwork, IBlockchainProvider> = new Map();
    private defaultNetwork: BlockchainNetwork = BlockchainNetwork.ETHEREUM;

    constructor(defaultNetwork?: BlockchainNetwork) {
        if (defaultNetwork) {
            this.defaultNetwork = defaultNetwork;
        }
    }

    addProvider(provider: IBlockchainProvider): void {
        this.providers.set(provider.network, provider);
    }

    getProvider(network: BlockchainNetwork): IBlockchainProvider | null {
        return this.providers.get(network) || null;
    }

    private getActiveProvider(network?: BlockchainNetwork): IBlockchainProvider {
        const targetNetwork = network || this.defaultNetwork;
        const provider = this.getProvider(targetNetwork);

        if (!provider) {
            throw new BlockchainError(
                `No provider configured for network: ${targetNetwork}`,
                'NO_PROVIDER',
                targetNetwork
            );
        }

        if (!provider.isConnected()) {
            throw new BlockchainError(
                `Provider not connected for network: ${targetNetwork}`,
                'NOT_CONNECTED',
                targetNetwork
            );
        }

        return provider;
    }

    async storeDocumentHash(
        documentId: string,
        hash: string,
        network?: BlockchainNetwork
    ): Promise<DocumentHash> {
        const provider = this.getActiveProvider(network);

        try {
            return await provider.storeDocumentHash(documentId, hash, {
                storedAt: new Date().toISOString(),
                version: '1.0'
            });
        } catch (error) {
            throw new BlockchainError(
                `Failed to store document hash: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'STORAGE_ERROR',
                provider.network
            );
        }
    }

    async createImmutableAuditEvent(
        event: Omit<BlockchainAuditEvent, 'transactionHash' | 'blockNumber' | 'currentHash' | 'signature'>
    ): Promise<BlockchainAuditEvent> {
        const provider = this.getActiveProvider(event.blockchainNetwork);

        try {
            // Generate current hash based on event data and previous hash
            const eventDataStr = JSON.stringify(event.eventData);
            const hashInput = `${event.id}:${event.documentId}:${event.eventType}:${eventDataStr}:${event.previousHash || ''}:${event.timestamp.toISOString()}`;
            const currentHash = createHash('sha256').update(hashInput).digest('hex');

            // Generate cryptographic signature
            const signature = createHash('sha256').update(`${currentHash}:${event.userId}:${event.organizationId}`).digest('hex');

            const completeEvent = {
                ...event,
                currentHash,
                signature
            };

            return await provider.createAuditEvent(completeEvent);
        } catch (error) {
            throw new BlockchainError(
                `Failed to create immutable audit event: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'AUDIT_ERROR',
                provider.network
            );
        }
    }

    async verifyAuditTrail(documentId: string): Promise<boolean> {
        try {
            // Try to get audit trail from all available networks
            const networks = Array.from(this.providers.keys());
            let auditEvents: BlockchainAuditEvent[] = [];

            for (const network of networks) {
                const provider = this.getProvider(network);
                if (provider && provider.isConnected()) {
                    try {
                        const events = await provider.getAuditTrail(documentId);
                        auditEvents = auditEvents.concat(events);
                    } catch (error) {
                        // Continue with other networks if one fails
                        console.warn(`Failed to get audit trail from ${network}:`, error);
                    }
                }
            }

            if (auditEvents.length === 0) {
                return false;
            }

            // Sort events by timestamp
            auditEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

            // Verify hash chain integrity
            let previousHash = '';
            for (const event of auditEvents) {
                const eventDataStr = JSON.stringify(event.eventData);
                const expectedHash = createHash('sha256')
                    .update(`${event.id}:${event.documentId}:${event.eventType}:${eventDataStr}:${previousHash}:${event.timestamp.toISOString()}`)
                    .digest('hex');

                if (event.currentHash !== expectedHash) {
                    return false;
                }

                previousHash = event.currentHash;
            }

            return true;
        } catch (error) {
            throw new BlockchainError(
                `Failed to verify audit trail: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'VERIFICATION_ERROR'
            );
        }
    }

    async deployWorkflowContract(
        workflow: any,
        network?: BlockchainNetwork
    ): Promise<SmartContract> {
        const provider = this.getActiveProvider(network);

        try {
            // Generate smart contract code for workflow
            const contractCode = this.generateWorkflowContract(workflow);

            const contract = {
                name: `WorkflowContract_${workflow.id}`,
                description: `Smart contract for workflow: ${workflow.name}`,
                abi: contractCode.abi,
                bytecode: contractCode.bytecode,
                network: provider.network,
                isActive: true
            };

            return await provider.deploySmartContract(contract);
        } catch (error) {
            throw new BlockchainError(
                `Failed to deploy workflow contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DEPLOYMENT_ERROR',
                provider.network
            );
        }
    }

    async executeWorkflowStep(
        contractAddress: string,
        step: string,
        data: any
    ): Promise<any> {
        // Try to execute on all available networks until one succeeds
        const networks = Array.from(this.providers.keys());

        for (const network of networks) {
            const provider = this.getProvider(network);
            if (provider && provider.isConnected()) {
                try {
                    return await provider.executeSmartContract(contractAddress, step, [data]);
                } catch (error) {
                    // Continue with next network if this one fails
                    console.warn(`Failed to execute workflow step on ${network}:`, error);
                }
            }
        }

        throw new BlockchainError(
            'Failed to execute workflow step on any available network',
            'EXECUTION_ERROR'
        );
    }

    async processPayment(
        payment: Omit<CryptocurrencyPayment, 'id' | 'transactionHash' | 'status' | 'timestamp'>
    ): Promise<CryptocurrencyPayment> {
        const provider = this.getActiveProvider(payment.network);

        try {
            return await provider.processPayment(payment);
        } catch (error) {
            throw new BlockchainError(
                `Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'PAYMENT_ERROR',
                provider.network
            );
        }
    }

    async getPaymentHistory(organizationId: string): Promise<CryptocurrencyPayment[]> {
        const payments: CryptocurrencyPayment[] = [];

        // Query all available networks for payment history
        for (const [network, provider] of this.providers) {
            if (provider.isConnected()) {
                try {
                    // This would typically query a database or blockchain explorer
                    // For now, we'll return empty array as this requires additional infrastructure
                    const networkPayments = await this.queryPaymentsByOrganization(organizationId, network);
                    payments.push(...networkPayments);
                } catch (error) {
                    console.warn(`Failed to get payment history from ${network}:`, error);
                }
            }
        }

        return payments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    private async queryPaymentsByOrganization(
        organizationId: string,
        network: BlockchainNetwork
    ): Promise<CryptocurrencyPayment[]> {
        // This would typically query a database or use blockchain indexing services
        // For now, return empty array
        return [];
    }

    private generateWorkflowContract(workflow: any): { abi: any[], bytecode: string } {
        // This is a simplified example of generating smart contract code
        // In a real implementation, this would be much more sophisticated

        const abi = [
            {
                "inputs": [
                    { "name": "stepName", "type": "string" },
                    { "name": "data", "type": "string" }
                ],
                "name": "executeStep",
                "outputs": [{ "name": "", "type": "bool" }],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getWorkflowStatus",
                "outputs": [{ "name": "", "type": "string" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    { "indexed": true, "name": "stepName", "type": "string" },
                    { "indexed": false, "name": "timestamp", "type": "uint256" }
                ],
                "name": "StepExecuted",
                "type": "event"
            }
        ];

        // This would be generated based on the workflow definition
        // For now, return a placeholder bytecode
        const bytecode = "0x608060405234801561001057600080fd5b50..."; // Placeholder

        return { abi, bytecode };
    }

    // Utility methods for blockchain operations
    async connectAllProviders(): Promise<void> {
        const connectionPromises = Array.from(this.providers.values()).map(provider =>
            provider.connect().catch(error =>
                console.warn(`Failed to connect to ${provider.network}:`, error)
            )
        );

        await Promise.allSettled(connectionPromises);
    }

    async disconnectAllProviders(): Promise<void> {
        const disconnectionPromises = Array.from(this.providers.values()).map(provider =>
            provider.disconnect().catch(error =>
                console.warn(`Failed to disconnect from ${provider.network}:`, error)
            )
        );

        await Promise.allSettled(disconnectionPromises);
    }

    getConnectedNetworks(): BlockchainNetwork[] {
        return Array.from(this.providers.entries())
            .filter(([_, provider]) => provider.isConnected())
            .map(([network, _]) => network);
    }

    async getNetworkStatus(): Promise<Record<BlockchainNetwork, boolean>> {
        const status: Record<string, boolean> = {};

        for (const [network, provider] of this.providers) {
            status[network] = provider.isConnected();
        }

        return status as Record<BlockchainNetwork, boolean>;
    }
}