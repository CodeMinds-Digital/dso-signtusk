import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { DocumentHelpers } from './utils/document-helpers';
import { DashboardPage } from './pages/dashboard-page';
import { testUsers, testDocuments } from './fixtures/test-data';

test.describe('Document Workflow', () => {
    let authHelpers: AuthHelpers;
    let documentHelpers: DocumentHelpers;
    let dashboardPage: DashboardPage;

    test.beforeEach(async ({ page, context }) => {
        authHelpers = new AuthHelpers(page, context);
        documentHelpers = new DocumentHelpers(page);
        dashboardPage = new DashboardPage(page);

        // Login as user for each test
        await authHelpers.loginAsUser();
    });

    test('should upload a document successfully', async ({ page }) => {
        await page.goto('/documents/upload');

        // Mock file upload (in real tests, you'd have actual test files)
        const fileInput = page.locator('[data-testid="file-upload-input"]');

        // Create a mock PDF file for testing
        const mockPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n178\n%%EOF');

        await fileInput.setInputFiles({
            name: 'test-document.pdf',
            mimeType: 'application/pdf',
            buffer: mockPdfContent,
        });

        await page.fill('[data-testid="document-name-input"]', 'Test Contract');
        await page.click('[data-testid="upload-button"]');

        // Should show success message
        await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();

        // Should redirect to document preparation
        await expect(page).toHaveURL(/\/documents\/[^\/]+\/prepare/);
    });

    test('should create and send signing request', async ({ page }) => {
        // First upload a document
        await page.goto('/documents/upload');

        const mockPdfContent = Buffer.from('%PDF-1.4\ntest content');
        await page.locator('[data-testid="file-upload-input"]').setInputFiles({
            name: 'signing-test.pdf',
            mimeType: 'application/pdf',
            buffer: mockPdfContent,
        });

        await page.fill('[data-testid="document-name-input"]', 'Signing Test Document');
        await page.click('[data-testid="upload-button"]');

        // Wait for redirect to preparation page
        await page.waitForURL(/\/documents\/[^\/]+\/prepare/);

        // Add a recipient
        await page.click('[data-testid="add-recipient-button"]');
        await page.fill('[data-testid="recipient-email"]', testUsers.signer.email);
        await page.fill('[data-testid="recipient-name"]', `${testUsers.signer.firstName} ${testUsers.signer.lastName}`);

        // Add signature field (simplified for test)
        await page.click('[data-testid="add-signature-field-button"]');

        // Send for signing
        await page.click('[data-testid="send-for-signing-button"]');

        // Should show confirmation
        await expect(page.locator('[data-testid="signing-request-sent"]')).toBeVisible();
    });

    test('should view document list and filter by status', async ({ page }) => {
        await page.goto('/documents');

        // Should show documents list
        await expect(page.locator('[data-testid="documents-list"]')).toBeVisible();

        // Test status filter
        await page.selectOption('[data-testid="status-filter"]', 'pending');
        await page.waitForLoadState('networkidle');

        // All visible documents should have pending status
        const documentStatuses = await page.locator('[data-testid="document-status"]').allTextContents();
        for (const status of documentStatuses) {
            expect(status.toLowerCase()).toContain('pending');
        }
    });

    test('should search documents', async ({ page }) => {
        await page.goto('/documents');

        const searchTerm = 'contract';
        await page.fill('[data-testid="document-search-input"]', searchTerm);
        await page.press('[data-testid="document-search-input"]', 'Enter');

        await page.waitForSelector('[data-testid="search-results"]');

        // All results should contain the search term
        const documentNames = await page.locator('[data-testid="document-name"]').allTextContents();
        for (const name of documentNames) {
            expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
        }
    });

    test('should view document details', async ({ page }) => {
        await page.goto('/documents');

        // Click on first document
        await page.click('[data-testid="document-item"]');

        // Should navigate to document details
        await expect(page).toHaveURL(/\/documents\/[^\/]+$/);

        // Should show document information
        await expect(page.locator('[data-testid="document-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="document-status"]')).toBeVisible();
        await expect(page.locator('[data-testid="document-created-date"]')).toBeVisible();
    });

    test('should download completed document', async ({ page }) => {
        // Navigate to a completed document (this would need to be set up in test data)
        await page.goto('/documents');

        // Find a completed document
        const completedDoc = page.locator('[data-testid="document-item"]')
            .filter({ has: page.locator('[data-testid="document-status"]:has-text("completed")') })
            .first();

        if (await completedDoc.count() > 0) {
            await completedDoc.click();

            // Should be able to download
            const downloadPromise = page.waitForDownload();
            await page.click('[data-testid="download-button"]');
            const download = await downloadPromise;

            expect(download.suggestedFilename()).toMatch(/\.pdf$/);
        }
    });

    test('should show recent documents on dashboard', async ({ page }) => {
        await dashboardPage.goto();
        await dashboardPage.waitForDashboardLoad();

        const recentDocs = await dashboardPage.getRecentDocuments();

        // Should show some recent documents
        expect(recentDocs.length).toBeGreaterThan(0);

        // Each document should have required fields
        for (const doc of recentDocs) {
            expect(doc.name).toBeTruthy();
            expect(doc.status).toBeTruthy();
            expect(doc.date).toBeTruthy();
        }
    });

    test('should navigate to upload from dashboard', async ({ page }) => {
        await dashboardPage.goto();
        await dashboardPage.clickUploadDocument();

        await expect(page).toHaveURL('/documents/upload');
    });
});