import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
    console.log('🧹 Starting global teardown for E2E tests...');

    try {
        // Clean up test data
        console.log('🗑️  Cleaning up test data...');

        // You can add database cleanup or other teardown tasks here
        // Example: await cleanupTestDatabase();

        console.log('✅ Global teardown completed successfully');
    } catch (error) {
        console.error('❌ Global teardown failed:', error);
        // Don't throw here to avoid masking test failures
    }
}

export default globalTeardown;