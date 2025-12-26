/**
 * Document service for managing documents
 */

import { BaseService } from './base';
import {
    Document,
    DocumentUploadRequest,
    PaginatedResponse,
    ListOptions,
    SearchOptions
} from '../types';

export class DocumentService extends BaseService {
    /**
     * Upload a new document
     */
    async uploadDocument(
        request: DocumentUploadRequest,
        onProgress?: (progress: number) => void
    ): Promise<Document> {
        const { file, ...additionalData } = request;
        return this.upload<Document>('/v1/documents', file, additionalData, onProgress);
    }

    /**
     * Get a document by ID
     */
    async getDocument(documentId: string): Promise<Document> {
        return this.get<Document>(`/v1/documents/${documentId}`);
    }

    /**
     * List documents with pagination
     */
    async listDocuments(options: ListOptions = {}): Promise<PaginatedResponse<Document>> {
        return this.list<Document>('/v1/documents', options);
    }

    /**
     * Search documents
     */
    async search(options: SearchOptions = {}): Promise<PaginatedResponse<Document>> {
        return this.list<Document>('/v1/documents/search', options);
    }

    /**
     * Update document metadata
     */
    async updateDocument(
        documentId: string,
        updates: Partial<Pick<Document, 'name' | 'metadata' | 'folderId'>>
    ): Promise<Document> {
        return this.update<Document>(`/v1/documents/${documentId}`, updates);
    }

    /**
     * Delete a document
     */
    async deleteDocument(documentId: string): Promise<void> {
        return this.delete(`/v1/documents/${documentId}`);
    }

    /**
     * Download document content
     */
    async download(documentId: string): Promise<Buffer> {
        const response = await this.client.get(`/v1/documents/${documentId}/download`, {
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data);
    }

    /**
     * Get document thumbnail
     */
    async getThumbnail(documentId: string, page: number = 1): Promise<Buffer> {
        const response = await this.client.get(
            `/v1/documents/${documentId}/thumbnail?page=${page}`,
            { responseType: 'arraybuffer' }
        );
        return Buffer.from(response.data);
    }

    /**
     * Get document preview URL
     */
    async getPreviewUrl(documentId: string): Promise<{ url: string; expiresAt: string }> {
        return this.get<{ url: string; expiresAt: string }>(
            `/v1/documents/${documentId}/preview-url`
        );
    }

    /**
     * Create a folder
     */
    async createFolder(name: string, parentId?: string): Promise<{ id: string; name: string; parentId?: string }> {
        return this.create<{ id: string; name: string; parentId?: string }>('/v1/documents/folders', {
            name,
            parentId
        });
    }

    /**
     * List folders
     */
    async listFolders(parentId?: string): Promise<{ id: string; name: string; parentId?: string }[]> {
        const queryString = parentId ? `?parentId=${parentId}` : '';
        return this.get<{ id: string; name: string; parentId?: string }[]>(
            `/v1/documents/folders${queryString}`
        );
    }

    /**
     * Move document to folder
     */
    async moveToFolder(documentId: string, folderId?: string): Promise<Document> {
        return this.patch<Document>(`/v1/documents/${documentId}`, { folderId });
    }

    /**
     * Bulk delete documents
     */
    async bulkDelete(documentIds: string[]): Promise<{ deleted: string[]; failed: string[] }> {
        return this.create<{ deleted: string[]; failed: string[] }>('/v1/documents/bulk-delete', {
            documentIds
        });
    }

    /**
     * Get document versions
     */
    async getVersions(documentId: string): Promise<{ id: string; version: number; createdAt: string }[]> {
        return this.get<{ id: string; version: number; createdAt: string }[]>(
            `/v1/documents/${documentId}/versions`
        );
    }

    /**
     * Create new document version
     */
    async createVersion(
        documentId: string,
        file: any,
        onProgress?: (progress: number) => void
    ): Promise<Document> {
        return this.upload<Document>(
            `/v1/documents/${documentId}/versions`,
            file,
            {},
            onProgress
        );
    }
}