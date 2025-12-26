import { BlockchainManager } from './manager';
import { BlockchainConfigManager } from './config';
import { BlockchainNetwork, IBlockchainManager, BlockchainError } from './types';
import { SolanaProvider } from './providers/solana';
import { EthereumProvider } from './providers/ethereum';

/**
 * Creates and configures a blockchain manager with providers based on environment configuration
 */
export function createBlockchainManager(
    env?: Record<string, string | undefined>,
    defaultNetwork?: BlockchainNetwork
): IBlockchainManager {
    const configManager = new BlockchainConfigManager(env);
    const manager = new BlockchainManager(defaultNetwork || configManager.getDefaultNetwork());

    // Initialize providers for enabled networks
    const enabledNetworks = configManager.getEnabledNetworks();

    for (const network of enabledNetworks) {
        const config = configManager.getConfig(network);
        if (!config) continue;

        try {
            let provider;

            switch (network) {
                case BlockchainNetwork.ETHEREUM:
                case BlockchainNetwork.POLYGON:
                case BlockchainNetwork.BINANCE_SMART_CHAIN:
                case BlockchainNetwork.AVALANCHE:
                    provider = new EthereumProvider(config);
                    break;

                case BlockchainNetwork.SOLANA:
                    provider = new SolanaProvider(config);
                    break;

                case BlockchainNetwork.BITCOIN:
                    // Bitcoin provider would be implemented here
                    console.warn(`Bitcoin provider not yet implemented for network: ${network}`);
                    continue;

                default:
                    console.warn(`Unknown blockchain network: ${network}`);
                    continue;
            }

            if (provider) {
                manager.addProvider(provider);
            }
        } catch (error) {
            console.error(`Failed to initialize provider for ${network}:`, error);
        }
    }

    return manager;
}

/**
 * Initializes blockchain providers and connects them
 */
export async function initializeBlockchainProviders(
    manager: IBlockchainManager,
    autoConnect: boolean = true
): Promise<void> {
    if (!autoConnect) return;

    try {
        await (manager as BlockchainManager).connectAllProviders();
        console.log('Blockchain providers initialized successfully');
    } catch (error) {
        console.error('Failed to initialize blockchain providers:', error);
        throw new BlockchainError(
            'Failed to initialize blockchain providers',
            'INITIALIZATION_ERROR'
        );
    }
}

/**
 * Utility function to validate document hashes
 */
export function validateDocumentHash(hash: string): boolean {
    // SHA-256 hash should be 64 characters (32 bytes in hex)
    // SHA-512 hash should be 128 characters (64 bytes in hex)
    const sha256Regex = /^[a-fA-F0-9]{64}$/;
    const sha512Regex = /^[a-fA-F0-9]{128}$/;

    return sha256Regex.test(hash) || sha512Regex.test(hash);
}

/**
 * Utility function to generate document hash from content
 */
export function generateDocumentHash(content: Buffer | string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
    const crypto = require('node:crypto');
    const hash = crypto.createHash(algorithm);

    if (typeof content === 'string') {
        hash.update(content, 'utf8');
    } else {
        hash.update(content);
    }

    return hash.digest('hex');
}

/**
 * Utility function to validate cryptocurrency addresses
 */
export function validateCryptoAddress(address: string, network: BlockchainNetwork): boolean {
    switch (network) {
        case BlockchainNetwork.ETHEREUM:
        case BlockchainNetwork.POLYGON:
        case BlockchainNetwork.BINANCE_SMART_CHAIN:
        case BlockchainNetwork.AVALANCHE:
            // Ethereum-style address validation
            return /^0x[a-fA-F0-9]{40}$/.test(address);

        case BlockchainNetwork.SOLANA:
            // Solana address validation (base58, 32-44 characters)
            return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);

        case BlockchainNetwork.BITCOIN:
            // Bitcoin address validation (simplified)
            return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || // Legacy
                /^bc1[a-z0-9]{39,59}$/.test(address); // Bech32

        default:
            return false;
    }
}

/**
 * Utility function to format cryptocurrency amounts
 */
export function formatCryptoAmount(amount: string | number, decimals: number = 18): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Utility function to convert between different units
 */
export function convertCryptoUnits(
    amount: string | number,
    fromUnit: 'wei' | 'gwei' | 'ether' | 'lamports' | 'sol' | 'satoshi' | 'btc',
    toUnit: 'wei' | 'gwei' | 'ether' | 'lamports' | 'sol' | 'satoshi' | 'btc'
): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Conversion factors to base units
    const conversionFactors: Record<string, number> = {
        // Ethereum units
        wei: 1,
        gwei: 1e9,
        ether: 1e18,

        // Solana units
        lamports: 1,
        sol: 1e9,

        // Bitcoin units
        satoshi: 1,
        btc: 1e8
    };

    const fromFactor = conversionFactors[fromUnit];
    const toFactor = conversionFactors[toUnit];

    if (!fromFactor || !toFactor) {
        throw new Error(`Unsupported unit conversion: ${fromUnit} to ${toUnit}`);
    }

    const baseAmount = num * fromFactor;
    const convertedAmount = baseAmount / toFactor;

    return convertedAmount.toString();
}

/**
 * Utility function to estimate transaction fees
 */
export function estimateTransactionFee(
    network: BlockchainNetwork,
    gasLimit: number,
    gasPrice: string
): string {
    switch (network) {
        case BlockchainNetwork.ETHEREUM:
        case BlockchainNetwork.POLYGON:
        case BlockchainNetwork.BINANCE_SMART_CHAIN:
        case BlockchainNetwork.AVALANCHE:
            // Fee = gasLimit * gasPrice (in gwei)
            const gasPriceWei = parseFloat(gasPrice) * 1e9;
            const feeWei = gasLimit * gasPriceWei;
            return convertCryptoUnits(feeWei, 'wei', 'ether');

        case BlockchainNetwork.SOLANA:
            // Solana has fixed fees, typically 0.000005 SOL per signature
            return '0.000005';

        case BlockchainNetwork.BITCOIN:
            // Bitcoin fees are calculated differently (satoshis per byte)
            // This is a simplified estimation
            const bytesPerTx = 250; // Average transaction size
            const satoshisPerByte = parseFloat(gasPrice);
            const totalSatoshis = bytesPerTx * satoshisPerByte;
            return convertCryptoUnits(totalSatoshis, 'satoshi', 'btc');

        default:
            return '0';
    }
}

/**
 * Utility function to check if a network supports smart contracts
 */
export function supportsSmartContracts(network: BlockchainNetwork): boolean {
    switch (network) {
        case BlockchainNetwork.ETHEREUM:
        case BlockchainNetwork.POLYGON:
        case BlockchainNetwork.BINANCE_SMART_CHAIN:
        case BlockchainNetwork.AVALANCHE:
        case BlockchainNetwork.SOLANA:
            return true;

        case BlockchainNetwork.BITCOIN:
            return false; // Bitcoin has limited smart contract capabilities

        default:
            return false;
    }
}

/**
 * Utility function to get network explorer URLs
 */
export function getExplorerUrl(network: BlockchainNetwork, txHash: string): string {
    const explorers: Record<BlockchainNetwork, string> = {
        [BlockchainNetwork.ETHEREUM]: 'https://etherscan.io/tx/',
        [BlockchainNetwork.POLYGON]: 'https://polygonscan.com/tx/',
        [BlockchainNetwork.SOLANA]: 'https://explorer.solana.com/tx/',
        [BlockchainNetwork.BITCOIN]: 'https://blockstream.info/tx/',
        [BlockchainNetwork.BINANCE_SMART_CHAIN]: 'https://bscscan.com/tx/',
        [BlockchainNetwork.AVALANCHE]: 'https://snowtrace.io/tx/'
    };

    const baseUrl = explorers[network];
    return baseUrl ? `${baseUrl}${txHash}` : '';
}

/**
 * Utility function to retry blockchain operations with exponential backoff
 */
export async function retryBlockchainOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            if (attempt === maxRetries) {
                throw lastError;
            }

            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}