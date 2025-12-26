import { Page, Locator } from '@playwright/test';

/**
 * Login Page Object Model
 */
export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly forgotPasswordLink: Locator;
    readonly registerLink: Locator;
    readonly errorMessage: Locator;
    readonly twoFactorInput: Locator;
    readonly verifyTwoFactorButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.locator('[data-testid="email-input"]');
        this.passwordInput = page.locator('[data-testid="password-input"]');
        this.loginButton = page.locator('[data-testid="login-button"]');
        this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
        this.registerLink = page.locator('[data-testid="register-link"]');
        this.errorMessage = page.locator('[data-testid="error-message"]');
        this.twoFactorInput = page.locator('[data-testid="two-factor-input"]');
        this.verifyTwoFactorButton = page.locator('[data-testid="verify-two-factor-button"]');
    }

    async goto() {
        await this.page.goto('/auth/login');
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async loginWithTwoFactor(email: string, password: string, twoFactorCode: string) {
        await this.login(email, password);

        // Wait for 2FA input to appear
        await this.twoFactorInput.waitFor({ state: 'visible', timeout: 5000 });

        await this.twoFactorInput.fill(twoFactorCode);
        await this.verifyTwoFactorButton.click();
    }

    async clickForgotPassword() {
        await this.forgotPasswordLink.click();
    }

    async clickRegister() {
        await this.registerLink.click();
    }

    async getErrorMessage() {
        return await this.errorMessage.textContent();
    }

    async isErrorVisible() {
        return await this.errorMessage.isVisible();
    }

    async waitForLoginForm() {
        await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    }

    async waitForTwoFactorForm() {
        await this.twoFactorInput.waitFor({ state: 'visible', timeout: 10000 });
    }
}