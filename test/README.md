# Testing Infrastructure

This document describes the comprehensive testing infrastructure for the Signtusk platform.

## Overview

The testing infrastructure implements a multi-layered approach combining:

- **Unit Tests**: Verify specific functions, components, and modules using Vitest
- **Property-Based Tests**: Verify universal properties across all valid inputs using Fast-check
- **Integration Tests**: Test service interactions and data flows
- **End-to-End Tests**: Validate complete user journeys using Playwright
- **Performance Tests**: Ensure scalability and performance targets
- **Security Tests**: Validate security measures and compliance
- **Accessibility Tests**: Ensure WCAG 2.1 AA compliance

## Test Structure

```
test/
├── setup.ts                    # Global test setup and configuration
├── utils/
│   ├── generators.ts          # Property-based testing generators
│   └── test-helpers.ts        # Common test utilities
├── fixtures/
│   ├── auth.ts               # Authentication test data
│   ├── documents.ts          # Document test data
│   └── signatures.ts         # Signature test data
├── properties/               # Property-based tests
│   └── user-management.test.ts
└── README.md                # This file

e2e/
├── global-setup.ts          # E2E test setup
├── global-teardown.ts       # E2E test cleanup
└── auth/
    └── login.spec.ts        # Authentication E2E tests
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Run with coverage
npm run test:coverage
```

### Property-Based Tests

```bash
# Run property-based tests
npm run test:properties

# Run specific property test file
npx vitest test/properties/user-management.test.ts
```

### End-to-End Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific browser
npx playwright test --project=chromium

# Run specific test file
npx playwright test e2e/auth/login.spec.ts
```

### All Tests

```bash
# Run all tests (unit + E2E)
npm test
```

## Test Configuration

### Vitest Configuration

The Vitest configuration is located in `vitest.config.ts` and includes:

- Global test setup
- Coverage reporting with v8 provider
- Path aliases for easy imports
- Custom matchers and utilities

### Playwright Configuration

The Playwright configuration is located in `playwright.config.ts` and includes:

- Multi-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing
- Global setup and teardown
- Video and screenshot capture on failure
- Parallel test execution

### Fast-check Configuration

Property-based tests use Fast-check with:

- Minimum 100 iterations per property
- Custom generators for domain-specific data
- Proper tagging for requirement traceability

## Writing Tests

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { createUser } from '../src/user-service';

describe('User Service', () => {
  it('should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'SecurePassword123!',
    };
    
    const user = await createUser(userData);
    
    expect(user.id).toBeValidUUID();
    expect(user.email).toBe(userData.email);
    expect(user.name).toBe(userData.name);
  });
});
```

### Property-Based Tests

```typescript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { arbitraryUser } from '../utils/generators';

describe('User Properties', () => {
  it('should preserve user data through serialization', () => {
    /**
     * **Feature: docusign-alternative-comprehensive, Property X: Property Name**
     * **Validates: Requirements X.Y**
     */
    fc.assert(
      fc.property(arbitraryUser(), (user) => {
        const serialized = JSON.stringify(user);
        const deserialized = JSON.parse(serialized);
        
        expect(deserialized.id).toBe(user.id);
        expect(deserialized.email).toBe(user.email);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
```

### End-to-End Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="name"]', 'New User');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome, New User')).toBeVisible();
  });
});
```

## Test Data Management

### Fixtures

Test fixtures provide consistent, reusable test data:

```typescript
import { mockUsers, mockOrganizations } from '../fixtures/auth';

// Use in tests
const testUser = mockUsers.admin;
const testOrg = mockOrganizations.acme;
```

### Generators

Property-based test generators create random test data:

```typescript
import { arbitraryUser, arbitraryDocument } from '../utils/generators';

// Generate random user data
const userArbitrary = arbitraryUser();
const documentArbitrary = arbitraryDocument();
```

## Coverage Requirements

The testing infrastructure enforces the following coverage thresholds:

- **Backend Services**: 95%+ test coverage for all business logic
- **Frontend Components**: 90%+ coverage for UI components
- **API Endpoints**: 100% coverage for all public APIs
- **Critical Paths**: 100% coverage for signing workflows
- **Security Features**: 100% coverage for authentication and authorization

## Property-Based Testing Guidelines

### Property Tagging

All property-based tests must be tagged with:

```typescript
/**
 * **Feature: docusign-alternative-comprehensive, Property {number}: {property_text}**
 * **Validates: Requirements {requirement_number}**
 */
```

### Property Categories

1. **Invariants**: Properties that remain constant despite changes
2. **Round Trip**: Operations with their inverse return to original value
3. **Idempotence**: Doing operation twice equals doing it once
4. **Metamorphic**: Relationships between components
5. **Model Based**: Optimized vs standard implementation comparison

### Common Patterns

- **Serialization Round Trip**: `decode(encode(x)) == x`
- **Data Integrity**: Operations preserve essential properties
- **Access Control**: Permissions are enforced consistently
- **Validation**: Input validation is consistent and secure

## Continuous Integration

Tests are automatically run in CI/CD pipeline:

1. **Unit Tests**: Run on every commit
2. **Property Tests**: Run on every commit with 100+ iterations
3. **Integration Tests**: Run on pull requests
4. **E2E Tests**: Run on staging deployments
5. **Performance Tests**: Run nightly
6. **Security Tests**: Run on security-related changes

## Debugging Tests

### Vitest Debugging

```bash
# Run tests with debug output
npx vitest --reporter=verbose

# Run single test file
npx vitest test/specific-test.test.ts

# Run tests matching pattern
npx vitest --grep "user registration"
```

### Playwright Debugging

```bash
# Run with headed browser
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Generate test code
npx playwright codegen localhost:3000
```

### Property Test Debugging

When property tests fail, Fast-check provides counterexamples:

```typescript
// Failed property test output shows:
// Counterexample: {"email": "a@b.c", "password": "short"}
// Use this data to create focused unit tests
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
4. **Mock External Dependencies**: Use mocks for external services
5. **Test Edge Cases**: Include boundary conditions and error scenarios
6. **Performance Awareness**: Keep tests fast and efficient
7. **Maintainability**: Keep tests simple and focused

## Troubleshooting

### Common Issues

1. **Flaky Tests**: Use proper waits and assertions
2. **Slow Tests**: Optimize database operations and use mocks
3. **Memory Leaks**: Ensure proper cleanup in teardown
4. **Race Conditions**: Use proper synchronization in async tests

### Getting Help

- Check test logs for detailed error messages
- Use debugging tools provided by test frameworks
- Review test documentation and examples
- Consult team members for complex testing scenarios