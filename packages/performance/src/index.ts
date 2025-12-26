export * from './types';
export * from './monitoring-service';
export * from './database-optimizer';
export * from './cache-optimizer';

// Main performance monitoring service instance
export { PerformanceMonitoringServiceImpl as PerformanceMonitoringService } from './monitoring-service';
export { DatabaseOptimizer } from './database-optimizer';
export { CacheOptimizer } from './cache-optimizer';

// Convenience factory function
export function createPerformanceMonitoringService() {
    return new (require('./monitoring-service').PerformanceMonitoringServiceImpl)();
}

export function createDatabaseOptimizer(slowQueryThreshold?: number) {
    return new (require('./database-optimizer').DatabaseOptimizer)(slowQueryThreshold);
}

export function createCacheOptimizer() {
    return new (require('./cache-optimizer').CacheOptimizer)();
}