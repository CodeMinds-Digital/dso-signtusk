import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

// Database connection configuration with optimization
const createPrismaClient = () => {
    const logQueries = process.env.NODE_ENV === 'development' ||
        process.env.DATABASE_LOG_QUERIES === 'true';

    const logLevels = logQueries
        ? ['query', 'error', 'warn', 'info']
        : ['error', 'warn'];

    return new PrismaClient({
        log: logLevels as any,
        // Error formatting for better debugging
        errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
    });
};

// Singleton pattern for Prisma client
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}

// Connection pool configuration
export const connectDatabase = async (): Promise<void> => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
    try {
        await prisma.$disconnect();
        console.log('✅ Database disconnected successfully');
    } catch (error) {
        console.error('❌ Database disconnection failed:', error);
        throw error;
    }
};

// Health check with detailed metrics
export const checkDatabaseHealth = async (): Promise<{
    healthy: boolean;
    latency?: number;
    connectionCount?: number;
    error?: string;
}> => {
    const startTime = Date.now();

    try {
        // Test basic connectivity
        await prisma.$queryRaw`SELECT 1`;

        // Get connection metrics
        const connectionInfo = await prisma.$queryRaw<Array<{ count: number }>>`
            SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
        `;

        const latency = Date.now() - startTime;

        return {
            healthy: true,
            latency,
            connectionCount: connectionInfo[0]?.count || 0,
        };
    } catch (error) {
        console.error('❌ Database health check failed:', error);
        return {
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

// Transaction helper with timeout and isolation level
export const withTransaction = async <T>(
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
    options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
    }
): Promise<T> => {
    return prisma.$transaction(callback, {
        maxWait: options?.maxWait || 5000, // 5 seconds
        timeout: options?.timeout || 10000, // 10 seconds
        isolationLevel: options?.isolationLevel || 'ReadCommitted',
    });
};

// Database optimization utilities
export const optimizeDatabase = async (): Promise<void> => {
    try {
        // Analyze tables for query optimization
        await prisma.$executeRaw`ANALYZE`;

        // Update table statistics
        await prisma.$executeRaw`VACUUM ANALYZE`;

        console.log('✅ Database optimization completed');
    } catch (error) {
        console.error('❌ Database optimization failed:', error);
        throw error;
    }
};

// Connection pool monitoring
export const getConnectionPoolStats = async (): Promise<{
    active: number;
    idle: number;
    waiting: number;
    total: number;
}> => {
    try {
        const stats = await prisma.$queryRaw<Array<{
            state: string;
            count: number;
        }>>`
            SELECT state, count(*) as count 
            FROM pg_stat_activity 
            WHERE datname = current_database()
            GROUP BY state
        `;

        const result = {
            active: 0,
            idle: 0,
            waiting: 0,
            total: 0,
        };

        stats.forEach((stat: { state: string; count: number }) => {
            switch (stat.state) {
                case 'active':
                    result.active = stat.count;
                    break;
                case 'idle':
                    result.idle = stat.count;
                    break;
                case 'idle in transaction':
                    result.waiting = stat.count;
                    break;
            }
            result.total += stat.count;
        });

        return result;
    } catch (error) {
        console.error('❌ Failed to get connection pool stats:', error);
        throw error;
    }
};

// Audit trail utilities for immutable logging
export const createImmutableAuditLog = async (
    organizationId: string,
    userId: string | null,
    entityType: string,
    entityId: string,
    action: string,
    details: Record<string, any>,
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> => {
    try {
        // Create audit event with immutable timestamp and hash
        const auditData = {
            organizationId,
            userId,
            entityType,
            entityId,
            action,
            details,
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            timestamp: new Date(),
        };

        // Use transaction to ensure atomicity
        await withTransaction(async (tx) => {
            // TODO: Fix audit event creation - no auditEvent model available
            // await tx.auditEvent.create({
            //     data: auditData,
            // });
        });

    } catch (error) {
        console.error('❌ Failed to create audit log:', error);
        throw error;
    }
};

export default prisma;