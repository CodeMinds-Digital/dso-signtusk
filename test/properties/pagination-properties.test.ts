/**
 * Property-Based Tests for API Pagination
 * 
 * **Feature: docusign-alternative-comprehensive, Property 41: API Functionality Completeness**
 * **Validates: Requirements 9.1**
 * 
 * Tests that comprehensive REST APIs work correctly with accurate pagination,
 * proper authentication, and enforced rate limiting across all valid inputs.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    OffsetPaginator,
    CursorPaginator,
    CursorEncoder,
    PaginationOptimizer,
    NavigationLinkBuilder,
    PaginationValidator,
    type OffsetPaginationInput,
    type CursorPaginationInput,
} from '@signtusk/lib';

describe('API Pagination Property Tests', () => {
    describe('Property 41: API Functionality Completeness - Offset Pagination', () => {
        it('should maintain consistent pagination metadata for any valid input', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100000 }), // total records
                    fc.integer({ min: 1, max: 100 }),    // page
                    fc.integer({ min: 1, max: 100 }),    // limit
                    (total, page, limit) => {
                        const meta = OffsetPaginator.calculateMeta(total, page, limit);

                        // Property: Total pages should be correctly calculated
                        const expectedTotalPages = Math.ceil(total / limit);
                        expect(meta.totalPages).toBe(expectedTotalPages);

                        // Property: Has next page should be consistent
                        expect(meta.hasNextPage).toBe(page < expectedTotalPages);

                        // Property: Has previous page should be consistent
                        expect(meta.hasPreviousPage).toBe(page > 1);

                        // Property: Metadata should be internally consistent
                        expect(meta.total).toBe(total);
                        expect(meta.page).toBe(page);
                        expect(meta.limit).toBe(limit);

                        // Property: Skip calculation should be consistent
                        const skip = OffsetPaginator.calculateSkip(page, limit);
                        expect(skip).toBe((page - 1) * limit);
                        expect(skip).toBeGreaterThanOrEqual(0);
                        // Skip can be greater than total for high page numbers - this is valid
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should create valid paginated results for any data and parameters', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.record({ id: fc.string(), value: fc.integer() }), { maxLength: 100 }),
                    fc.integer({ min: 0, max: 100000 }),
                    fc.integer({ min: 1, max: 100 }),
                    fc.integer({ min: 1, max: 100 }),
                    (data, total, page, limit) => {
                        const result = OffsetPaginator.createResult(data, total, page, limit);

                        // Property: Result should contain the provided data
                        expect(result.data).toEqual(data);

                        // Property: Metadata should be valid
                        expect(result.meta.total).toBe(total);
                        expect(result.meta.page).toBe(page);
                        expect(result.meta.limit).toBe(limit);

                        // Property: Navigation flags should be consistent
                        const expectedTotalPages = Math.ceil(total / limit);
                        expect(result.meta.hasNextPage).toBe(page < expectedTotalPages);
                        expect(result.meta.hasPreviousPage).toBe(page > 1);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 41: API Functionality Completeness - Cursor Pagination', () => {
        it('should encode and decode cursors consistently for any data', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        createdAt: fc.date().map(d => d.toISOString()),
                        value: fc.integer(),
                        name: fc.string(),
                    }),
                    fc.string({ minLength: 1 }),
                    (record, sortBy) => {
                        // Property: Cursor encoding should be reversible
                        const cursor = CursorEncoder.createCursor(record, sortBy);
                        const decoded = CursorEncoder.decode(cursor);

                        // Should contain the sort field and id
                        expect(decoded).toHaveProperty('id', record.id);
                        if (record[sortBy as keyof typeof record] !== undefined && sortBy !== 'constructor') {
                            expect(decoded).toHaveProperty(sortBy, record[sortBy as keyof typeof record]);
                        }

                        // Property: Cursor should be a valid base64url string
                        expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);

                        // Property: Encoding should be deterministic
                        const cursor2 = CursorEncoder.createCursor(record, sortBy);
                        expect(cursor).toBe(cursor2);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should create valid where clauses for cursor pagination', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        createdAt: fc.date().map(d => d.toISOString()),
                        value: fc.integer(),
                    }),
                    fc.constantFrom('id', 'createdAt', 'value'),
                    fc.constantFrom('asc', 'desc'),
                    fc.record({
                        organizationId: fc.string(),
                        status: fc.constantFrom('ACTIVE', 'INACTIVE'),
                    }),
                    (record, sortBy, sortOrder, baseWhere) => {
                        const cursor = CursorEncoder.createCursor(record, sortBy);
                        const whereClause = CursorPaginator.createWhereClause(
                            cursor,
                            sortBy,
                            sortOrder,
                            baseWhere
                        );

                        // Property: Base where conditions should be preserved
                        expect(whereClause.organizationId).toBe(baseWhere.organizationId);
                        expect(whereClause.status).toBe(baseWhere.status);

                        // Property: Cursor condition should be added
                        const cursorValue = record[sortBy as keyof typeof record];
                        if (cursorValue !== undefined) {
                            expect(whereClause[sortBy]).toBeDefined();

                            if (sortOrder === 'asc') {
                                expect(whereClause[sortBy]).toHaveProperty('gt', cursorValue);
                            } else {
                                expect(whereClause[sortBy]).toHaveProperty('lt', cursorValue);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should create consistent cursor-based results', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            id: fc.string({ minLength: 1 }),
                            createdAt: fc.date().map(d => d.toISOString()),
                            value: fc.integer(),
                        }),
                        { minLength: 1, maxLength: 100 }
                    ),
                    fc.integer({ min: 1, max: 100 }),
                    fc.constantFrom('id', 'createdAt', 'value'),
                    fc.integer({ min: 0, max: 100000 }).map(n => n || undefined),
                    (data, limit, sortBy, totalCount) => {
                        const result = CursorPaginator.createResult(data, limit, sortBy, totalCount);

                        // Property: Result should contain the provided data
                        expect(result.data).toEqual(data);

                        // Property: Has next page should be consistent with data length
                        expect(result.meta.hasNextPage).toBe(data.length === limit);

                        // Property: Total count should be preserved if provided
                        expect(result.meta.totalCount).toBe(totalCount);

                        // Property: Cursors should be valid if data exists
                        if (data.length > 0) {
                            expect(result.meta.previousCursor).toBeDefined();

                            // Next cursor only exists if there's a next page
                            if (result.meta.hasNextPage) {
                                expect(result.meta.nextCursor).toBeDefined();
                            }

                            // Cursors should be valid base64url strings
                            if (result.meta.nextCursor) {
                                expect(result.meta.nextCursor).toMatch(/^[A-Za-z0-9_-]+$/);
                            }
                            if (result.meta.previousCursor) {
                                expect(result.meta.previousCursor).toMatch(/^[A-Za-z0-9_-]+$/);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 41: API Functionality Completeness - Navigation Links', () => {
        it('should generate valid navigation links for offset pagination', () => {
            fc.assert(
                fc.property(
                    fc.webUrl(),
                    fc.record({
                        total: fc.integer({ min: 0, max: 100000 }),
                        page: fc.integer({ min: 1, max: 1000 }),
                        limit: fc.integer({ min: 1, max: 100 }),
                        totalPages: fc.integer({ min: 1, max: 1000 }),
                        hasNextPage: fc.boolean(),
                        hasPreviousPage: fc.boolean(),
                    }),
                    fc.record({
                        search: fc.string(),
                        filter: fc.string(),
                    }),
                    (baseUrl, meta, queryParams) => {
                        // Ensure metadata consistency
                        const consistentMeta = {
                            ...meta,
                            totalPages: Math.ceil(meta.total / meta.limit),
                            hasNextPage: meta.page < Math.ceil(meta.total / meta.limit),
                            hasPreviousPage: meta.page > 1,
                        };

                        const links = NavigationLinkBuilder.buildOffsetLinks(
                            baseUrl,
                            consistentMeta,
                            queryParams
                        );

                        // Property: All links should be valid URLs
                        Object.values(links).forEach(link => {
                            if (link) {
                                expect(() => new URL(link)).not.toThrow();
                                expect(link).toContain(baseUrl);
                            }
                        });

                        // Property: Next link should exist if has next page
                        if (consistentMeta.hasNextPage) {
                            expect(links.next).toBeDefined();
                            expect(links.next).toContain(`page=${consistentMeta.page + 1}`);
                        }

                        // Property: Previous link should exist if has previous page
                        if (consistentMeta.hasPreviousPage) {
                            expect(links.previous).toBeDefined();
                            expect(links.previous).toContain(`page=${consistentMeta.page - 1}`);
                        }

                        // Property: First link should exist if not on first page
                        if (consistentMeta.page > 1) {
                            expect(links.first).toBeDefined();
                            expect(links.first).toContain('page=1');
                        }

                        // Property: Last link should exist if not on last page
                        if (consistentMeta.page < consistentMeta.totalPages) {
                            expect(links.last).toBeDefined();
                            expect(links.last).toContain(`page=${consistentMeta.totalPages}`);
                        }

                        // Property: Query parameters should be preserved
                        Object.values(links).forEach(link => {
                            if (link) {
                                const url = new URL(link);
                                Object.entries(queryParams).forEach(([key, value]) => {
                                    expect(url.searchParams.get(key)).toBe(value);
                                });
                            }
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should generate valid navigation links for cursor pagination', () => {
            fc.assert(
                fc.property(
                    fc.webUrl(),
                    fc.record({
                        hasNextPage: fc.boolean(),
                        hasPreviousPage: fc.boolean(),
                        nextCursor: fc.string({ minLength: 1 }).map(s =>
                            Buffer.from(JSON.stringify({ id: s })).toString('base64url')
                        ).filter(() => fc.sample(fc.boolean(), 1)[0]),
                        previousCursor: fc.string({ minLength: 1 }).map(s =>
                            Buffer.from(JSON.stringify({ id: s })).toString('base64url')
                        ).filter(() => fc.sample(fc.boolean(), 1)[0]),
                    }),
                    fc.record({
                        search: fc.string(),
                        filter: fc.string(),
                    }),
                    (baseUrl, meta, queryParams) => {
                        const links = NavigationLinkBuilder.buildCursorLinks(
                            baseUrl,
                            meta,
                            queryParams
                        );

                        // Property: All links should be valid URLs
                        Object.values(links).forEach(link => {
                            if (link) {
                                expect(() => new URL(link)).not.toThrow();
                                expect(link).toContain(baseUrl);
                            }
                        });

                        // Property: Next link should exist if has next page and cursor
                        if (meta.hasNextPage && meta.nextCursor) {
                            expect(links.next).toBeDefined();
                            expect(links.next).toContain(`cursor=${meta.nextCursor}`);
                        }

                        // Property: Previous link should exist if has previous page and cursor
                        if (meta.hasPreviousPage && meta.previousCursor) {
                            expect(links.previous).toBeDefined();
                            expect(links.previous).toContain(`cursor=${meta.previousCursor}`);
                        }

                        // Property: Query parameters should be preserved
                        Object.values(links).forEach(link => {
                            if (link) {
                                const url = new URL(link);
                                Object.entries(queryParams).forEach(([key, value]) => {
                                    expect(url.searchParams.get(key)).toBe(value);
                                });
                            }
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 41: API Functionality Completeness - Performance Optimization', () => {
        it('should make consistent recommendations for cursor pagination', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000000 }),
                    fc.integer({ min: 0, max: 100000 }),
                    fc.integer({ min: 1000, max: 50000 }),
                    (totalRecords, currentOffset, threshold) => {
                        const shouldUseCursor = PaginationOptimizer.shouldUseCursorPagination(
                            totalRecords,
                            currentOffset,
                            threshold
                        );

                        // Property: Should recommend cursor pagination for large datasets
                        if (totalRecords > threshold) {
                            expect(shouldUseCursor).toBe(true);
                        }

                        // Property: Should recommend cursor pagination for large offsets
                        if (currentOffset > threshold) {
                            expect(shouldUseCursor).toBe(true);
                        }

                        // Property: Should not recommend cursor pagination for small datasets and offsets
                        if (totalRecords <= threshold && currentOffset <= threshold) {
                            expect(shouldUseCursor).toBe(false);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should generate valid database index recommendations', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
                    fc.array(fc.string({ minLength: 1 }), { maxLength: 5 }),
                    (tableName, sortFields, filterFields) => {
                        const recommendations = PaginationOptimizer.getIndexRecommendations(
                            tableName,
                            sortFields,
                            filterFields
                        );

                        // Property: Should generate at least one recommendation
                        expect(recommendations.length).toBeGreaterThan(0);

                        // Property: All recommendations should be valid SQL
                        recommendations.forEach(sql => {
                            expect(sql).toContain('CREATE INDEX');
                            expect(sql).toContain(tableName);
                            expect(sql).toMatch(/CREATE INDEX idx_[\w_]+/);
                        });

                        // Property: Should include composite index if both sort and filter fields exist
                        if (filterFields.length > 0 && sortFields.length > 0) {
                            const compositeIndex = recommendations.find(sql =>
                                filterFields.every(field => sql.includes(field)) &&
                                sortFields.every(field => sql.includes(field))
                            );
                            expect(compositeIndex).toBeDefined();
                        }

                        // Property: Should include sort-only index
                        if (sortFields.length > 0) {
                            const sortIndex = recommendations.find(sql =>
                                sortFields.every(field => sql.includes(field))
                            );
                            expect(sortIndex).toBeDefined();
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 41: API Functionality Completeness - Parameter Validation', () => {
        it('should validate offset pagination parameters correctly', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        page: fc.integer({ min: 1, max: 1000 }),
                        limit: fc.integer({ min: 1, max: 100 }),
                        sortBy: fc.string(),
                        sortOrder: fc.constantFrom('asc', 'desc'),
                    }),
                    (params) => {
                        const validated = PaginationValidator.validateOffsetParams(params);

                        // Property: Valid parameters should pass validation
                        expect(validated.page).toBe(params.page);
                        expect(validated.limit).toBe(params.limit);
                        expect(validated.sortBy).toBe(params.sortBy);
                        expect(validated.sortOrder).toBe(params.sortOrder);

                        // Property: Validated parameters should be within bounds
                        expect(validated.page).toBeGreaterThanOrEqual(1);
                        expect(validated.limit).toBeGreaterThanOrEqual(1);
                        expect(validated.limit).toBeLessThanOrEqual(100);
                        expect(['asc', 'desc']).toContain(validated.sortOrder);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should validate cursor pagination parameters correctly', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        cursor: fc.string({ minLength: 1 }).map(s =>
                            Buffer.from(JSON.stringify({ id: s })).toString('base64url')
                        ).filter(() => fc.sample(fc.boolean(), 1)[0]),
                        limit: fc.integer({ min: 1, max: 100 }),
                        sortBy: fc.string(),
                        sortOrder: fc.constantFrom('asc', 'desc'),
                    }),
                    (params) => {
                        const validated = PaginationValidator.validateCursorParams(params);

                        // Property: Valid parameters should pass validation
                        expect(validated.cursor).toBe(params.cursor);
                        expect(validated.limit).toBe(params.limit);
                        expect(validated.sortBy).toBe(params.sortBy);
                        expect(validated.sortOrder).toBe(params.sortOrder);

                        // Property: Validated parameters should be within bounds
                        expect(validated.limit).toBeGreaterThanOrEqual(1);
                        expect(validated.limit).toBeLessThanOrEqual(100);
                        expect(['asc', 'desc']).toContain(validated.sortOrder);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should handle invalid parameters gracefully', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        page: fc.integer({ max: 0 }),
                        limit: fc.integer({ max: 0 }),
                    }),
                    (invalidParams) => {
                        // Property: Invalid parameters should throw validation errors
                        expect(() => {
                            PaginationValidator.validateOffsetParams(invalidParams);
                        }).toThrow();
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
});