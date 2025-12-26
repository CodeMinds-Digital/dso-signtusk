import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';
import { AuthHelpers } from './utils/auth-helpers';
import { testUsers } from './fixtures/test-data';

test.describe('Authentication', () => {
    let loginPage: LoginPage;
    let dashboardPage: DashboardPage;
    let authHelpers: AuthHelpers;

    test.beforeEach(async ({ page, context }) => {
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        authHelpers = new AuthHelpers(page, context);
    });

    test('should login with valid credentials', async ({ page }) => {
        await loginPage.goto();
        await loginPage.waitForLoginForm();

        await loginPage.login(testUsers.user.email, testUsers.user.password);

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        await dashboardPage.waitForDashboardLoad();

        // Should show welcome message
        const welcomeMessage = await dashboardPage.getWelcomeMessage();
        expect(welcomeMessage).toContain('Welcome');
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await loginPage.goto();
        await loginPage.waitForLoginForm();

        await loginPage.login('invalid@email.com', 'wrongpassword');

        // Should show error message
        await expect(loginPage.errorMessage).toBeVisible();
        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toContain('Invalid credentials');

        // Should stay on login page
        await expect(page).toHaveURL('/auth/login');
    });

    test('should handle two-factor authentication', async ({ page }) => {
        await loginPage.goto();
        await loginPage.waitForLoginForm();

        // Assuming admin user has 2FA enabled
        await loginPage.login(testUsers.admin.email, testUsers.admin.password);

        // Should show 2FA form
        await loginPage.waitForTwoFactorForm();
        expect(await loginPage.twoFactorInput.isVisible()).toBe(true);

        // Enter 2FA code (in real tests, you'd generate this properly)
        await loginPage.loginWithTwoFactor(
            testUsers.admin.email,
            testUsers.admin.password,
            '123456'
        );

        // Should redirect to dashboard after successful 2FA
        await expect(page).toHaveURL('/dashboard');
    });

    test('should logout successfully', async ({ page, context }) => {
        // Login first
        await authHelpers.loginAsUser();
        await expect(page).toHaveURL('/dashboard');

        // Logout
        await authHelpers.logout();
        await expect(page).toHaveURL('/auth/login');

        // Should not be able to access protected pages
        await page.goto('/dashboard');
        await expect(page).toHaveURL('/auth/login');
    });

    test('should redirect to login when accessing protected pages without auth', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL('/auth/login');

        await page.goto('/documents');
        await expect(page).toHaveURL('/auth/login');

        await page.goto('/settings');
        await expect(page).toHaveURL('/auth/login');
    });

    test('should remember user session after page refresh', async ({ page, context }) => {
        await authHelpers.loginAsUser();
        await expect(page).toHaveURL('/dashboard');

        // Refresh the page
        await page.reload();

        // Should still be logged in
        await expect(page).toHaveURL('/dashboard');
        expect(await authHelpers.isAuthenticated()).toBe(true);
    });

    test('should handle forgot password flow', async ({ page }) => {
        await loginPage.goto();
        await loginPage.clickForgotPassword();

        await expect(page).toHaveURL('/auth/forgot-password');

        // Fill in email
        await page.fill('[data-testid="reset-email-input"]', testUsers.user.email);
        await page.click('[data-testid="send-reset-button"]');

        // Should show confirmation message
        await expect(page.locator('[data-testid="reset-sent-message"]')).toBeVisible();
    });

    test('should navigate to registration from login', async ({ page }) => {
        await loginPage.goto();
        await loginPage.clickRegister();

        await expect(page).toHaveURL('/auth/register');
        await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
    });
});