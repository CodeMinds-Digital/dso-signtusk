import { test, expect } from '@playwright/test';

test.describe('E2E Infrastructure Test', () => {
    test('Playwright is working correctly', async ({ page }) => {
        // Navigate to a simple page
        await page.goto('https://example.com');

        // Check that the page loaded
        await expect(page).toHaveTitle(/Example Domain/);

        // Check that we can find elements
        const heading = page.locator('h1');
        await expect(heading).toBeVisible();
        await expect(heading).toContainText('Example Domain');
    });

    test('Browser context is working', async ({ page, context }) => {
        // Test that we can create pages and navigate
        await page.goto('https://httpbin.org/json');

        // Check that JSON response is displayed
        const body = await page.textContent('body');
        expect(body).toContain('slideshow');
    });

    test('Page interactions work', async ({ page }) => {
        await page.goto('https://httpbin.org/forms/post');

        // Fill out a form
        await page.fill('input[name="custname"]', 'Test User');
        await page.fill('input[name="custtel"]', '123-456-7890');
        await page.fill('input[name="custemail"]', 'test@example.com');

        // Check that values were filled
        await expect(page.locator('input[name="custname"]')).toHaveValue('Test User');
        await expect(page.locator('input[name="custtel"]')).toHaveValue('123-456-7890');
        await expect(page.locator('input[name="custemail"]')).toHaveValue('test@example.com');
    });
});