/**
 * Blockchain + IPFS Document Storage
 *
 * This module combines blockchain immutability with IPFS decentralized storage
 * to create a tamper-proof, censorship-resistant document storage system.
 */

import crypto from "crypto";
import { BlockchainManager } from "./manager";
import { DocumentMetadata, IPFSProvider } from "./providers/ipfs";
import { BlockchainNetwork } from "./types";

export interface StorageConfig {
  blockchain: BlockchainManager;
  ipfs: IPFSProvider;
  defaultNetwork?: BlockchainNetwork;
  autoPin?: boolean;
  encryptDocuments?: boolean;
}

export interface StorageResult {
  documentId: string;
  ipfsCID: string;
  metadataCID: string;
  blockchainTxHash: string;
  blockNumber: number;
  documentHash: string;
  url: string;
  gatewayUrl: string;
  timestamp: number;
}

export interface VerificationResult {
  isValid: boolean;
  documentHash: string;
  blockchainHash: string;
  ipfsCID: string;
  blockNumber: number;
  timestamp: number;
  ipfsMatches: boolean;
  blockchainMatches: boolean;
  details: {
    storedOnBlockchain: boolean;
    availableOnIPFS: boolean;
    hashesMatch: boolean;
    contentMatches: boolean;
  };
}

export interface RetrievalOptions {
  verifyIntegrity?: boolean;
  decrypt?: boolean;
  decryptionKey?: string;
}

/**
 * Blockchain + IPFS Document Storage Manager
 */
export class BlockchainDocumentStorage {
  private blockchain: BlockchainManager;
  private ipfs: IPFSProvider;
  private defaultNetwork: BlockchainNetwork;
  private autoPin: boolean;
  private encryptDocuments: boolean;

  constructor(config: StorageConfig) {
    this.blockchain = config.blockchain;
    this.ipfs = config.ipfs;
    this.defaultNetwork = config.defaultNetwork || BlockchainNetwork.ETHEREUM;
    this.autoPin = config.autoPin !== false; // Default true
    this.encryptDocuments = config.encryptDocuments || false;
  }

  /**
   * Store document on IPFS and record hash on blockchain
   */
  async storeDocument(
    documentId: string,
    content: Buffer,
    metadata: DocumentMetadata,
    options?: {
      network?: BlockchainNetwork;
      encrypt?: boolean;
      encryptionKey?: string;
    }
  ): Promise<StorageResult> {
    try {
      // 1. Optionally encrypt document
      let processedContent = content;
      if (options?.encrypt || this.encryptDocuments) {
        if (!options?.encryptionKey) {
          throw new Error("Encryption key required when encryption is enabled");
        }
        processedContent = this.ipfs.encryptDocument(
          content,
          options.encryptionKey
        );
        metadata.encrypted = true;
      }

      // 2. Calculate document hash (before encryption for verification)
      const documentHash = this.calculateDocumentHash(content);

      // 3. Upload to IPFS
      const ipfsResult = await this.ipfs.uploadDocument(
        processedContent,
        metadata
      );

      // 4. Store hash + IPFS CID on blockchain
      const network = options?.network || this.defaultNetwork;
      const blockchainResult = await this.blockchain.storeDocumentHash(
        documentId,
        documentHash,
        network
      );

      // 5. Store additional metadata on blockchain
      await this.storeBlockchainMetadata(documentId, {
        ipfsCID: ipfsResult.documentCID,
        metadataCID: ipfsResult.metadataCID,
        documentHash,
        timestamp: Date.now(),
        network,
      });

      return {
        documentId,
        ipfsCID: ipfsResult.documentCID,
        metadataCID: ipfsResult.metadataCID,
        blockchainTxHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber || 0,
        documentHash,
        url: ipfsResult.url,
        gatewayUrl: ipfsResult.gatewayUrl,
        timestamp: Date.now(),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to store document: ${message}`);
    }
  }

  /**
   * Retrieve document from IPFS and verify against blockchain
   */
  async retrieveDocument(
    documentId: string,
    options?: RetrievalOptions
  ): Promise<{
    content: Buffer;
    metadata: DocumentMetadata;
    verification?: VerificationResult;
  }> {
    try {
      // 1. Get blockchain record
      const blockchainRecord = await this.getBlockchainMetadata(documentId);

      // 2. Retrieve from IPFS
      const ipfsResult = await this.ipfs.getDocumentWithMetadata(
        blockchainRecord.ipfsCID,
        blockchainRecord.metadataCID
      );

      // 3. Optionally decrypt
      let content = ipfsResult.content;
      if (options?.decrypt && ipfsResult.metadata.encrypted) {
        if (!options.decryptionKey) {
          throw new Error("Decryption key required for encrypted documents");
        }
        content = this.ipfs.decryptDocument(content, options.decryptionKey);
      }

      // 4. Optionally verify integrity
      let verification: VerificationResult | undefined;
      if (options?.verifyIntegrity) {
        verification = await this.verifyDocument(documentId, content);
      }

      return {
        content,
        metadata: ipfsResult.metadata,
        verification,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to retrieve document: ${message}`);
    }
  }

  /**
   * Verify document integrity against blockchain and IPFS
   */
  async verifyDocument(
    documentId: string,
    content: Buffer
  ): Promise<VerificationResult> {
    try {
      // 1. Get blockchain record
      const blockchainRecord = await this.getBlockchainMetadata(documentId);

      // 2. Calculate current hash
      const currentHash = this.calculateDocumentHash(content);

      // 3. Compare with blockchain hash
      const blockchainMatches = currentHash === blockchainRecord.documentHash;

      // 4. Verify IPFS content
      let ipfsMatches = false;
      let ipfsAvailable = false;
      try {
        const ipfsContent = await this.ipfs.getDocument(
          blockchainRecord.ipfsCID
        );
        ipfsAvailable = true;
        ipfsMatches = Buffer.compare(content, ipfsContent) === 0;
      } catch {
        ipfsAvailable = false;
      }

      const isValid = blockchainMatches && (ipfsMatches || !ipfsAvailable);

      return {
        isValid,
        documentHash: currentHash,
        blockchainHash: blockchainRecord.documentHash,
        ipfsCID: blockchainRecord.ipfsCID,
        blockNumber: blockchainRecord.blockNumber || 0,
        timestamp: blockchainRecord.timestamp,
        ipfsMatches,
        blockchainMatches,
        details: {
          storedOnBlockchain: !!blockchainRecord,
          availableOnIPFS: ipfsAvailable,
          hashesMatch: blockchainMatches,
          contentMatches: ipfsMatches,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to verify document: ${message}`);
    }
  }

  /**
   * Get document info without downloading content
   */
  async getDocumentInfo(documentId: string): Promise<{
    ipfsCID: string;
    metadataCID: string;
    documentHash: string;
    blockNumber: number;
    timestamp: number;
    network: BlockchainNetwork;
    gatewayUrl: string;
  }> {
    const blockchainRecord = await this.getBlockchainMetadata(documentId);

    return {
      ipfsCID: blockchainRecord.ipfsCID,
      metadataCID: blockchainRecord.metadataCID,
      documentHash: blockchainRecord.documentHash,
      blockNumber: blockchainRecord.blockNumber || 0,
      timestamp: blockchainRecord.timestamp,
      network: blockchainRecord.network,
      gatewayUrl: this.ipfs.getGatewayUrl(blockchainRecord.ipfsCID),
    };
  }

  /**
   * Pin document to ensure IPFS availability
   */
  async pinDocument(documentId: string): Promise<void> {
    const info = await this.getDocumentInfo(documentId);
    await Promise.all([
      this.ipfs.pinDocument(info.ipfsCID),
      this.ipfs.pinDocument(info.metadataCID),
    ]);
  }

  /**
   * Check if document exists on blockchain and IPFS
   */
  async documentExists(documentId: string): Promise<{
    onBlockchain: boolean;
    onIPFS: boolean;
  }> {
    try {
      const info = await this.getDocumentInfo(documentId);

      const onIPFS = await this.ipfs.isPinned(info.ipfsCID);

      return {
        onBlockchain: true,
        onIPFS,
      };
    } catch {
      return {
        onBlockchain: false,
        onIPFS: false,
      };
    }
  }

  /**
   * Calculate document hash
   */
  private calculateDocumentHash(content: Buffer): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Store metadata on blockchain (implementation depends on blockchain provider)
   */
  private async storeBlockchainMetadata(
    documentId: string,
    metadata: {
      ipfsCID: string;
      metadataCID: string;
      documentHash: string;
      timestamp: number;
      network: BlockchainNetwork;
    }
  ): Promise<void> {
    // This would interact with a smart contract to store metadata
    // For now, we'll store it in a simple mapping
    // In production, this should call a smart contract method

    // Example: await this.blockchain.storeMetadata(documentId, metadata);

    // Placeholder implementation
    console.log(`Storing metadata for ${documentId} on blockchain`);
  }

  /**
   * Get metadata from blockchain
   */
  private async getBlockchainMetadata(documentId: string): Promise<{
    ipfsCID: string;
    metadataCID: string;
    documentHash: string;
    blockNumber?: number;
    timestamp: number;
    network: BlockchainNetwork;
  }> {
    // This would retrieve from smart contract
    // For now, placeholder implementation

    // Example: return await this.blockchain.getMetadata(documentId);

    throw new Error(
      "getBlockchainMetadata not implemented - requires smart contract"
    );
  }
}

/**
 * Factory function to create document storage manager
 */
export function createDocumentStorage(
  config: StorageConfig
): BlockchainDocumentStorage {
  return new BlockchainDocumentStorage(config);
}
