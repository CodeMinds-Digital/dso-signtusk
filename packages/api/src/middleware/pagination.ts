/**
 * REST API Pagination Middleware
 * 
 * Provides middleware for handling pagination in REST API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import {
    OffsetPaginator,
    CursorPaginator,
    PaginationValidator,
    NavigationLinkBuilder,
    type OffsetPaginationInput,
    type CursorPaginationInput,
} from '@signtusk/lib';

/**
 * Extended Request interface with pagination
 */
export interface PaginatedRequest extends Request {
    pagination?: {
        offset: OffsetPaginationInput;
        cursor: CursorPaginationInput;
        type: 'offset' | 'cursor';
    };
}

/**
 * Extended Response interface with pagination helpers
 */
export interface PaginatedResponse extends Response {
    paginate: {
        offset: <T>(data: T[], total: number, baseUrl?: string) => void;
        cursor: <T>(data: T[], sortBy?: string, totalCount?: number, baseUrl?: string) => void;
    };
}

/**
 * Middleware to parse and validate pagination parameters
 */
export const paginationMiddleware = (
    req: PaginatedRequest,
    res: PaginatedResponse,
    next: NextFunction
) => {
    try {
        // Determine pagination type based on query parameters
        const hasCursor = 'cursor' in req.query;
        const hasPage = 'page' in req.query;

        let paginationType: 'offset' | 'cursor' = 'offset';

        if (hasCursor && !hasPage) {
            paginationType = 'cursor';
        }

        // Parse and validate parameters
        let offsetParams: OffsetPaginationInput | undefined;
        let cursorParams: CursorPaginationInput | undefined;

        if (paginationType === 'offset') {
            offsetParams = PaginationValidator.validateOffsetParams({
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
                sortBy: req.query.sortBy as string,
                sortOrder: req.query.sortOrder as 'asc' | 'desc',
            });
        } else {
            cursorParams = PaginationValidator.validateCursorParams({
                cursor: req.query.cursor as string,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
                sortBy: req.query.sortBy as string,
                sortOrder: req.query.sortOrder as 'asc' | 'desc',
            });
        }

        // Add pagination info to request
        req.pagination = {
            offset: offsetParams!,
            cursor: cursorParams!,
            type: paginationType,
        };

        // Add pagination helpers to response
        res.paginate = {
            offset: <T>(data: T[], total: number, baseUrl?: string) => {
                if (!offsetParams) {
                    throw new Error('Offset pagination not configured');
                }

                const result = OffsetPaginator.createResult(
                    data,
                    total,
                    offsetParams.page,
                    offsetParams.limit
                );

                // Add navigation links if baseUrl provided
                if (baseUrl) {
                    const links = NavigationLinkBuilder.buildOffsetLinks(
                        baseUrl,
                        result.meta,
                        req.query
                    );

                    // Set Link header for REST API standards
                    const linkHeader = Object.entries(links)
                        .map(([rel, url]) => `<${url}>; rel="${rel}"`)
                        .join(', ');

                    if (linkHeader) {
                        res.set('Link', linkHeader);
                    }
                }

                // Set pagination headers
                res.set({
                    'X-Total-Count': total.toString(),
                    'X-Page': offsetParams.page.toString(),
                    'X-Per-Page': offsetParams.limit.toString(),
                    'X-Total-Pages': result.meta.totalPages.toString(),
                });

                res.json(result);
            },

            cursor: <T>(data: T[], sortBy: string = 'id', totalCount?: number, baseUrl?: string) => {
                if (!cursorParams) {
                    throw new Error('Cursor pagination not configured');
                }

                const result = CursorPaginator.createResult(
                    data,
                    cursorParams.limit,
                    sortBy,
                    totalCount
                );

                // Add navigation links if baseUrl provided
                if (baseUrl) {
                    const links = NavigationLinkBuilder.buildCursorLinks(
                        baseUrl,
                        result.meta,
                        req.query
                    );

                    // Set Link header for REST API standards
                    const linkHeader = Object.entries(links)
                        .map(([rel, url]) => `<${url}>; rel="${rel}"`)
                        .join(', ');

                    if (linkHeader) {
                        res.set('Link', linkHeader);
                    }
                }

                // Set cursor pagination headers
                res.set({
                    'X-Has-Next-Page': result.meta.hasNextPage.toString(),
                    'X-Has-Previous-Page': result.meta.hasPreviousPage.toString(),
                });

                if (result.meta.nextCursor) {
                    res.set('X-Next-Cursor', result.meta.nextCursor);
                }

                if (result.meta.previousCursor) {
                    res.set('X-Previous-Cursor', result.meta.previousCursor);
                }

                if (totalCount !== undefined) {
                    res.set('X-Total-Count', totalCount.toString());
                }

                res.json(result);
            },
        };

        next();
    } catch (error) {
        res.status(400).json({
            error: 'Invalid pagination parameters',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Performance monitoring middleware for pagination
 */
export const paginationPerformanceMiddleware = (
    req: PaginatedRequest,
    res: PaginatedResponse,
    next: NextFunction
) => {
    const startTime = Date.now();

    // Override res.json to measure response time
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
        const duration = Date.now() - startTime;
        const slowQueryThreshold = 1000; // 1 second

        if (duration > slowQueryThreshold) {
            console.warn(`Slow pagination API query detected:`, {
                path: req.path,
                method: req.method,
                duration: `${duration}ms`,
                paginationType: req.pagination?.type,
                query: req.query,
                timestamp: new Date().toISOString(),
            });
        }

        // Add performance header
        res.set('X-Response-Time', `${duration}ms`);

        return originalJson(body);
    };

    next();
};

/**
 * Cache middleware for pagination results
 */
export const paginationCacheMiddleware = (
    cacheService: any,
    cacheKeyPrefix: string,
    ttlSeconds: number = 300
) => {
    return async (req: PaginatedRequest, res: PaginatedResponse, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Create cache key from request
        const cacheKey = `${cacheKeyPrefix}:${req.path}:${JSON.stringify(req.query)}`;

        try {
            // Try to get from cache
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                const result = JSON.parse(cached);

                // Set cache headers
                res.set({
                    'X-Cache': 'HIT',
                    'Cache-Control': `public, max-age=${ttlSeconds}`,
                });

                return res.json(result);
            }

            // Override res.json to cache the result
            const originalJson = res.json.bind(res);
            res.json = function (body: any) {
                // Cache the result
                cacheService.set(cacheKey, JSON.stringify(body), ttlSeconds).catch((error: any) => {
                    console.error('Failed to cache pagination result:', error);
                });

                // Set cache headers
                res.set({
                    'X-Cache': 'MISS',
                    'Cache-Control': `public, max-age=${ttlSeconds}`,
                });

                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Utility function to get database query parameters from request
 */
export const getDatabaseQueryParams = (req: PaginatedRequest) => {
    if (!req.pagination) {
        throw new Error('Pagination middleware not applied');
    }

    if (req.pagination.type === 'offset') {
        const { page, limit, sortBy, sortOrder } = req.pagination.offset;
        return {
            skip: OffsetPaginator.calculateSkip(page, limit),
            take: limit,
            orderBy: sortBy ? { [sortBy]: sortOrder } : undefined,
        };
    } else {
        const { cursor, limit, sortBy, sortOrder } = req.pagination.cursor;
        return {
            cursor: cursor ? { id: cursor } : undefined,
            take: limit,
            orderBy: sortBy ? { [sortBy]: sortOrder } : undefined,
        };
    }
};

/**
 * Error handling middleware for pagination
 */
export const paginationErrorMiddleware = (
    error: any,
    req: PaginatedRequest,
    res: PaginatedResponse,
    next: NextFunction
) => {
    if (error.name === 'ValidationError' || error.message?.includes('pagination')) {
        return res.status(400).json({
            error: 'Pagination Error',
            message: error.message,
            code: 'INVALID_PAGINATION_PARAMS',
        });
    }

    next(error);
};