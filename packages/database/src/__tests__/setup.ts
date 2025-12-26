import { beforeAll } from 'vitest';

beforeAll(() => {
    // Set test environment variables
    if (!process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL) {
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/docusign_alternative_test?schema=public';
    }
});