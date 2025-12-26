import { Page } from '@playwright/test';
import { testDocuments } from '../fixtures/test-data';

/**
 * Document management helpers for E2E tests
 */

export class DocumentHelpers {
    constructor(private page: Page) { }

    /**
     * Upload a document
     */
    async uploadDocument(filePath: string, documentName?: string) {
        await this.page.goto('/documents/upload');

        // Upload file
        const fileInput = this.page.locator('[data-testid="file-upload-input"]');
        await fileInput.setInputFiles(filePath);

        // Set document name if provided
        if (documentName) {
            await this.page.fill('[data-testid="document-name-input"]', documentName);
        }

        // Submit upload
        await this.page.click('[data-testid="upload-button"]');

        // Wait for upload completion
        await this.page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 });

        // Get the document ID from the URL or response
        const documentId = await this.page.getAttribute('[data-testid="document-id"]', 'data-document-id');

        return documentId;
    }

    /**
     * Create a signing request
     */
    async createSigningRequest(documentId: string, recipients: Array<{
        email: string;
        name: string;
        role: string;
    }>) {
        await this.page.goto(`/documents/${documentId}/prepare`);

        // Add recipients
        for (const recipient of recipients) {
            await this.page.click('[data-testid="add-recipient-button"]');

            const recipientRow = this.page.locator('[data-testid="recipient-row"]').last();
            await recipientRow.locator('[data-testid="recipient-email"]').fill(recipient.email);
            await recipientRow.locator('[data-testid="recipient-name"]').fill(recipient.name);
            await recipientRow.locator('[data-testid="recipient-role"]').selectOption(recipient.role);
        }

        // Add signature fields (this would be more complex in reality)
        await this.page.click('[data-testid="add-signature-field-button"]');

        // Send for signing
        await this.page.click('[data-testid="send-for-signing-button"]');

        // Wait for confirmation
        await this.page.waitForSelector('[data-testid="signing-request-sent"]', { timeout: 10000 });

        // Get the signing request ID
        const signingRequestId = await this.page.getAttribute('[data-testid="signing-request-id"]', 'data-request-id');

        return signingRequestId;
    }

    /**
     * Sign a document
     */
    async signDocument(signingUrl: string, signatureData?: {
        type: 'draw' | 'type' | 'upload';
        data: string;
    }) {
        await this.page.goto(signingUrl);

        // Wait for document to load
        await this.page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });

        // Find and click signature field
        await this.page.click('[data-testid="signature-field"]');

        // Handle different signature types
        if (signatureData) {
            switch (signatureData.type) {
                case 'draw':
                    await this.page.click('[data-testid="draw-signature-tab"]');
                    // Simulate drawing on canvas
                    const canvas = this.page.locator('[data-testid="signature-canvas"]');
                    await canvas.click({ position: { x: 50, y: 25 } });
                    break;

                case 'type':
                    await this.page.click('[data-testid="type-signature-tab"]');
                    await this.page.fill('[data-testid="typed-signature-input"]', signatureData.data);
                    break;

                case 'upload':
                    await this.page.click('[data-testid="upload-signature-tab"]');
                    await this.page.setInputFiles('[data-testid="signature-upload-input"]', signatureData.data);
                    break;
            }
        } else {
            // Default to typed signature
            await this.page.click('[data-testid="type-signature-tab"]');
            await this.page.fill('[data-testid="typed-signature-input"]', 'Test Signature');
        }

        // Apply signature
        await this.page.click('[data-testid="apply-signature-button"]');

        // Complete signing
        await this.page.click('[data-testid="complete-signing-button"]');

        // Wait for completion confirmation
        await this.page.waitForSelector('[data-testid="signing-complete"]', { timeout: 10000 });
    }

    /**
     * Download a signed document
     */
    async downloadDocument(documentId: string) {
        await this.page.goto(`/documents/${documentId}`);

        // Start download
        const downloadPromise = this.page.waitForDownload();
        await this.page.click('[data-testid="download-button"]');
        const download = await downloadPromise;

        return download;
    }

    /**
     * Get document status
     */
    async getDocumentStatus(documentId: string) {
        await this.page.goto(`/documents/${documentId}`);

        const status = await this.page.textContent('[data-testid="document-status"]');
        return status?.trim();
    }

    /**
     * Get signing progress
     */
    async getSigningProgress(documentId: string) {
        await this.page.goto(`/documents/${documentId}`);

        const progress = await this.page.textContent('[data-testid="signing-progress"]');
        const recipients = await this.page.locator('[data-testid="recipient-status"]').allTextContents();

        return {
            progress: progress?.trim(),
            recipients: recipients.map(r => r.trim()),
        };
    }

    /**
     * Search documents
     */
    async searchDocuments(query: string) {
        await this.page.goto('/documents');

        await this.page.fill('[data-testid="document-search-input"]', query);
        await this.page.press('[data-testid="document-search-input"]', 'Enter');

        // Wait for search results
        await this.page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });

        const results = await this.page.locator('[data-testid="document-item"]').allTextContents();
        return results.map(r => r.trim());
    }

    /**
     * Filter documents by status
     */
    async filterDocumentsByStatus(status: string) {
        await this.page.goto('/documents');

        await this.page.selectOption('[data-testid="status-filter"]', status);

        // Wait for filtered results
        await this.page.waitForLoadState('networkidle');

        const documents = await this.page.locator('[data-testid="document-item"]').allTextContents();
        return documents.map(d => d.trim());
    }
}