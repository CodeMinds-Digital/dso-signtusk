import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to login page before each test
        await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
        // Check that login form elements are present
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for invalid input', async ({ page }) => {
        // Try to submit empty form
        await page.click('button[type="submit"]');

        // Check for validation errors
        await expect(page.locator('text=Email is required')).toBeVisible();
        await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        // Fill in login form
        await page.fill('input[type="email"]', 'user@test.com');
        await page.fill('input[type="password"]', 'TestPassword123!');

        // Submit form
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('text=Welcome')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        // Fill in login form with invalid credentials
        await page.fill('input[type="email"]', 'invalid@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');

        // Submit form
        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.locator('text=Invalid email or password')).toBeVisible();

        // Should stay on login page
        await expect(page).toHaveURL('/login');
    });

    test('should support password reset flow', async ({ page }) => {
        // Click forgot password link
        await page.click('text=Forgot password?');

        // Should navigate to password reset page
        await expect(page).toHaveURL('/reset-password');

        // Fill in email
        await page.fill('input[type="email"]', 'user@test.com');

        // Submit reset request
        await page.click('button[type="submit"]');

        // Should show success message
        await expect(page.locator('text=Password reset email sent')).toBeVisible();
    });

    test('should support two-factor authentication', async ({ page }) => {
        // Login with 2FA enabled user
        await page.fill('input[type="email"]', 'user-2fa@test.com');
        await page.fill('input[type="password"]', 'TestPassword123!');
        await page.click('button[type="submit"]');

        // Should redirect to 2FA page
        await expect(page).toHaveURL('/two-factor');
        await expect(page.locator('text=Enter verification code')).toBeVisible();

        // Enter 2FA code
        await page.fill('input[name="code"]', '123456');
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
    });

    test('should remember login with "Remember me" option', async ({ page }) => {
        // Check remember me option
        await page.check('input[name="remember"]');

        // Login
        await page.fill('input[type="email"]', 'user@test.com');
        await page.fill('input[type="password"]', 'TestPassword123!');
        await page.click('button[type="submit"]');

        // Should set persistent cookie
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name === 'session');

        expect(sessionCookie).toBeDefined();
        expect(sessionCookie?.expires).toBeGreaterThan(Date.now() / 1000 + 86400); // More than 1 day
    });

    test('should logout successfully', async ({ page }) => {
        // Login first
        await page.fill('input[type="email"]', 'user@test.com');
        await page.fill('input[type="password"]', 'TestPassword123!');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page).toHaveURL('/dashboard');

        // Click logout
        await page.click('[data-testid="user-menu"]');
        await page.click('text=Logout');

        // Should redirect to login page
        await expect(page).toHaveURL('/login');

        // Session cookie should be cleared
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name === 'session');
        expect(sessionCookie).toBeUndefined();
    });
});