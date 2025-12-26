import { Page, BrowserContext } from '@playwright/test';
import { testUsers } from '../fixtures/test-data';

/**
 * Authentication helpers for E2E tests
 */

export class AuthHelpers {
    constructor(private page: Page, private context: BrowserContext) { }

    /**
     * Login with email and password
     */
    async login(email: string, password: string) {
        await this.page.goto('/auth/login');

        await this.page.fill('[data-testid="email-input"]', email);
        await this.page.fill('[data-testid="password-input"]', password);
        await this.page.click('[data-testid="login-button"]');

        // Wait for successful login redirect
        await this.page.waitForURL('/dashboard', { timeout: 10000 });
    }

    /**
     * Login as admin user
     */
    async loginAsAdmin() {
        await this.login(testUsers.admin.email, testUsers.admin.password);
    }

    /**
     * Login as regular user
     */
    async loginAsUser() {
        await this.login(testUsers.user.email, testUsers.user.password);
    }

    /**
     * Login as signer
     */
    async loginAsSigner() {
        await this.login(testUsers.signer.email, testUsers.signer.password);
    }

    /**
     * Logout current user
     */
    async logout() {
        await this.page.click('[data-testid="user-menu-button"]');
        await this.page.click('[data-testid="logout-button"]');

        // Wait for redirect to login page
        await this.page.waitForURL('/auth/login', { timeout: 5000 });
    }

    /**
     * Register a new user
     */
    async register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        organizationName?: string;
    }) {
        await this.page.goto('/auth/register');

        await this.page.fill('[data-testid="first-name-input"]', userData.firstName);
        await this.page.fill('[data-testid="last-name-input"]', userData.lastName);
        await this.page.fill('[data-testid="email-input"]', userData.email);
        await this.page.fill('[data-testid="password-input"]', userData.password);

        if (userData.organizationName) {
            await this.page.fill('[data-testid="organization-name-input"]', userData.organizationName);
        }

        await this.page.click('[data-testid="register-button"]');

        // Wait for email verification page or dashboard
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Setup 2FA for current user
     */
    async setup2FA() {
        await this.page.goto('/settings/security');

        await this.page.click('[data-testid="enable-2fa-button"]');

        // Get the QR code or secret key
        const secretKey = await this.page.textContent('[data-testid="2fa-secret-key"]');

        // For testing, we'll use a mock TOTP code
        const mockTotpCode = '123456';
        await this.page.fill('[data-testid="2fa-code-input"]', mockTotpCode);
        await this.page.click('[data-testid="verify-2fa-button"]');

        return secretKey;
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            await this.page.waitForSelector('[data-testid="user-menu-button"]', { timeout: 2000 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get current user info from the page
     */
    async getCurrentUser() {
        if (!(await this.isAuthenticated())) {
            return null;
        }

        await this.page.click('[data-testid="user-menu-button"]');

        const email = await this.page.textContent('[data-testid="user-email"]');
        const name = await this.page.textContent('[data-testid="user-name"]');

        // Close the menu
        await this.page.click('[data-testid="user-menu-button"]');

        return { email, name };
    }

    /**
     * Save authentication state for reuse
     */
    async saveAuthState(filePath: string) {
        await this.context.storageState({ path: filePath });
    }

    /**
     * Load authentication state
     */
    static async loadAuthState(context: BrowserContext, filePath: string) {
        // This would be used when creating a new context with saved auth state
        // The actual loading happens during context creation
    }
}