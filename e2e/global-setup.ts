import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    console.log('🚀 Starting global setup for E2E tests...');

    // Launch browser for setup
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Wait for the application to be ready
        const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
        console.log(`📡 Checking if application is ready at ${baseURL}`);

        await page.goto(`${baseURL}/health`, { waitUntil: 'networkidle' });

        // Verify the application is healthy
        const healthStatus = await page.textContent('body');
        if (!healthStatus?.includes('OK') && !healthStatus?.includes('healthy')) {
            console.warn('⚠️  Health check endpoint not found, proceeding anyway...');
        } else {
            console.log('✅ Application health check passed');
        }

        // Set up test data if needed
        console.log('📊 Setting up test data...');

        // You can add database seeding or other setup tasks here
        // Example: await seedTestDatabase();

        console.log('✅ Global setup completed successfully');
    } catch (error) {
        console.error('❌ Global setup failed:', error);
        throw error;
    } finally {
        await context.close();
        await browser.close();
    }
}

export default globalSetup;