import { z } from 'zod';
import { BlockchainNetwork, BlockchainConfig, BlockchainConfigSchema } from './types';

// Environment variable schema
const BlockchainEnvSchema = z.object({
    // Ethereum Configuration
    ETHEREUM_RPC_URL: z.string().url().optional(),
    ETHEREUM_PRIVATE_KEY: z.string().optional(),
    ETHEREUM_CONTRACT_ADDRESS: z.string().optional(),
    ETHEREUM_GAS_LIMIT: z.string().transform(Number).optional(),
    ETHEREUM_GAS_PRICE: z.string().optional(),

    // Polygon Configuration
    POLYGON_RPC_URL: z.string().url().optional(),
    POLYGON_PRIVATE_KEY: z.string().optional(),
    POLYGON_CONTRACT_ADDRESS: z.string().optional(),
    POLYGON_GAS_LIMIT: z.string().transform(Number).optional(),
    POLYGON_GAS_PRICE: z.string().optional(),

    // Solana Configuration
    SOLANA_RPC_URL: z.string().url().optional(),
    SOLANA_PRIVATE_KEY: z.string().optional(),
    SOLANA_PROGRAM_ID: z.string().optional(),

    // Bitcoin Configuration
    BITCOIN_RPC_URL: z.string().url().optional(),
    BITCOIN_USERNAME: z.string().optional(),
    BITCOIN_PASSWORD: z.string().optional(),

    // BSC Configuration
    BSC_RPC_URL: z.string().url().optional(),
    BSC_PRIVATE_KEY: z.string().optional(),
    BSC_CONTRACT_ADDRESS: z.string().optional(),

    // Avalanche Configuration
    AVALANCHE_RPC_URL: z.string().url().optional(),
    AVALANCHE_PRIVATE_KEY: z.string().optional(),
    AVALANCHE_CONTRACT_ADDRESS: z.string().optional(),

    // General Configuration
    BLOCKCHAIN_DEFAULT_NETWORK: z.nativeEnum(BlockchainNetwork).optional(),
    BLOCKCHAIN_ENABLED: z.string().transform(val => val === 'true').optional(),
    BLOCKCHAIN_CONFIRMATIONS: z.string().transform(Number).optional()
});

export type BlockchainEnvConfig = z.infer<typeof BlockchainEnvSchema>;

export class BlockchainConfigManager {
    private configs: Map<BlockchainNetwork, BlockchainConfig> = new Map();
    private envConfig: BlockchainEnvConfig;

    constructor(env: Record<string, string | undefined> = process.env) {
        this.envConfig = BlockchainEnvSchema.parse(env);
        this.initializeConfigs();
    }

    private initializeConfigs(): void {
        // Ethereum Configuration
        if (this.envConfig.ETHEREUM_RPC_URL) {
            this.configs.set(BlockchainNetwork.ETHEREUM, {
                network: BlockchainNetwork.ETHEREUM,
                rpcUrl: this.envConfig.ETHEREUM_RPC_URL,
                privateKey: this.envConfig.ETHEREUM_PRIVATE_KEY,
                contractAddress: this.envConfig.ETHEREUM_CONTRACT_ADDRESS,
                gasLimit: this.envConfig.ETHEREUM_GAS_LIMIT || 21000,
                gasPrice: this.envConfig.ETHEREUM_GAS_PRICE,
                confirmations: this.envConfig.BLOCKCHAIN_CONFIRMATIONS || 6,
                enabled: this.envConfig.BLOCKCHAIN_ENABLED !== false
            });
        }

        // Polygon Configuration
        if (this.envConfig.POLYGON_RPC_URL) {
            this.configs.set(BlockchainNetwork.POLYGON, {
                network: BlockchainNetwork.POLYGON,
                rpcUrl: this.envConfig.POLYGON_RPC_URL,
                privateKey: this.envConfig.POLYGON_PRIVATE_KEY,
                contractAddress: this.envConfig.POLYGON_CONTRACT_ADDRESS,
                gasLimit: this.envConfig.POLYGON_GAS_LIMIT || 21000,
                gasPrice: this.envConfig.POLYGON_GAS_PRICE,
                confirmations: this.envConfig.BLOCKCHAIN_CONFIRMATIONS || 6,
                enabled: this.envConfig.BLOCKCHAIN_ENABLED !== false
            });
        }

        // Solana Configuration
        if (this.envConfig.SOLANA_RPC_URL) {
            this.configs.set(BlockchainNetwork.SOLANA, {
                network: BlockchainNetwork.SOLANA,
                rpcUrl: this.envConfig.SOLANA_RPC_URL,
                privateKey: this.envConfig.SOLANA_PRIVATE_KEY,
                contractAddress: this.envConfig.SOLANA_PROGRAM_ID,
                gasLimit: 21000, // Not applicable for Solana, but required by schema
                confirmations: this.envConfig.BLOCKCHAIN_CONFIRMATIONS || 1,
                enabled: this.envConfig.BLOCKCHAIN_ENABLED !== false
            });
        }

        // Bitcoin Configuration
        if (this.envConfig.BITCOIN_RPC_URL) {
            this.configs.set(BlockchainNetwork.BITCOIN, {
                network: BlockchainNetwork.BITCOIN,
                rpcUrl: this.envConfig.BITCOIN_RPC_URL,
                gasLimit: 21000, // Not applicable for Bitcoin
                confirmations: this.envConfig.BLOCKCHAIN_CONFIRMATIONS || 6,
                enabled: this.envConfig.BLOCKCHAIN_ENABLED !== false
            });
        }

        // BSC Configuration
        if (this.envConfig.BSC_RPC_URL) {
            this.configs.set(BlockchainNetwork.BINANCE_SMART_CHAIN, {
                network: BlockchainNetwork.BINANCE_SMART_CHAIN,
                rpcUrl: this.envConfig.BSC_RPC_URL,
                privateKey: this.envConfig.BSC_PRIVATE_KEY,
                contractAddress: this.envConfig.BSC_CONTRACT_ADDRESS,
                gasLimit: 21000,
                confirmations: this.envConfig.BLOCKCHAIN_CONFIRMATIONS || 6,
                enabled: this.envConfig.BLOCKCHAIN_ENABLED !== false
            });
        }

        // Avalanche Configuration
        if (this.envConfig.AVALANCHE_RPC_URL) {
            this.configs.set(BlockchainNetwork.AVALANCHE, {
                network: BlockchainNetwork.AVALANCHE,
                rpcUrl: this.envConfig.AVALANCHE_RPC_URL,
                privateKey: this.envConfig.AVALANCHE_PRIVATE_KEY,
                contractAddress: this.envConfig.AVALANCHE_CONTRACT_ADDRESS,
                gasLimit: 21000,
                confirmations: this.envConfig.BLOCKCHAIN_CONFIRMATIONS || 6,
                enabled: this.envConfig.BLOCKCHAIN_ENABLED !== false
            });
        }
    }

    getConfig(network: BlockchainNetwork): BlockchainConfig | null {
        return this.configs.get(network) || null;
    }

    getAllConfigs(): Map<BlockchainNetwork, BlockchainConfig> {
        return new Map(this.configs);
    }

    getEnabledNetworks(): BlockchainNetwork[] {
        return Array.from(this.configs.entries())
            .filter(([_, config]) => config.enabled)
            .map(([network, _]) => network);
    }

    getDefaultNetwork(): BlockchainNetwork {
        return this.envConfig.BLOCKCHAIN_DEFAULT_NETWORK || BlockchainNetwork.ETHEREUM;
    }

    isBlockchainEnabled(): boolean {
        return this.envConfig.BLOCKCHAIN_ENABLED !== false && this.configs.size > 0;
    }

    validateConfig(network: BlockchainNetwork): boolean {
        const config = this.getConfig(network);
        if (!config) return false;

        try {
            BlockchainConfigSchema.parse(config);
            return true;
        } catch {
            return false;
        }
    }

    validateAllConfigs(): Record<BlockchainNetwork, boolean> {
        const results: Record<string, boolean> = {};

        for (const [network, config] of this.configs) {
            try {
                BlockchainConfigSchema.parse(config);
                results[network] = true;
            } catch {
                results[network] = false;
            }
        }

        return results as Record<BlockchainNetwork, boolean>;
    }

    // Development and testing configurations
    static createTestConfig(network: BlockchainNetwork): BlockchainConfig {
        const testConfigs: Record<BlockchainNetwork, BlockchainConfig> = {
            [BlockchainNetwork.ETHEREUM]: {
                network: BlockchainNetwork.ETHEREUM,
                rpcUrl: 'http://localhost:8545',
                privateKey: '0x' + '0'.repeat(64), // Test private key
                gasLimit: 21000,
                confirmations: 1,
                enabled: true
            },
            [BlockchainNetwork.POLYGON]: {
                network: BlockchainNetwork.POLYGON,
                rpcUrl: 'https://rpc-mumbai.maticvigil.com',
                privateKey: '0x' + '0'.repeat(64),
                gasLimit: 21000,
                confirmations: 1,
                enabled: true
            },
            [BlockchainNetwork.SOLANA]: {
                network: BlockchainNetwork.SOLANA,
                rpcUrl: 'https://api.devnet.solana.com',
                privateKey: '0'.repeat(128), // Solana private key format
                gasLimit: 21000,
                confirmations: 1,
                enabled: true
            },
            [BlockchainNetwork.BITCOIN]: {
                network: BlockchainNetwork.BITCOIN,
                rpcUrl: 'http://localhost:18332',
                gasLimit: 21000,
                confirmations: 1,
                enabled: true
            },
            [BlockchainNetwork.BINANCE_SMART_CHAIN]: {
                network: BlockchainNetwork.BINANCE_SMART_CHAIN,
                rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
                privateKey: '0x' + '0'.repeat(64),
                gasLimit: 21000,
                confirmations: 1,
                enabled: true
            },
            [BlockchainNetwork.AVALANCHE]: {
                network: BlockchainNetwork.AVALANCHE,
                rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
                privateKey: '0x' + '0'.repeat(64),
                gasLimit: 21000,
                confirmations: 1,
                enabled: true
            }
        };

        return testConfigs[network];
    }

    static createProductionConfig(network: BlockchainNetwork, options: Partial<BlockchainConfig>): BlockchainConfig {
        const productionDefaults: Record<BlockchainNetwork, Partial<BlockchainConfig>> = {
            [BlockchainNetwork.ETHEREUM]: {
                rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
                gasLimit: 21000,
                confirmations: 12
            },
            [BlockchainNetwork.POLYGON]: {
                rpcUrl: 'https://polygon-rpc.com',
                gasLimit: 21000,
                confirmations: 6
            },
            [BlockchainNetwork.SOLANA]: {
                rpcUrl: 'https://api.mainnet-beta.solana.com',
                gasLimit: 21000,
                confirmations: 1
            },
            [BlockchainNetwork.BITCOIN]: {
                rpcUrl: 'https://bitcoin-rpc.com',
                gasLimit: 21000,
                confirmations: 6
            },
            [BlockchainNetwork.BINANCE_SMART_CHAIN]: {
                rpcUrl: 'https://bsc-dataseed.binance.org',
                gasLimit: 21000,
                confirmations: 6
            },
            [BlockchainNetwork.AVALANCHE]: {
                rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
                gasLimit: 21000,
                confirmations: 6
            }
        };

        const defaults = productionDefaults[network];

        return {
            network,
            enabled: true,
            ...defaults,
            ...options
        } as BlockchainConfig;
    }
}