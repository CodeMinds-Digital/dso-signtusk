/**
 * Example API Routes with Pagination
 * 
 * Demonstrates how to use the pagination middleware and utilities
 * in REST API endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
import {
    paginationMiddleware,
    paginationPerformanceMiddleware,
    getDatabaseQueryParams,
    type PaginatedRequest,
    type PaginatedResponse,
} from '../middleware/pagination';
import {
    CursorPaginator,
    PaginationOptimizer,
} from '@signtusk/lib';

const router = Router();

// Apply pagination middleware to all routes
router.use(paginationMiddleware);
router.use(paginationPerformanceMiddleware);

/**
 * GET /api/documents - List documents with offset-based pagination
 */
router.get('/documents', async (req: PaginatedRequest, res: PaginatedResponse) => {
    try {
        const { skip, take, orderBy } = getDatabaseQueryParams(req);

        // Build where clause from query parameters
        const where: any = {};

        if (req.query.search) {
            where.OR = [
                { name: { contains: req.query.search as string, mode: 'insensitive' } },
                { description: { contains: req.query.search as string, mode: 'insensitive' } },
            ];
        }

        if (req.query.status) {
            where.status = req.query.status;
        }

        if (req.query.folderId) {
            where.folderId = req.query.folderId;
        }

        // Execute database queries
        const [documents, total] = await Promise.all([
            // In real implementation, use your database client
            // ctx.db.document.findMany({
            //     where,
            //     orderBy,
            //     skip,
            //     take,
            //     select: {
            //         id: true,
            //         name: true,
            //         status: true,
            //         createdAt: true,
            //         updatedAt: true,
            //     },
            // }),
            // ctx.db.document.count({ where }),

            // Mock data for example
            generateMockDocuments(take, skip),
            1000, // Mock total count
        ]);

        // Use pagination helper to send response
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
        res.paginate.offset(documents, total, baseUrl);

    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch documents',
        });
    }
});

/**
 * GET /api/documents/cursor - List documents with cursor-based pagination
 */
router.get('/documents/cursor', async (req: PaginatedRequest, res: PaginatedResponse) => {
    try {
        const { cursor, limit, sortBy = 'createdAt', sortOrder } = req.pagination!.cursor;

        // Build where clause with cursor
        const baseWhere: any = {};

        if (req.query.search) {
            baseWhere.OR = [
                { name: { contains: req.query.search as string, mode: 'insensitive' } },
                { description: { contains: req.query.search as string, mode: 'insensitive' } },
            ];
        }

        const where = CursorPaginator.createWhereClause(
            cursor,
            sortBy,
            sortOrder,
            baseWhere
        );

        // Execute database query
        const documents = await Promise.resolve(
            // In real implementation:
            // ctx.db.document.findMany({
            //     where,
            //     orderBy: { [sortBy]: sortOrder },
            //     take: limit,
            //     select: {
            //         id: true,
            //         name: true,
            //         status: true,
            //         createdAt: true,
            //         updatedAt: true,
            //     },
            // })

            // Mock data for example
            generateMockDocuments(limit, 0)
        );

        // Use cursor pagination helper to send response
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
        res.paginate.cursor(documents, sortBy, undefined, baseUrl);

    } catch (error) {
        console.error('Error fetching documents with cursor:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch documents',
        });
    }
});

/**
 * GET /api/users - List users with optimized pagination for large datasets
 */
router.get('/users', async (req: PaginatedRequest, res: PaginatedResponse) => {
    try {
        const { skip, take, orderBy } = getDatabaseQueryParams(req);

        // Check if we should use cursor pagination for better performance
        const totalRecords = 100000; // In real app, get from database stats
        const shouldUseCursor = PaginationOptimizer.shouldUseCursorPagination(
            totalRecords,
            skip
        );

        if (shouldUseCursor) {
            // Suggest cursor pagination for better performance
            res.set('X-Pagination-Recommendation', 'cursor');
            res.set('X-Pagination-Reason', 'Large dataset detected, cursor pagination recommended');
        }

        // Build where clause
        const where: any = {};

        if (req.query.search) {
            where.OR = [
                { email: { contains: req.query.search as string, mode: 'insensitive' } },
                { name: { contains: req.query.search as string, mode: 'insensitive' } },
            ];
        }

        if (req.query.organizationId) {
            where.organizationId = req.query.organizationId;
        }

        // Use optimized count for large offsets
        const { count: total, isApproximate } = await PaginationOptimizer.getOptimizedCount(
            async () => {
                // In real implementation:
                // return ctx.db.user.count({ where });
                return 100000; // Mock count
            },
            async () => {
                // In real implementation, use database-specific approximate count
                // return ctx.db.$queryRaw`SELECT reltuples::bigint FROM pg_class WHERE relname = 'User'`;
                return 95000; // Mock approximate count
            },
            skip
        );

        if (isApproximate) {
            res.set('X-Count-Type', 'approximate');
        }

        // Execute query
        const users = await Promise.resolve(
            // In real implementation:
            // ctx.db.user.findMany({
            //     where,
            //     orderBy,
            //     skip,
            //     take,
            //     select: {
            //         id: true,
            //         email: true,
            //         name: true,
            //         createdAt: true,
            //         isActive: true,
            //     },
            // })

            // Mock data for example
            generateMockUsers(take, skip)
        );

        // Use pagination helper to send response
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
        res.paginate.offset(users, total, baseUrl);

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch users',
        });
    }
});

/**
 * GET /api/analytics/events - High-performance cursor pagination for analytics data
 */
router.get('/analytics/events', async (req: PaginatedRequest, res: PaginatedResponse) => {
    try {
        const { cursor, limit, sortBy = 'timestamp', sortOrder } = req.pagination!.cursor;

        // Build time-based where clause
        const baseWhere: any = {};

        if (req.query.startDate) {
            baseWhere.timestamp = { gte: new Date(req.query.startDate as string) };
        }

        if (req.query.endDate) {
            baseWhere.timestamp = {
                ...baseWhere.timestamp,
                lte: new Date(req.query.endDate as string),
            };
        }

        if (req.query.eventType) {
            baseWhere.eventType = req.query.eventType;
        }

        const where = CursorPaginator.createWhereClause(
            cursor,
            sortBy,
            sortOrder,
            baseWhere
        );

        // Execute query with performance optimization
        const events = await Promise.resolve(
            // In real implementation:
            // ctx.db.analyticsEvent.findMany({
            //     where,
            //     orderBy: { [sortBy]: sortOrder },
            //     take: limit,
            //     select: {
            //         id: true,
            //         eventType: true,
            //         timestamp: true,
            //         userId: true,
            //         metadata: true,
            //     },
            // })

            // Mock data for example
            generateMockAnalyticsEvents(limit)
        );

        // Use cursor pagination helper
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
        res.paginate.cursor(events, sortBy, undefined, baseUrl);

    } catch (error) {
        console.error('Error fetching analytics events:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch analytics events',
        });
    }
});

/**
 * GET /api/search - Search with intelligent pagination
 */
router.get('/search', async (req: PaginatedRequest, res: PaginatedResponse) => {
    try {
        const query = req.query.q as string;

        if (!query) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Search query is required',
            });
        }

        const { skip, take } = getDatabaseQueryParams(req);

        // Perform search (mock implementation)
        const searchResults = await performSearch(query, skip, take);

        // Use pagination helper
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
        res.paginate.offset(searchResults.results, searchResults.total, baseUrl);

    } catch (error) {
        console.error('Error performing search:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Search failed',
        });
    }
});

// Mock data generators for examples
function generateMockDocuments(limit: number, skip: number) {
    const documents = [];
    for (let i = 0; i < limit; i++) {
        const id = skip + i + 1;
        documents.push({
            id: `doc_${id}`,
            name: `Document ${id}`,
            status: ['DRAFT', 'PENDING', 'COMPLETED'][id % 3],
            createdAt: new Date(Date.now() - id * 86400000), // Days ago
            updatedAt: new Date(Date.now() - id * 43200000), // Half days ago
        });
    }
    return documents;
}

function generateMockUsers(limit: number, skip: number) {
    const users = [];
    for (let i = 0; i < limit; i++) {
        const id = skip + i + 1;
        users.push({
            id: `user_${id}`,
            email: `user${id}@example.com`,
            name: `User ${id}`,
            createdAt: new Date(Date.now() - id * 86400000),
            isActive: id % 10 !== 0, // 90% active
        });
    }
    return users;
}

function generateMockAnalyticsEvents(limit: number) {
    const events = [];
    for (let i = 0; i < limit; i++) {
        events.push({
            id: `event_${Date.now()}_${i}`,
            eventType: ['document_created', 'document_signed', 'user_login'][i % 3],
            timestamp: new Date(Date.now() - i * 60000), // Minutes ago
            userId: `user_${(i % 100) + 1}`,
            metadata: { source: 'api', version: '1.0' },
        });
    }
    return events;
}

async function performSearch(query: string, skip: number, take: number) {
    // Mock search implementation
    const mockResults = [];
    const totalResults = 500;

    for (let i = 0; i < Math.min(take, totalResults - skip); i++) {
        const id = skip + i + 1;
        mockResults.push({
            id: `result_${id}`,
            title: `Search Result ${id} for "${query}"`,
            type: ['document', 'user', 'template'][id % 3],
            relevance: Math.random(),
            createdAt: new Date(Date.now() - id * 86400000),
        });
    }

    return {
        results: mockResults,
        total: totalResults,
    };
}

export { router as paginatedExamplesRouter };