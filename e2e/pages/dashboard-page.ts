import { Page, Locator } from '@playwright/test';

/**
 * Dashboard Page Object Model
 */
export class DashboardPage {
    readonly page: Page;
    readonly welcomeMessage: Locator;
    readonly recentDocuments: Locator;
    readonly quickActions: Locator;
    readonly uploadButton: Locator;
    readonly createTemplateButton: Locator;
    readonly statsCards: Locator;

    constructor(page: Page) {
        this.page = page;
        this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
        this.recentDocuments = page.locator('[data-testid="recent-documents"]');
        this.quickActions = page.locator('[data-testid="quick-actions"]');
        this.uploadButton = page.locator('[data-testid="upload-document-button"]');
        this.createTemplateButton = page.locator('[data-testid="create-template-button"]');
        this.statsCards = page.locator('[data-testid="stats-card"]');
    }

    async goto() {
        await this.page.goto('/dashboard');
    }

    async getWelcomeMessage() {
        return await this.welcomeMessage.textContent();
    }

    async getRecentDocuments() {
        const documents = await this.recentDocuments.locator('[data-testid="document-item"]').all();
        const documentData = [];

        for (const doc of documents) {
            const name = await doc.locator('[data-testid="document-name"]').textContent();
            const status = await doc.locator('[data-testid="document-status"]').textContent();
            const date = await doc.locator('[data-testid="document-date"]').textContent();

            documentData.push({
                name: name?.trim(),
                status: status?.trim(),
                date: date?.trim(),
            });
        }

        return documentData;
    }

    async clickUploadDocument() {
        await this.uploadButton.click();
    }

    async clickCreateTemplate() {
        await this.createTemplateButton.click();
    }

    async getStats() {
        const cards = await this.statsCards.all();
        const stats = [];

        for (const card of cards) {
            const label = await card.locator('[data-testid="stat-label"]').textContent();
            const value = await card.locator('[data-testid="stat-value"]').textContent();

            stats.push({
                label: label?.trim(),
                value: value?.trim(),
            });
        }

        return stats;
    }

    async waitForDashboardLoad() {
        await this.page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
    }
}