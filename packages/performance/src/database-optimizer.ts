import { QueryPerformance, DatabaseOptimization } from './types';

export class DatabaseOptimizer {
    private queryHistory: QueryPerformance[] = [];
    private slowQueryThreshold: number;

    constructor(slowQueryThreshold = 1000) {
        this.slowQueryThreshold = slowQueryThreshold;
    }

    recordQuery(query: QueryPerformance): void {
        this.queryHistory.push(query);

        // Keep only last 10000 queries
        if (this.queryHistory.length > 10000) {
            this.queryHistory = this.queryHistory.slice(-10000);
        }
    }

    getSlowQueries(limit = 100): QueryPerformance[] {
        return this.queryHistory
            .filter(q => q.executionTime > this.slowQueryThreshold)
            .sort((a, b) => b.executionTime - a.executionTime)
            .slice(0, limit);
    }

    analyzeQueryPatterns(): DatabaseOptimization[] {
        const optimizations: DatabaseOptimization[] = [];
        const queryGroups = this.groupQueriesByPattern();

        for (const [pattern, queries] of queryGroups) {
            const avgExecutionTime = queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length;
            const frequency = queries.length;

            // Suggest index optimization for frequently slow queries
            if (avgExecutionTime > this.slowQueryThreshold && frequency > 10) {
                optimizations.push({
                    type: 'index',
                    recommendation: `Consider adding an index for query pattern: ${pattern}`,
                    impact: avgExecutionTime > 5000 ? 'high' : 'medium',
                    effort: 'low',
                    estimatedImprovement: `Reduce query time by 60-80% (from ${avgExecutionTime.toFixed(0)}ms to ${(avgExecutionTime * 0.3).toFixed(0)}ms)`,
                });
            }

            // Suggest query optimization for complex queries
            if (this.isComplexQuery(pattern) && avgExecutionTime > 500) {
                optimizations.push({
                    type: 'query',
                    recommendation: `Optimize complex query: ${pattern}`,
                    impact: 'medium',
                    effort: 'medium',
                    estimatedImprovement: `Reduce query complexity and execution time by 30-50%`,
                });
            }
        }

        // Analyze connection pool usage
        const connectionOptimizations = this.analyzeConnectionPool();
        optimizations.push(...connectionOptimizations);

        return optimizations;
    }

    private groupQueriesByPattern(): Map<string, QueryPerformance[]> {
        const groups = new Map<string, QueryPerformance[]>();

        for (const query of this.queryHistory) {
            const pattern = this.extractQueryPattern(query.query);
            if (!groups.has(pattern)) {
                groups.set(pattern, []);
            }
            groups.get(pattern)!.push(query);
        }

        return groups;
    }

    private extractQueryPattern(query: string): string {
        // Normalize query by removing specific values and keeping structure
        return query
            .replace(/\$\d+/g, '$?') // Replace parameter placeholders
            .replace(/'[^']*'/g, "'?'") // Replace string literals
            .replace(/\b\d+\b/g, '?') // Replace numbers
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .toLowerCase();
    }

    private isComplexQuery(pattern: string): boolean {
        const complexityIndicators = [
            'join',
            'subquery',
            'union',
            'group by',
            'order by',
            'having',
            'window',
            'recursive',
        ];

        const complexity = complexityIndicators.reduce((count, indicator) => {
            return count + (pattern.includes(indicator) ? 1 : 0);
        }, 0);

        return complexity >= 2;
    }

    private analyzeConnectionPool(): DatabaseOptimization[] {
        const optimizations: DatabaseOptimization[] = [];

        // Analyze query frequency to suggest connection pool size
        const recentQueries = this.queryHistory.filter(
            q => Date.now() - q.timestamp.getTime() < 300000 // Last 5 minutes
        );

        const queriesPerSecond = recentQueries.length / 300;

        if (queriesPerSecond > 50) {
            optimizations.push({
                type: 'connection',
                recommendation: 'Consider increasing database connection pool size due to high query volume',
                impact: 'medium',
                effort: 'low',
                estimatedImprovement: 'Reduce connection wait times and improve throughput by 20-30%',
            });
        }

        // Analyze query distribution
        const queryTypes = this.analyzeQueryTypes(recentQueries);
        if (queryTypes.writes / queryTypes.reads > 0.3) {
            optimizations.push({
                type: 'schema',
                recommendation: 'High write-to-read ratio detected. Consider read replicas or write optimization',
                impact: 'high',
                effort: 'high',
                estimatedImprovement: 'Distribute load and improve overall performance by 40-60%',
            });
        }

        return optimizations;
    }

    private analyzeQueryTypes(queries: QueryPerformance[]): { reads: number; writes: number } {
        let reads = 0;
        let writes = 0;

        for (const query of queries) {
            const normalizedQuery = query.query.toLowerCase().trim();
            if (normalizedQuery.startsWith('select')) {
                reads++;
            } else if (normalizedQuery.startsWith('insert') ||
                normalizedQuery.startsWith('update') ||
                normalizedQuery.startsWith('delete')) {
                writes++;
            }
        }

        return { reads, writes };
    }

    generateOptimizationReport(): {
        summary: {
            totalQueries: number;
            slowQueries: number;
            averageExecutionTime: number;
            optimizationOpportunities: number;
        };
        topSlowQueries: QueryPerformance[];
        optimizations: DatabaseOptimization[];
        recommendations: string[];
    } {
        const slowQueries = this.getSlowQueries();
        const optimizations = this.analyzeQueryPatterns();

        const totalQueries = this.queryHistory.length;
        const averageExecutionTime = totalQueries > 0
            ? this.queryHistory.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries
            : 0;

        const recommendations = [
            'Monitor slow queries regularly and optimize frequently executed ones first',
            'Consider implementing query result caching for read-heavy operations',
            'Use database connection pooling to manage concurrent connections efficiently',
            'Implement proper indexing strategy based on query patterns',
            'Consider database partitioning for large tables with time-based data',
        ];

        return {
            summary: {
                totalQueries,
                slowQueries: slowQueries.length,
                averageExecutionTime,
                optimizationOpportunities: optimizations.length,
            },
            topSlowQueries: slowQueries.slice(0, 10),
            optimizations,
            recommendations,
        };
    }

    // Query performance monitoring middleware
    createQueryMonitoringMiddleware() {
        return (query: string, parameters?: any[]) => {
            const startTime = Date.now();

            return {
                finish: (error?: Error, rowsAffected = 0) => {
                    const executionTime = Date.now() - startTime;

                    this.recordQuery({
                        query,
                        executionTime,
                        rowsAffected,
                        timestamp: new Date(),
                        parameters,
                        error: error?.message,
                    });

                    // Log slow queries
                    if (executionTime > this.slowQueryThreshold) {
                        console.warn(`Slow query detected (${executionTime}ms):`, {
                            query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
                            executionTime,
                            parameters: parameters?.slice(0, 5), // Log first 5 parameters only
                        });
                    }
                },
            };
        };
    }

    // Index suggestion based on query analysis
    suggestIndexes(): Array<{
        table: string;
        columns: string[];
        type: 'btree' | 'hash' | 'gin' | 'gist';
        reason: string;
        priority: 'high' | 'medium' | 'low';
    }> {
        const suggestions: Array<{
            table: string;
            columns: string[];
            type: 'btree' | 'hash' | 'gin' | 'gist';
            reason: string;
            priority: 'high' | 'medium' | 'low';
        }> = [];

        const queryPatterns = this.groupQueriesByPattern();

        for (const [pattern, queries] of queryPatterns) {
            const avgTime = queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length;
            const frequency = queries.length;

            if (avgTime > this.slowQueryThreshold && frequency > 5) {
                // Extract table and column information from query pattern
                const tableMatch = pattern.match(/from\s+(\w+)/i);
                const whereMatch = pattern.match(/where\s+(\w+)/i);

                if (tableMatch && whereMatch) {
                    const table = tableMatch[1];
                    const column = whereMatch[1];

                    suggestions.push({
                        table,
                        columns: [column],
                        type: 'btree',
                        reason: `Frequent slow queries on ${table}.${column} (${frequency} queries, avg ${avgTime.toFixed(0)}ms)`,
                        priority: avgTime > 5000 ? 'high' : frequency > 20 ? 'medium' : 'low',
                    });
                }
            }
        }

        return suggestions;
    }
}