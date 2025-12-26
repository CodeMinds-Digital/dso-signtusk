import fc from 'fast-check';
import { describe, test, expect } from 'vitest';

/**
 * Property-based testing setup and utilities
 */

// Custom arbitraries for domain-specific data
export const arbitraries = {
    // User data arbitraries
    email: () => fc.emailAddress(),
    password: () => fc.string({ minLength: 8, maxLength: 128 })
        .filter(s => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(s)),

    uuid: () => fc.uuid(),

    // Document arbitraries
    documentName: () => fc.string({ minLength: 1, maxLength: 255 })
        .filter(s => s.trim().length > 0 && !/[<>:"/\\|?*]/.test(s)),

    documentStatus: () => fc.constantFrom('draft', 'pending', 'completed', 'cancelled'),

    // Signature field arbitraries
    coordinates: () => fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
        width: fc.integer({ min: 10, max: 500 }),
        height: fc.integer({ min: 10, max: 200 }),
    }),

    fieldType: () => fc.constantFrom('signature', 'text', 'date', 'checkbox'),

    // Organization arbitraries
    organizationName: () => fc.string({ minLength: 1, maxLength: 100 })
        .filter(s => s.trim().length > 0),

    domain: () => fc.domain(),

    // Date arbitraries
    pastDate: () => fc.date({ max: new Date() }),
    futureDate: () => fc.date({ min: new Date() }),

    // File arbitraries
    fileSize: () => fc.integer({ min: 1, max: 25 * 1024 * 1024 }), // 1 byte to 25MB
    mimeType: () => fc.constantFrom('application/pdf', 'image/png', 'image/jpeg'),

    // API arbitraries
    httpMethod: () => fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
    httpStatus: () => fc.integer({ min: 100, max: 599 }),

    // Security arbitraries
    ipAddress: () => fc.ipV4(),
    userAgent: () => fc.string({ minLength: 10, maxLength: 200 }),
};

// Property test helpers
export const propertyTestHelpers = {
    /**
     * Run a property test with custom configuration
     */
    runProperty: <T>(
        arbitrary: fc.Arbitrary<T>,
        predicate: (value: T) => boolean | Promise<boolean>,
        options: {
            numRuns?: number;
            seed?: number;
            timeout?: number;
            examples?: T[];
        } = {}
    ) => {
        const config = {
            numRuns: options.numRuns || 100,
            seed: options.seed,
            timeout: options.timeout || 5000,
            examples: options.examples,
        };

        return fc.assert(
            fc.asyncProperty(arbitrary, predicate),
            config
        );
    },

    /**
     * Create a property test that validates invariants
     */
    invariant: <T>(
        name: string,
        arbitrary: fc.Arbitrary<T>,
        invariant: (value: T) => boolean | Promise<boolean>
    ) => {
        test(`Property: ${name}`, async () => {
            await propertyTestHelpers.runProperty(arbitrary, invariant);
        });
    },

    /**
     * Create a property test for round-trip operations
     */
    roundTrip: <T, U>(
        name: string,
        arbitrary: fc.Arbitrary<T>,
        encode: (value: T) => U,
        decode: (encoded: U) => T,
        equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
    ) => {
        test(`Round-trip property: ${name}`, async () => {
            await propertyTestHelpers.runProperty(
                arbitrary,
                (original) => {
                    const encoded = encode(original);
                    const decoded = decode(encoded);
                    return equals(original, decoded);
                }
            );
        });
    },

    /**
     * Create a property test for idempotent operations
     */
    idempotent: <T>(
        name: string,
        arbitrary: fc.Arbitrary<T>,
        operation: (value: T) => T,
        equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
    ) => {
        test(`Idempotent property: ${name}`, async () => {
            await propertyTestHelpers.runProperty(
                arbitrary,
                (value) => {
                    const once = operation(value);
                    const twice = operation(once);
                    return equals(once, twice);
                }
            );
        });
    },

    /**
     * Create a property test for commutative operations
     */
    commutative: <T>(
        name: string,
        arbitrary: fc.Arbitrary<T>,
        operation: (a: T, b: T) => T,
        equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
    ) => {
        test(`Commutative property: ${name}`, async () => {
            await propertyTestHelpers.runProperty(
                fc.tuple(arbitrary, arbitrary),
                ([a, b]) => {
                    const ab = operation(a, b);
                    const ba = operation(b, a);
                    return equals(ab, ba);
                }
            );
        });
    },

    /**
     * Create a property test for associative operations
     */
    associative: <T>(
        name: string,
        arbitrary: fc.Arbitrary<T>,
        operation: (a: T, b: T) => T,
        equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
    ) => {
        test(`Associative property: ${name}`, async () => {
            await propertyTestHelpers.runProperty(
                fc.tuple(arbitrary, arbitrary, arbitrary),
                ([a, b, c]) => {
                    const ab_c = operation(operation(a, b), c);
                    const a_bc = operation(a, operation(b, c));
                    return equals(ab_c, a_bc);
                }
            );
        });
    },
};

// Common property patterns
export const commonProperties = {
    /**
     * Test that serialization/deserialization preserves data
     */
    serializationRoundTrip: <T>(
        name: string,
        arbitrary: fc.Arbitrary<T>,
        serialize: (value: T) => string,
        deserialize: (serialized: string) => T
    ) => {
        propertyTestHelpers.roundTrip(
            `${name} serialization`,
            arbitrary,
            serialize,
            deserialize
        );
    },

    /**
     * Test that validation functions are consistent
     */
    validationConsistency: <T>(
        name: string,
        arbitrary: fc.Arbitrary<T>,
        validate: (value: T) => boolean,
        transform: (value: T) => T
    ) => {
        propertyTestHelpers.invariant(
            `${name} validation consistency`,
            arbitrary,
            (value) => {
                const isValid = validate(value);
                if (isValid) {
                    const transformed = transform(value);
                    return validate(transformed);
                }
                return true; // If invalid input, no consistency requirement
            }
        );
    },

    /**
     * Test that operations preserve invariants
     */
    invariantPreservation: <T>(
        name: string,
        arbitrary: fc.Arbitrary<T>,
        invariant: (value: T) => boolean,
        operation: (value: T) => T
    ) => {
        propertyTestHelpers.invariant(
            `${name} invariant preservation`,
            arbitrary.filter(invariant),
            (value) => {
                const result = operation(value);
                return invariant(result);
            }
        );
    },

    /**
     * Test that error handling is consistent
     */
    errorHandlingConsistency: <T, E>(
        name: string,
        arbitrary: fc.Arbitrary<T>,
        operation: (value: T) => E | never,
        isError: (result: E) => boolean
    ) => {
        propertyTestHelpers.invariant(
            `${name} error handling`,
            arbitrary,
            (value) => {
                try {
                    const result = operation(value);
                    return !isError(result);
                } catch (error) {
                    return true; // Throwing is acceptable error handling
                }
            }
        );
    },
};

// Test data generators for complex scenarios
export const generators = {
    /**
     * Generate valid user registration data
     */
    userRegistration: () => fc.record({
        email: arbitraries.email(),
        password: arbitraries.password(),
        firstName: fc.string({ minLength: 1, maxLength: 50 }),
        lastName: fc.string({ minLength: 1, maxLength: 50 }),
        organizationName: fc.option(arbitraries.organizationName()),
    }),

    /**
     * Generate valid document upload data
     */
    documentUpload: () => fc.record({
        name: arbitraries.documentName(),
        size: arbitraries.fileSize(),
        mimeType: fc.constant('application/pdf'),
        content: fc.uint8Array({ minLength: 100, maxLength: 1000 }),
    }),

    /**
     * Generate valid signature field data
     */
    signatureField: () => fc.record({
        id: arbitraries.uuid(),
        type: arbitraries.fieldType(),
        page: fc.integer({ min: 1, max: 100 }),
        coordinates: arbitraries.coordinates(),
        required: fc.boolean(),
        label: fc.string({ minLength: 1, maxLength: 100 }),
    }),

    /**
     * Generate valid API request data
     */
    apiRequest: () => fc.record({
        method: arbitraries.httpMethod(),
        path: fc.string({ minLength: 1, maxLength: 200 }).map(s => `/${s}`),
        headers: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 0, maxLength: 200 })
        ),
        body: fc.option(fc.object()),
        query: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 0, maxLength: 100 })
        ),
    }),
};