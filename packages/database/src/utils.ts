import type { PaginationOptions, FilterOptions, PaginatedResult } from './types';

// ============================================================================
// PAGINATION UTILITIES
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function normalizePagination(options: PaginationOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, options.limit || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        orderBy: options.orderBy || 'createdAt',
        orderDirection: options.orderDirection || 'desc' as const,
    };
}

export function createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

// ============================================================================
// FILTER UTILITIES
// ============================================================================

export function buildSearchFilter(search: string, fields: string[]) {
    if (!search || !fields.length) return {};

    return {
        OR: fields.map(field => ({
            [field]: {
                contains: search,
                mode: 'insensitive' as const,
            },
        })),
    };
}

export function buildDateRangeFilter(dateFrom?: Date, dateTo?: Date, field = 'createdAt') {
    const filter: any = {};

    if (dateFrom || dateTo) {
        filter[field] = {};
        if (dateFrom) filter[field].gte = dateFrom;
        if (dateTo) filter[field].lte = dateTo;
    }

    return filter;
}

export function combineFilters(...filters: any[]) {
    const validFilters = filters.filter(filter =>
        filter && Object.keys(filter).length > 0
    );

    if (validFilters.length === 0) return {};
    if (validFilters.length === 1) return validFilters[0];

    return {
        AND: validFilters,
    };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validateCuid(id: string): boolean {
    // Basic CUID validation pattern
    const cuidPattern = /^c[a-z0-9]{24}$/;
    return cuidPattern.test(id);
}

export function validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

export function sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export class DatabaseError extends Error {
    constructor(
        message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export function handlePrismaError(error: any): DatabaseError {
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
        return new DatabaseError('Unique constraint violation', 'UNIQUE_CONSTRAINT', error.meta);
    }

    if (error.code === 'P2025') {
        return new DatabaseError('Record not found', 'NOT_FOUND', error.meta);
    }

    if (error.code === 'P2003') {
        return new DatabaseError('Foreign key constraint violation', 'FOREIGN_KEY_CONSTRAINT', error.meta);
    }

    return new DatabaseError(error.message || 'Database operation failed', error.code, error);
}

// ============================================================================
// AUDIT TRAIL UTILITIES (IMMUTABLE LOGGING)
// ============================================================================

export interface AuditContext {
    userId?: string;
    organizationId: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface ImmutableAuditEvent {
    organizationId: string;
    userId?: string;
    entityType: string;
    entityId: string;
    action: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    hash?: string; // For integrity verification
}

export function createAuditEvent(
    entityType: string,
    entityId: string,
    action: string,
    context: AuditContext,
    details: any = {}
): ImmutableAuditEvent {
    const timestamp = new Date();
    const auditEvent = {
        organizationId: context.organizationId,
        userId: context.userId,
        entityType,
        entityId,
        action,
        details,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp,
    };

    // Generate integrity hash for immutable audit trail
    const hash = generateAuditHash(auditEvent);

    return {
        ...auditEvent,
        hash,
    };
}

// Generate cryptographic hash for audit event integrity
export function generateAuditHash(event: Omit<ImmutableAuditEvent, 'hash'>): string {
    const crypto = require('node:crypto');
    const content = JSON.stringify({
        organizationId: event.organizationId,
        userId: event.userId,
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        details: event.details,
        timestamp: event.timestamp.toISOString(),
    });

    return crypto.createHash('sha256').update(content).digest('hex');
}

// Verify audit event integrity
export function verifyAuditIntegrity(event: ImmutableAuditEvent): boolean {
    const expectedHash = generateAuditHash(event);
    return event.hash === expectedHash;
}

// Audit trail query utilities
export interface AuditTrailQuery {
    organizationId: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
}

export function buildAuditTrailFilter(query: AuditTrailQuery) {
    const filter: any = {
        organizationId: query.organizationId,
    };

    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.userId) filter.userId = query.userId;
    if (query.action) filter.action = query.action;

    if (query.dateFrom || query.dateTo) {
        filter.timestamp = {};
        if (query.dateFrom) filter.timestamp.gte = query.dateFrom;
        if (query.dateTo) filter.timestamp.lte = query.dateTo;
    }

    return filter;
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

export function hashPassword(password: string): Promise<string> {
    // This would typically use bcrypt or similar
    // Placeholder implementation
    return Promise.resolve(password);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
    // This would typically use bcrypt or similar
    // Placeholder implementation
    return Promise.resolve(password === hash);
}

export function generateSecureToken(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

export function createBatchProcessor<T, R>(
    processor: (batch: T[]) => Promise<R[]>,
    batchSize = 100
) {
    return async (items: T[]): Promise<R[]> => {
        const results: R[] = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await processor(batch);
            results.push(...batchResults);
        }

        return results;
    };
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}