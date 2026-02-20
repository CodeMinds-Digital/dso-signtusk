/**
 * IPFS Provider for Decentralized Document Storage
 *
 * This provider handles:
 * - Document upload to IPFS
 * - Document retrieval from IPFS
 * - Pinning for persistence
 * - Metadata management
 */

import crypto from "crypto";

// Type definitions for IPFS (since packages are not installed)
type IPFSHTTPClient = any;
type Options = any;
type CID = any;

export interface IPFSConfig {
  host?: string;
  port?: number;
  protocol?: "http" | "https";
  projectId?: string;
  projectSecret?: string;
  gateway?: string;
}

export interface DocumentMetadata {
  documentId: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
  uploadedBy: string;
  organizationId?: string;
  tags?: string[];
  encrypted?: boolean;
}

export interface IPFSUploadResult {
  documentCID: string;
  metadataCID: string;
  size: number;
  url: string;
  gatewayUrl: string;
}

export interface IPFSRetrievalResult {
  content: Buffer;
  metadata: DocumentMetadata;
  cid: string;
}

export class IPFSProvider {
  private client: IPFSHTTPClient;
  private gateway: string;

  constructor(config: IPFSConfig = {}) {
    // Default to Infura IPFS
    const host = config.host || "ipfs.infura.io";
    const port = config.port || 5001;
    const protocol = config.protocol || "https";

    // Note: IPFS client creation disabled - install ipfs-http-client to enable
    // const clientOptions: Options = {
    //   host,
    //   port,
    //   protocol,
    // };

    // Add authentication if provided
    // if (config.projectId && config.projectSecret) {
    //   clientOptions.headers = {
    //     authorization: `Basic ${Buffer.from(
    //       `${config.projectId}:${config.projectSecret}`
    //     ).toString("base64")}`,
    //   };
    // }

    // this.client = create(clientOptions);
    this.client = null as any; // Placeholder
    this.gateway = config.gateway || "https://ipfs.io/ipfs";
  }

  /**
   * Upload document to IPFS with metadata
   */
  async uploadDocument(
    content: Buffer,
    metadata: DocumentMetadata
  ): Promise<IPFSUploadResult> {
    try {
      if (!this.client) {
        throw new Error("IPFS client not initialized - install ipfs-http-client package");
      }

      // Add document content to IPFS
      const documentResult = await this.client.add(content, {
        pin: true, // Pin to prevent garbage collection
        wrapWithDirectory: false,
        cidVersion: 1, // Use CIDv1 for better compatibility
        hashAlg: "sha2-256",
      });

      // Add metadata separately
      const metadataResult = await this.client.add(
        JSON.stringify(metadata, null, 2),
        {
          pin: true,
          cidVersion: 1,
        }
      );

      const documentCID = documentResult.cid.toString();
      const metadataCID = metadataResult.cid.toString();

      return {
        documentCID,
        metadataCID,
        size: documentResult.size,
        url: `ipfs://${documentCID}`,
        gatewayUrl: `${this.gateway}/${documentCID}`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to upload to IPFS: ${message}`);
    }
  }

  /**
   * Retrieve document from IPFS
   */
  async getDocument(cid: string): Promise<Buffer> {
    try {
      if (!this.client) {
        throw new Error("IPFS client not initialized - install ipfs-http-client package");
      }

      const chunks: Uint8Array[] = [];

      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to retrieve from IPFS: ${message}`);
    }
  }

  /**
   * Get document with metadata
   */
  async getDocumentWithMetadata(
    documentCID: string,
    metadataCID: string
  ): Promise<IPFSRetrievalResult> {
    try {
      const [content, metadataBuffer] = await Promise.all([
        this.getDocument(documentCID),
        this.getDocument(metadataCID),
      ]);

      const metadata = JSON.parse(
        metadataBuffer.toString()
      ) as DocumentMetadata;

      return {
        content,
        metadata,
        cid: documentCID,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to retrieve document with metadata: ${message}`
      );
    }
  }

  /**
   * Pin document to ensure availability
   */
  async pinDocument(cid: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error("IPFS client not initialized");
      }
      await this.client.pin.add(cid);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to pin document: ${message}`);
    }
  }

  /**
   * Unpin document (allow garbage collection)
   */
  async unpinDocument(cid: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error("IPFS client not initialized");
      }
      await this.client.pin.rm(cid);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to unpin document: ${message}`);
    }
  }

  /**
   * Check if document is pinned
   */
  async isPinned(cid: string): Promise<boolean> {
    try {
      for await (const pin of this.client.pin.ls({ paths: [cid] })) {
        if (pin.cid.toString() === cid) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get document stats
   */
  async getStats(cid: string): Promise<{ size: number; blocks: number }> {
    try {
      if (!this.client) {
        throw new Error("IPFS client not initialized");
      }
      const stats = await this.client.object.stat(cid);
      return {
        size: stats.CumulativeSize,
        blocks: stats.NumLinks,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get stats: ${message}`);
    }
  }

  /**
   * Generate gateway URL for document
   */
  getGatewayUrl(cid: string): string {
    return `${this.gateway}/${cid}`;
  }

  /**
   * Verify CID is valid
   */
  isValidCID(cid: string): boolean {
    try {
      // CID.parse(cid); // Requires multiformats/cid package
      // Simple validation instead
      return cid.length > 0 && /^[a-zA-Z0-9]+$/.test(cid);
    } catch {
      return false;
    }
  }

  /**
   * Calculate document hash (for blockchain storage)
   */
  calculateHash(content: Buffer): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Encrypt document before upload (optional)
   */
  encryptDocument(content: Buffer, key: string): Buffer {
    const algorithm = "aes-256-cbc";
    const keyBuffer = crypto.scryptSync(key, "salt", 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);

    // Prepend IV to encrypted data
    return Buffer.concat([iv, encrypted]);
  }

  /**
   * Decrypt document after retrieval (optional)
   */
  decryptDocument(encryptedContent: Buffer, key: string): Buffer {
    const algorithm = "aes-256-cbc";
    const keyBuffer = crypto.scryptSync(key, "salt", 32);

    // Extract IV from beginning
    const iv = encryptedContent.slice(0, 16);
    const encrypted = encryptedContent.slice(16);

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}

/**
 * Factory function to create IPFS provider
 */
export function createIPFSProvider(config?: IPFSConfig): IPFSProvider {
  return new IPFSProvider(config);
}

/**
 * Get IPFS config from environment variables
 */
export function getIPFSConfigFromEnv(): IPFSConfig {
  return {
    host: process.env.IPFS_HOST,
    port: process.env.IPFS_PORT ? parseInt(process.env.IPFS_PORT) : undefined,
    protocol: (process.env.IPFS_PROTOCOL as "http" | "https") || "https",
    projectId: process.env.IPFS_PROJECT_ID,
    projectSecret: process.env.IPFS_PROJECT_SECRET,
    gateway: process.env.IPFS_GATEWAY,
  };
}
