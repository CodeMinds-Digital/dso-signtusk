import { z } from 'zod';
import { ExportStyling, BrandingStyling, ExportConfiguration, ExportResult } from './data-export';

// ============================================================================
// REPORTING ENGINE TYPES
// ============================================================================

export interface ReportDefinition {
    id: string;
    name: string;
    description?: string;
    organizationId: string;
    createdBy: string;
    category: 'usage' | 'performance' | 'compliance' | 'financial' | 'custom';
    query: ReportQuery;
    visualization: ReportVisualization;
    schedule?: ReportSchedule;
    permissions: ReportPermissions;
    parameters?: ReportParameter[];
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ReportQuery {
    type: 'sql' | 'analytics' | 'aggregation';
    source: string; // SQL query, analytics function name, or aggregation config
    parameters?: QueryParameter[];
    filters?: QueryFilter[];
    joins?: QueryJoin[];
    groupBy?: string[];
    orderBy?: QueryOrderBy[];
    limit?: number;
    offset?: number;
}

export interface QueryParameter {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array';
    required: boolean;
    defaultValue?: any;
    validation?: ParameterValidation;
}

export interface ParameterValidation {
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
}

export interface QueryFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'like' | 'between';
    value?: any;
    condition?: 'and' | 'or';
}

export interface QueryJoin {
    type: 'inner' | 'left' | 'right' | 'full';
    table: string;
    on: string;
    alias?: string;
}

export interface QueryOrderBy {
    field: string;
    direction: 'asc' | 'desc';
}

export interface ReportVisualization {
    type: 'table' | 'chart' | 'pivot' | 'dashboard';
    configuration: VisualizationConfig;
    formatting?: ReportFormatting;
}

export interface VisualizationConfig {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
    columns?: ColumnConfig[];
    grouping?: GroupingConfig[];
    aggregations?: AggregationConfig[];
    pivotConfig?: PivotConfig;
}

export interface ColumnConfig {
    field: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    format?: string;
    width?: number;
    sortable?: boolean;
    filterable?: boolean;
    visible?: boolean;
}

export interface GroupingConfig {
    field: string;
    label: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface AggregationConfig {
    field: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
    label?: string;
}

export interface PivotConfig {
    rows: string[];
    columns: string[];
    values: string[];
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportFormatting {
    theme?: 'light' | 'dark' | 'auto';
    colors?: string[];
    fonts?: FontConfig;
    spacing?: SpacingConfig;
    borders?: BorderConfig;
}

export interface FontConfig {
    family?: string;
    size?: number;
    weight?: 'normal' | 'bold';
}

export interface SpacingConfig {
    padding?: number;
    margin?: number;
    cellPadding?: number;
}

export interface BorderConfig {
    show?: boolean;
    color?: string;
    width?: number;
}

export interface ReportSchedule {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time?: string; // HH:MM format
    dayOfWeek?: number; // 0-6, Sunday = 0
    dayOfMonth?: number; // 1-31
    timezone?: string;
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv' | 'json';
}

export interface ReportPermissions {
    view: string[];
    edit: string[];
    delete: string[];
    schedule: string[];
    export: string[];
}

export interface ReportParameter {
    name: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
    required: boolean;
    defaultValue?: any;
    options?: ParameterOption[];
    validation?: ParameterValidation;
}

export interface ParameterOption {
    value?: any;
    label: string;
}

export interface ReportExecution {
    id: string;
    reportId: string;
    organizationId: string;
    executedBy: string;
    parameters: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: ReportResult;
    error?: string;
    executionTime?: number; // in milliseconds
    createdAt: Date;
    completedAt?: Date;
}

export interface ReportResult {
    data: any[];
    metadata: ResultMetadata;
    visualization?: any;
    exportUrls?: Record<string, string>;
}

export interface ResultMetadata {
    totalRows: number;
    columns: ColumnMetadata[];
    executionTime: number;
    dataSource: string;
    generatedAt: Date;
}

export interface ColumnMetadata {
    name: string;
    type: string;
    nullable: boolean;
    unique?: boolean;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const ReportQuerySchema = z.object({
    type: z.enum(['sql', 'analytics', 'aggregation']),
    source: z.string(),
    parameters: z.array(z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'date', 'boolean', 'array']),
        required: z.boolean(),
        defaultValue: z.any().optional(),
        validation: z.object({
            min: z.number().optional(),
            max: z.number().optional(),
            pattern: z.string().optional(),
            options: z.array(z.any()).optional(),
        }).optional(),
    })).optional(),
    filters: z.array(z.object({
        field: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'like', 'between']),
        value: z.any(),
        condition: z.enum(['and', 'or']).optional(),
    })).optional(),
    joins: z.array(z.object({
        type: z.enum(['inner', 'left', 'right', 'full']),
        table: z.string(),
        on: z.string(),
        alias: z.string().optional(),
    })).optional(),
    groupBy: z.array(z.string()).optional(),
    orderBy: z.array(z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']),
    })).optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
});

export const ReportDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    organizationId: z.string(),
    createdBy: z.string(),
    category: z.enum(['usage', 'performance', 'compliance', 'financial', 'custom']),
    query: ReportQuerySchema,
    visualization: z.object({
        type: z.enum(['table', 'chart', 'pivot', 'dashboard']),
        configuration: z.object({
            chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter', 'heatmap']).optional(),
            columns: z.array(z.object({
                field: z.string(),
                label: z.string(),
                type: z.enum(['string', 'number', 'date', 'boolean']),
                format: z.string().optional(),
                width: z.number().optional(),
                sortable: z.boolean().optional(),
                filterable: z.boolean().optional(),
                visible: z.boolean().optional(),
            })).optional(),
            grouping: z.array(z.object({
                field: z.string(),
                label: z.string(),
                aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
            })).optional(),
            aggregations: z.array(z.object({
                field: z.string(),
                function: z.enum(['sum', 'avg', 'count', 'min', 'max', 'distinct']),
                label: z.string().optional(),
            })).optional(),
            pivotConfig: z.object({
                rows: z.array(z.string()),
                columns: z.array(z.string()),
                values: z.array(z.string()),
                aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']),
            }).optional(),
        }),
        formatting: z.object({
            theme: z.enum(['light', 'dark', 'auto']).optional(),
            colors: z.array(z.string()).optional(),
            fonts: z.object({
                family: z.string().optional(),
                size: z.number().optional(),
                weight: z.enum(['normal', 'bold']).optional(),
            }).optional(),
            spacing: z.object({
                padding: z.number().optional(),
                margin: z.number().optional(),
                cellPadding: z.number().optional(),
            }).optional(),
            borders: z.object({
                show: z.boolean().optional(),
                color: z.string().optional(),
                width: z.number().optional(),
            }).optional(),
        }).optional(),
    }),
    schedule: z.object({
        enabled: z.boolean(),
        frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
        time: z.string().optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        timezone: z.string().optional(),
        recipients: z.array(z.string()),
        format: z.enum(['pdf', 'excel', 'csv', 'json']),
    }).optional(),
    permissions: z.object({
        view: z.array(z.string()),
        edit: z.array(z.string()),
        delete: z.array(z.string()),
        schedule: z.array(z.string()),
        export: z.array(z.string()),
    }),
    parameters: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(['string', 'number', 'date', 'boolean', 'select', 'multiselect']),
        required: z.boolean(),
        defaultValue: z.any().optional(),
        options: z.array(z.object({
            value: z.any(),
            label: z.string(),
        })).optional(),
        validation: z.object({
            min: z.number().optional(),
            max: z.number().optional(),
            pattern: z.string().optional(),
            options: z.array(z.any()).optional(),
        }).optional(),
    })).optional(),
    tags: z.array(z.string()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// ============================================================================
// ADVANCED REPORTING ENGINE INTERFACES
// ============================================================================

export interface VisualQueryBuilder {
    id: string;
    name: string;
    organizationId: string;
    configuration: QueryBuilderConfig;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface QueryBuilderConfig {
    dataSources: DataSourceConfig[];
    joins: VisualJoin[];
    filters: VisualFilter[];
    grouping: VisualGrouping[];
    aggregations: VisualAggregation[];
    sorting: VisualSorting[];
    layout: QueryBuilderLayout;
}

export interface DataSourceConfig {
    id: string;
    name: string;
    type: 'table' | 'view' | 'analytics' | 'api';
    source: string;
    alias?: string;
    position: { x: number; y: number };
    fields: FieldConfig[];
}

export interface FieldConfig {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    label: string;
    description?: string;
    nullable: boolean;
    primaryKey?: boolean;
    foreignKey?: string;
}

export interface VisualJoin {
    id: string;
    type: 'inner' | 'left' | 'right' | 'full';
    leftSource: string;
    rightSource: string;
    leftField: string;
    rightField: string;
    condition?: string;
}

export interface VisualFilter {
    id: string;
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'like' | 'between' | 'is_null' | 'is_not_null';
    value?: any;
    values?: any[];
    condition: 'and' | 'or';
    group?: string;
}

export interface VisualGrouping {
    id: string;
    field: string;
    label: string;
    dateGrouping?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface VisualAggregation {
    id: string;
    field: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct' | 'median' | 'stddev';
    label: string;
    format?: string;
}

export interface VisualSorting {
    id: string;
    field: string;
    direction: 'asc' | 'desc';
    priority: number;
}

export interface QueryBuilderLayout {
    canvasSize: { width: number; height: number };
    zoom: number;
    theme: 'light' | 'dark';
    gridEnabled: boolean;
    snapToGrid: boolean;
}

export interface ReportScheduler {
    id: string;
    reportId: string;
    organizationId: string;
    name: string;
    description?: string;
    schedule: ScheduleConfig;
    distribution: DistributionConfig;
    status: 'active' | 'paused' | 'disabled';
    lastRun?: Date;
    nextRun?: Date;
    runCount: number;
    errorCount: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ScheduleConfig {
    type: 'cron' | 'interval' | 'manual';
    cronExpression?: string;
    interval?: {
        value: number;
        unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
    };
    timezone: string;
    startDate?: Date;
    endDate?: Date;
    maxRuns?: number;
}

export interface DistributionConfig {
    recipients: RecipientConfig[];
    formats: ExportFormatConfig[];
    delivery: DeliveryConfig;
    notifications: NotificationConfig;
}

export interface RecipientConfig {
    type: 'user' | 'email' | 'webhook' | 'slack' | 'teams';
    identifier: string;
    name?: string;
    permissions: string[];
}

export interface ExportFormatConfig {
    format: 'pdf' | 'excel' | 'csv' | 'json' | 'xml';
    compression: 'none' | 'gzip' | 'zip';
    password?: string;
    watermark?: string;
    customization: FormatCustomization;
}

export interface FormatCustomization {
    template?: string;
    styling?: ExportStyling;
    branding?: BrandingStyling;
    metadata?: boolean;
    includeCharts?: boolean;
    pageBreaks?: boolean;
}

export interface DeliveryConfig {
    method: 'email' | 'storage' | 'webhook' | 'ftp' | 'sftp';
    configuration: Record<string, any>;
    retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
    maxDelay: number;
}

export interface NotificationConfig {
    onSuccess: boolean;
    onFailure: boolean;
    onSchedule: boolean;
    channels: NotificationChannel[];
}

export interface NotificationChannel {
    type: 'email' | 'slack' | 'teams' | 'webhook';
    configuration: Record<string, any>;
}

export interface ReportShare {
    id: string;
    reportId: string;
    organizationId: string;
    sharedBy: string;
    shareType: 'public' | 'private' | 'organization' | 'team';
    accessLevel: 'view' | 'edit' | 'admin';
    recipients: ShareRecipient[];
    settings: ShareSettings;
    status: 'active' | 'expired' | 'revoked';
    createdAt: Date;
    expiresAt?: Date;
}

export interface ShareRecipient {
    type: 'user' | 'team' | 'organization' | 'external';
    identifier: string;
    permissions: SharePermission[];
    accessedAt?: Date;
    accessCount: number;
}

export interface SharePermission {
    action: 'view' | 'export' | 'schedule' | 'share' | 'edit';
    granted: boolean;
    conditions?: PermissionCondition[];
}

export interface PermissionCondition {
    type: 'time' | 'location' | 'device' | 'usage';
    configuration: Record<string, any>;
}

export interface ShareSettings {
    requireAuthentication: boolean;
    allowDownload: boolean;
    allowPrint: boolean;
    allowShare: boolean;
    watermark?: string;
    trackAccess: boolean;
    notifications: ShareNotification[];
}

export interface ShareNotification {
    event: 'access' | 'download' | 'share' | 'expire';
    recipients: string[];
    template?: string;
}

// ============================================================================
// ADVANCED REPORTING ENGINE SERVICE
// ============================================================================

export class AdvancedReportingEngineService {
    constructor(
        private db: any,
        private analyticsService: any,
        private exportService: any,
        private schedulerService: any,
        private notificationService: any,
        private storageService: any
    ) { }

    /**
     * Create visual query builder
     */
    async createVisualQueryBuilder(
        organizationId: string,
        userId: string,
        builderData: Omit<VisualQueryBuilder, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<VisualQueryBuilder> {
        const builder: VisualQueryBuilder = {
            id: `vqb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...builderData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await this.db.visualQueryBuilder.create({
            data: {
                id: builder.id,
                name: builder.name,
                organizationId: builder.organizationId,
                configuration: JSON.stringify(builder.configuration),
                createdBy: builder.createdBy,
                createdAt: builder.createdAt,
                updatedAt: builder.updatedAt,
            },
        });

        return builder;
    }

    /**
     * Generate SQL from visual query builder
     */
    async generateSqlFromVisualBuilder(builderId: string): Promise<string> {
        const builder = await this.getVisualQueryBuilder(builderId);
        if (!builder) {
            throw new Error('Visual query builder not found');
        }

        const config = builder.configuration;
        let sql = 'SELECT ';

        // Build SELECT clause
        const selectFields: string[] = [];

        // Add regular fields
        config.dataSources.forEach(source => {
            source.fields.forEach(field => {
                if (field.name !== '*') {
                    selectFields.push(`${source.alias || source.name}.${field.name}`);
                }
            });
        });

        // Add aggregations
        config.aggregations.forEach(agg => {
            const aggField = `${agg.function.toUpperCase()}(${agg.field}) AS ${agg.label || agg.field}`;
            selectFields.push(aggField);
        });

        sql += selectFields.length > 0 ? selectFields.join(', ') : '*';

        // Build FROM clause
        const mainSource = config.dataSources[0];
        sql += ` FROM ${mainSource.source}`;
        if (mainSource.alias) {
            sql += ` AS ${mainSource.alias}`;
        }

        // Build JOIN clauses
        config.joins.forEach(join => {
            const joinType = join.type.toUpperCase();
            sql += ` ${joinType} JOIN ${join.rightSource} ON ${join.leftSource}.${join.leftField} = ${join.rightSource}.${join.rightField}`;
            if (join.condition) {
                sql += ` AND ${join.condition}`;
            }
        });

        // Build WHERE clause
        if (config.filters.length > 0) {
            sql += ' WHERE ';
            const filterGroups = this.groupFilters(config.filters);
            const filterClauses = filterGroups.map(group => {
                const groupClauses = group.map(filter => this.buildFilterClause(filter));
                return group.length > 1 ? `(${groupClauses.join(` ${group[0].condition.toUpperCase()} `)})` : groupClauses[0];
            });
            sql += filterClauses.join(' AND ');
        }

        // Build GROUP BY clause
        if (config.grouping.length > 0) {
            const groupFields = config.grouping.map(group => {
                if (group.dateGrouping) {
                    return this.buildDateGrouping(group.field, group.dateGrouping);
                }
                return group.field;
            });
            sql += ` GROUP BY ${groupFields.join(', ')}`;
        }

        // Build ORDER BY clause
        if (config.sorting.length > 0) {
            const sortFields = config.sorting
                .sort((a, b) => a.priority - b.priority)
                .map(sort => `${sort.field} ${sort.direction.toUpperCase()}`);
            sql += ` ORDER BY ${sortFields.join(', ')}`;
        }

        return sql;
    }

    /**
     * Create scheduled report
     */
    async createScheduledReport(
        organizationId: string,
        userId: string,
        schedulerData: Omit<ReportScheduler, 'id' | 'status' | 'runCount' | 'errorCount' | 'createdAt' | 'updatedAt'>
    ): Promise<ReportScheduler> {
        const scheduler: ReportScheduler = {
            id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'active',
            runCount: 0,
            errorCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...schedulerData,
        };

        // Calculate next run time
        scheduler.nextRun = this.calculateNextRun(scheduler.schedule);

        await this.db.reportScheduler.create({
            data: {
                id: scheduler.id,
                reportId: scheduler.reportId,
                organizationId: scheduler.organizationId,
                name: scheduler.name,
                description: scheduler.description,
                schedule: JSON.stringify(scheduler.schedule),
                distribution: JSON.stringify(scheduler.distribution),
                status: scheduler.status,
                lastRun: scheduler.lastRun,
                nextRun: scheduler.nextRun,
                runCount: scheduler.runCount,
                errorCount: scheduler.errorCount,
                createdBy: scheduler.createdBy,
                createdAt: scheduler.createdAt,
                updatedAt: scheduler.updatedAt,
            },
        });

        // Register with scheduler service
        await this.schedulerService.scheduleJob(scheduler.id, scheduler.nextRun, async () => {
            await this.executeScheduledReport(scheduler.id);
        });

        return scheduler;
    }

    /**
     * Execute scheduled report
     */
    async executeScheduledReport(schedulerId: string): Promise<void> {
        const scheduler = await this.getReportScheduler(schedulerId);
        if (!scheduler || scheduler.status !== 'active') {
            return;
        }

        try {
            // Execute the report
            const execution = await this.executeReport(
                scheduler.reportId,
                'system',
                {}
            );

            // Wait for completion
            await this.waitForExecution(execution.id);

            // Distribute the report
            await this.distributeReport(scheduler, execution);

            // Update scheduler
            await this.updateSchedulerAfterRun(scheduler.id, true);

            // Send success notifications
            if (scheduler.distribution.notifications.onSuccess) {
                await this.sendSchedulerNotification(scheduler, 'success', execution);
            }

        } catch (error) {
            console.error(`Scheduled report execution failed for ${schedulerId}:`, error);

            // Update scheduler with error
            await this.updateSchedulerAfterRun(scheduler.id, false, error);

            // Send failure notifications
            if (scheduler.distribution.notifications.onFailure) {
                await this.sendSchedulerNotification(scheduler, 'failure', null, error);
            }
        }
    }

    /**
     * Create report share
     */
    async createReportShare(
        organizationId: string,
        userId: string,
        shareData: Omit<ReportShare, 'id' | 'status' | 'createdAt'>
    ): Promise<ReportShare> {
        const share: ReportShare = {
            id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'active',
            createdAt: new Date(),
            ...shareData,
        };

        await this.db.reportShare.create({
            data: {
                id: share.id,
                reportId: share.reportId,
                organizationId: share.organizationId,
                sharedBy: share.sharedBy,
                shareType: share.shareType,
                accessLevel: share.accessLevel,
                recipients: JSON.stringify(share.recipients),
                settings: JSON.stringify(share.settings),
                status: share.status,
                createdAt: share.createdAt,
                expiresAt: share.expiresAt,
            },
        });

        // Send share notifications
        await this.sendShareNotifications(share);

        return share;
    }

    /**
     * Export report with advanced compression
     */
    async exportReportWithCompression(
        reportId: string,
        userId: string,
        format: 'pdf' | 'excel' | 'csv' | 'json' | 'xml',
        compressionType: 'none' | 'gzip' | 'zip' = 'none',
        options?: {
            password?: string;
            watermark?: string;
            customStyling?: ExportStyling;
        }
    ): Promise<ExportResult> {
        // Execute report first
        const execution = await this.executeReport(reportId, userId);
        await this.waitForExecution(execution.id);

        if (execution.status === 'failed') {
            throw new Error(`Report execution failed: ${execution.error}`);
        }

        // Create export configuration with compression
        const exportConfig: ExportConfiguration & { password?: string; watermark?: string } = {
            compression: compressionType,
            styling: options?.customStyling,
            metadata: true,
        };

        if (options?.password) {
            (exportConfig as any).password = options.password;
        }

        if (options?.watermark) {
            (exportConfig as any).watermark = options.watermark;
        }

        // Create export request
        const exportRequest = await this.exportService.createExportRequest(
            execution.organizationId,
            userId,
            {
                organizationId: execution.organizationId,
                requestedBy: userId,
                type: 'report',
                format,
                source: {
                    type: 'data',
                    data: execution.result?.data || [],
                },
                configuration: exportConfig,
            }
        );

        // Wait for export completion
        await this.waitForExport(exportRequest.id);

        const completedExport = await this.exportService.getExportRequest(exportRequest.id);
        if (!completedExport?.result) {
            throw new Error('Export failed');
        }

        return completedExport.result;
    }

    /**
     * Get visual query builder
     */
    private async getVisualQueryBuilder(builderId: string): Promise<VisualQueryBuilder | null> {
        const builderData = await this.db.visualQueryBuilder.findUnique({
            where: { id: builderId },
        });

        if (!builderData) return null;

        return {
            id: builderData.id,
            name: builderData.name,
            organizationId: builderData.organizationId,
            configuration: JSON.parse(builderData.configuration),
            createdBy: builderData.createdBy,
            createdAt: builderData.createdAt,
            updatedAt: builderData.updatedAt,
        };
    }

    /**
     * Get report scheduler
     */
    private async getReportScheduler(schedulerId: string): Promise<ReportScheduler | null> {
        const schedulerData = await this.db.reportScheduler.findUnique({
            where: { id: schedulerId },
        });

        if (!schedulerData) return null;

        return {
            id: schedulerData.id,
            reportId: schedulerData.reportId,
            organizationId: schedulerData.organizationId,
            name: schedulerData.name,
            description: schedulerData.description,
            schedule: JSON.parse(schedulerData.schedule),
            distribution: JSON.parse(schedulerData.distribution),
            status: schedulerData.status,
            lastRun: schedulerData.lastRun,
            nextRun: schedulerData.nextRun,
            runCount: schedulerData.runCount,
            errorCount: schedulerData.errorCount,
            createdBy: schedulerData.createdBy,
            createdAt: schedulerData.createdAt,
            updatedAt: schedulerData.updatedAt,
        };
    }

    /**
     * Group filters by condition
     */
    private groupFilters(filters: VisualFilter[]): VisualFilter[][] {
        const groups: VisualFilter[][] = [];
        let currentGroup: VisualFilter[] = [];

        filters.forEach(filter => {
            if (filter.condition === 'or' && currentGroup.length > 0) {
                groups.push(currentGroup);
                currentGroup = [filter];
            } else {
                currentGroup.push(filter);
            }
        });

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    }

    /**
     * Build filter clause
     */
    private buildFilterClause(filter: VisualFilter): string {
        const { field, operator, value, values } = filter;

        switch (operator) {
            case 'eq': return `${field} = '${value}'`;
            case 'ne': return `${field} != '${value}'`;
            case 'gt': return `${field} > '${value}'`;
            case 'gte': return `${field} >= '${value}'`;
            case 'lt': return `${field} < '${value}'`;
            case 'lte': return `${field} <= '${value}'`;
            case 'in': return `${field} IN (${values?.map(v => `'${v}'`).join(', ')})`;
            case 'not_in': return `${field} NOT IN (${values?.map(v => `'${v}'`).join(', ')})`;
            case 'like': return `${field} LIKE '%${value}%'`;
            case 'between': return `${field} BETWEEN '${values?.[0]}' AND '${values?.[1]}'`;
            case 'is_null': return `${field} IS NULL`;
            case 'is_not_null': return `${field} IS NOT NULL`;
            default: return `${field} = '${value}'`;
        }
    }

    /**
     * Build date grouping
     */
    private buildDateGrouping(field: string, grouping: string): string {
        switch (grouping) {
            case 'day': return `DATE(${field})`;
            case 'week': return `DATE_TRUNC('week', ${field})`;
            case 'month': return `DATE_TRUNC('month', ${field})`;
            case 'quarter': return `DATE_TRUNC('quarter', ${field})`;
            case 'year': return `DATE_TRUNC('year', ${field})`;
            default: return field;
        }
    }

    /**
     * Calculate next run time
     */
    private calculateNextRun(schedule: ScheduleConfig): Date {
        const now = new Date();

        if (schedule.type === 'cron' && schedule.cronExpression) {
            // Parse cron expression and calculate next run
            // This is a simplified implementation
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next day
        }

        if (schedule.type === 'interval' && schedule.interval) {
            const { value, unit } = schedule.interval;
            let milliseconds = 0;

            switch (unit) {
                case 'minutes': milliseconds = value * 60 * 1000; break;
                case 'hours': milliseconds = value * 60 * 60 * 1000; break;
                case 'days': milliseconds = value * 24 * 60 * 60 * 1000; break;
                case 'weeks': milliseconds = value * 7 * 24 * 60 * 60 * 1000; break;
                case 'months': milliseconds = value * 30 * 24 * 60 * 60 * 1000; break;
            }

            return new Date(now.getTime() + milliseconds);
        }

        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default: next day
    }

    /**
     * Wait for execution completion
     */
    private async waitForExecution(executionId: string): Promise<void> {
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout

        while (attempts < maxAttempts) {
            const execution = await this.db.reportExecution.findUnique({
                where: { id: executionId },
            });

            if (!execution) {
                throw new Error('Execution not found');
            }

            if (execution.status === 'completed' || execution.status === 'failed') {
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        throw new Error('Execution timeout');
    }

    /**
     * Wait for export completion
     */
    private async waitForExport(exportId: string): Promise<void> {
        let attempts = 0;
        const maxAttempts = 120; // 2 minutes timeout

        while (attempts < maxAttempts) {
            const exportRequest = await this.exportService.getExportRequest(exportId);

            if (!exportRequest) {
                throw new Error('Export request not found');
            }

            if (exportRequest.status === 'completed' || exportRequest.status === 'failed') {
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        throw new Error('Export timeout');
    }

    /**
     * Distribute report
     */
    private async distributeReport(scheduler: ReportScheduler, execution: ReportExecution): Promise<void> {
        const { distribution } = scheduler;

        for (const recipient of distribution.recipients) {
            for (const formatConfig of distribution.formats) {
                try {
                    // Export in the specified format
                    const exportResult = await this.exportReportWithCompression(
                        scheduler.reportId,
                        'system',
                        formatConfig.format,
                        formatConfig.compression,
                        {
                            password: formatConfig.password,
                            watermark: formatConfig.watermark,
                            customStyling: formatConfig.customization.styling,
                        }
                    );

                    // Deliver to recipient
                    await this.deliverToRecipient(recipient, exportResult, distribution.delivery);

                } catch (error) {
                    console.error(`Failed to distribute report to ${recipient.identifier}:`, error);
                }
            }
        }
    }

    /**
     * Deliver to recipient
     */
    private async deliverToRecipient(
        recipient: RecipientConfig,
        exportResult: ExportResult,
        deliveryConfig: DeliveryConfig
    ): Promise<void> {
        switch (recipient.type) {
            case 'email':
                await this.notificationService.sendEmail({
                    to: recipient.identifier,
                    subject: 'Scheduled Report',
                    body: 'Please find your scheduled report attached.',
                    attachments: [{
                        filename: exportResult.filename,
                        url: exportResult.url,
                    }],
                });
                break;

            case 'webhook':
                await this.notificationService.sendWebhook({
                    url: recipient.identifier,
                    payload: {
                        type: 'scheduled_report',
                        report: exportResult,
                    },
                });
                break;

            case 'slack':
                await this.notificationService.sendSlackMessage({
                    channel: recipient.identifier,
                    message: 'Your scheduled report is ready',
                    attachments: [exportResult.url],
                });
                break;

            default:
                console.warn(`Unsupported recipient type: ${recipient.type}`);
        }
    }

    /**
     * Update scheduler after run
     */
    private async updateSchedulerAfterRun(
        schedulerId: string,
        success: boolean,
        error?: any
    ): Promise<void> {
        const scheduler = await this.getReportScheduler(schedulerId);
        if (!scheduler) return;

        const updates: any = {
            lastRun: new Date(),
            runCount: scheduler.runCount + 1,
            updatedAt: new Date(),
        };

        if (success) {
            updates.nextRun = this.calculateNextRun(scheduler.schedule);
        } else {
            updates.errorCount = scheduler.errorCount + 1;
            updates.lastError = error instanceof Error ? error.message : 'Unknown error';
        }

        await this.db.reportScheduler.update({
            where: { id: schedulerId },
            data: updates,
        });

        // Reschedule if successful and not at max runs
        if (success && (!scheduler.schedule.maxRuns || scheduler.runCount < scheduler.schedule.maxRuns)) {
            await this.schedulerService.scheduleJob(schedulerId, updates.nextRun, async () => {
                await this.executeScheduledReport(schedulerId);
            });
        }
    }

    /**
     * Send scheduler notification
     */
    private async sendSchedulerNotification(
        scheduler: ReportScheduler,
        type: 'success' | 'failure',
        execution?: ReportExecution | null,
        error?: any
    ): Promise<void> {
        const { notifications } = scheduler.distribution;

        for (const channel of notifications.channels) {
            const message = type === 'success'
                ? `Scheduled report "${scheduler.name}" completed successfully`
                : `Scheduled report "${scheduler.name}" failed: ${error?.message || 'Unknown error'}`;

            switch (channel.type) {
                case 'email':
                    await this.notificationService.sendEmail({
                        to: channel.configuration.recipients,
                        subject: `Report Schedule ${type === 'success' ? 'Success' : 'Failure'}`,
                        body: message,
                    });
                    break;

                case 'slack':
                    await this.notificationService.sendSlackMessage({
                        channel: channel.configuration.channel,
                        message,
                    });
                    break;

                default:
                    console.warn(`Unsupported notification channel: ${channel.type}`);
            }
        }
    }

    /**
     * Send share notifications
     */
    private async sendShareNotifications(share: ReportShare): Promise<void> {
        for (const recipient of share.recipients) {
            if (recipient.type === 'external') {
                await this.notificationService.sendEmail({
                    to: recipient.identifier,
                    subject: 'Report Shared With You',
                    body: `A report has been shared with you. Access level: ${share.accessLevel}`,
                });
            }
        }
    }
    async createReport(
        organizationId: string,
        userId: string,
        reportData: Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<ReportDefinition> {
        const report: ReportDefinition = {
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...reportData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const validatedReport = ReportDefinitionSchema.parse(report);

        await this.db.report.create({
            data: {
                id: validatedReport.id,
                name: validatedReport.name,
                description: validatedReport.description,
                organizationId: validatedReport.organizationId,
                createdBy: validatedReport.createdBy,
                category: validatedReport.category,
                query: JSON.stringify(validatedReport.query),
                visualization: JSON.stringify(validatedReport.visualization),
                schedule: validatedReport.schedule ? JSON.stringify(validatedReport.schedule) : null,
                permissions: JSON.stringify(validatedReport.permissions),
                parameters: validatedReport.parameters ? JSON.stringify(validatedReport.parameters) : null,
                tags: validatedReport.tags,
                createdAt: validatedReport.createdAt,
                updatedAt: validatedReport.updatedAt,
            },
        });

        return validatedReport;
    }

    /**
     * Execute a report
     */
    async executeReport(
        reportId: string,
        userId: string,
        parameters?: Record<string, any>
    ): Promise<ReportExecution> {
        const report = await this.getReport(reportId);
        if (!report) {
            throw new Error('Report not found');
        }

        if (!this.canViewReport(report, userId)) {
            throw new Error('Insufficient permissions to execute report');
        }

        const execution: ReportExecution = {
            id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            reportId,
            organizationId: report.organizationId,
            executedBy: userId,
            parameters: parameters || {},
            status: 'pending',
            createdAt: new Date(),
        };

        // Store execution record
        await this.db.reportExecution.create({
            data: {
                id: execution.id,
                reportId: execution.reportId,
                organizationId: execution.organizationId,
                executedBy: execution.executedBy,
                parameters: JSON.stringify(execution.parameters),
                status: execution.status,
                createdAt: execution.createdAt,
            },
        });

        // Execute report asynchronously
        this.executeReportAsync(execution, report).catch(error => {
            console.error('Report execution failed:', error);
        });

        return execution;
    }

    /**
     * Execute report asynchronously
     */
    private async executeReportAsync(
        execution: ReportExecution,
        report: ReportDefinition
    ): Promise<void> {
        const startTime = Date.now();

        try {
            // Update status to running
            await this.updateExecutionStatus(execution.id, 'running');

            // Execute the query
            const result = await this.executeQuery(report.query, execution.parameters, report.organizationId);

            // Apply visualization
            const visualizedResult = await this.applyVisualization(result, report.visualization);

            // Generate export URLs if needed
            const exportUrls = await this.generateExportUrls(execution.id, visualizedResult);

            const executionTime = Date.now() - startTime;

            // Update execution with results
            await this.db.reportExecution.update({
                where: { id: execution.id },
                data: {
                    status: 'completed',
                    result: JSON.stringify({
                        data: visualizedResult.data,
                        metadata: {
                            totalRows: visualizedResult.data.length,
                            columns: this.extractColumnMetadata(visualizedResult.data),
                            executionTime,
                            dataSource: report.query.source,
                            generatedAt: new Date(),
                        },
                        visualization: visualizedResult.visualization,
                        exportUrls,
                    }),
                    executionTime,
                    completedAt: new Date(),
                },
            });

        } catch (error) {
            const executionTime = Date.now() - startTime;

            await this.db.reportExecution.update({
                where: { id: execution.id },
                data: {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    executionTime,
                    completedAt: new Date(),
                },
            });
        }
    }

    /**
     * Execute query based on type
     */
    private async executeQuery(
        query: ReportQuery,
        parameters: Record<string, any>,
        organizationId: string
    ): Promise<any[]> {
        switch (query.type) {
            case 'sql':
                return this.executeSqlQuery(query, parameters, organizationId);

            case 'analytics':
                return this.executeAnalyticsQuery(query, parameters, organizationId);

            case 'aggregation':
                return this.executeAggregationQuery(query, parameters, organizationId);

            default:
                throw new Error(`Unsupported query type: ${query.type}`);
        }
    }

    /**
     * Execute SQL query with security checks
     */
    private async executeSqlQuery(
        query: ReportQuery,
        parameters: Record<string, any>,
        organizationId: string
    ): Promise<any[]> {
        // Security: Only allow predefined, safe SQL queries
        const allowedQueries = this.getAllowedSqlQueries();

        if (!allowedQueries.includes(query.source)) {
            throw new Error('SQL query not allowed for security reasons');
        }

        // Replace parameters in query
        let sqlQuery = query.source;
        Object.entries(parameters).forEach(([key, value]) => {
            sqlQuery = sqlQuery.replace(new RegExp(`\\$${key}`, 'g'), String(value));
        });

        // Add organization filter
        if (!sqlQuery.toLowerCase().includes('where')) {
            sqlQuery += ` WHERE organization_id = '${organizationId}'`;
        } else {
            sqlQuery += ` AND organization_id = '${organizationId}'`;
        }

        // Apply additional filters
        if (query.filters) {
            query.filters.forEach(filter => {
                const condition = filter.condition || 'AND';
                sqlQuery += ` ${condition} ${filter.field} ${this.getOperatorSql(filter.operator)} ${this.formatValue(filter.value)}`;
            });
        }

        // Apply grouping
        if (query.groupBy && query.groupBy.length > 0) {
            sqlQuery += ` GROUP BY ${query.groupBy.join(', ')}`;
        }

        // Apply ordering
        if (query.orderBy && query.orderBy.length > 0) {
            const orderClauses = query.orderBy.map(order => `${order.field} ${order.direction.toUpperCase()}`);
            sqlQuery += ` ORDER BY ${orderClauses.join(', ')}`;
        }

        // Apply limit and offset
        if (query.limit) {
            sqlQuery += ` LIMIT ${query.limit}`;
        }
        if (query.offset) {
            sqlQuery += ` OFFSET ${query.offset}`;
        }

        try {
            return await this.db.$queryRaw`${sqlQuery}`;
        } catch (error) {
            console.error('SQL query execution error:', error);
            throw new Error('Failed to execute SQL query');
        }
    }

    /**
     * Execute analytics query
     */
    private async executeAnalyticsQuery(
        query: ReportQuery,
        parameters: Record<string, any>,
        organizationId: string
    ): Promise<any[]> {
        const mergedParams = { ...parameters, organizationId };

        switch (query.source) {
            case 'usage_analytics':
                const usageData = await this.analyticsService.generateUsageAnalytics(
                    organizationId,
                    (mergedParams as any).timeRange
                );
                return this.flattenAnalyticsData(usageData);

            case 'team_performance':
                const teamData = await this.analyticsService.generateTeamPerformanceMetrics(
                    organizationId,
                    (mergedParams as any).timeRange
                );
                return this.flattenTeamData(teamData);

            case 'collaboration_insights':
                const collabData = await this.analyticsService.generateCollaborationInsights(organizationId);
                return this.flattenCollaborationData(collabData);

            default:
                throw new Error(`Unknown analytics query: ${query.source}`);
        }
    }

    /**
     * Execute aggregation query
     */
    private async executeAggregationQuery(
        query: ReportQuery,
        parameters: Record<string, any>,
        organizationId: string
    ): Promise<any[]> {
        // Parse aggregation configuration from query.source
        const config = JSON.parse(query.source);

        // Build aggregation query
        const aggregationQuery = this.buildAggregationQuery(config, parameters, organizationId);

        return await this.db.$queryRaw`${aggregationQuery}`;
    }

    /**
     * Apply visualization to data
     */
    private async applyVisualization(data: any[], visualization: ReportVisualization): Promise<any> {
        switch (visualization.type) {
            case 'table':
                return this.applyTableVisualization(data, visualization.configuration);

            case 'chart':
                return this.applyChartVisualization(data, visualization.configuration);

            case 'pivot':
                return this.applyPivotVisualization(data, visualization.configuration);

            case 'dashboard':
                return this.applyDashboardVisualization(data, visualization.configuration);

            default:
                return { data, visualization: null };
        }
    }

    /**
     * Get allowed SQL queries for security
     */
    private getAllowedSqlQueries(): string[] {
        return [
            'SELECT * FROM documents WHERE created_at >= $startDate AND created_at <= $endDate',
            'SELECT * FROM signing_requests WHERE status = $status',
            'SELECT * FROM users WHERE last_login >= $startDate',
            'SELECT COUNT(*) as count, DATE(created_at) as date FROM documents GROUP BY DATE(created_at)',
            // Add more predefined safe queries as needed
        ];
    }

    /**
     * Get SQL operator for filter
     */
    private getOperatorSql(operator: string): string {
        const operators: Record<string, string> = {
            'eq': '=',
            'ne': '!=',
            'gt': '>',
            'gte': '>=',
            'lt': '<',
            'lte': '<=',
            'in': 'IN',
            'not_in': 'NOT IN',
            'like': 'LIKE',
            'between': 'BETWEEN',
        };
        return operators[operator] || '=';
    }

    /**
     * Format value for SQL
     */
    private formatValue(value: any): string {
        if (typeof value === 'string') {
            return `'${value.replace(/'/g, "''")}'`;
        }
        if (Array.isArray(value)) {
            return `(${value.map(v => this.formatValue(v)).join(', ')})`;
        }
        return String(value);
    }

    /**
     * Build aggregation query
     */
    private buildAggregationQuery(
        config: any,
        parameters: Record<string, any>,
        organizationId: string
    ): string {
        // This would build a complex aggregation query based on configuration
        // Simplified implementation
        return `SELECT COUNT(*) as total FROM ${config.table} WHERE organization_id = '${organizationId}'`;
    }

    /**
     * Apply table visualization
     */
    private applyTableVisualization(data: any[], config: VisualizationConfig): any {
        return {
            data,
            visualization: {
                type: 'table',
                columns: config.columns || this.inferColumns(data),
            },
        };
    }

    /**
     * Apply chart visualization
     */
    private applyChartVisualization(data: any[], config: VisualizationConfig): any {
        return {
            data,
            visualization: {
                type: 'chart',
                chartType: config.chartType || 'bar',
                series: this.buildChartSeries(data, config),
            },
        };
    }

    /**
     * Apply pivot visualization
     */
    private applyPivotVisualization(data: any[], config: VisualizationConfig): any {
        if (!config.pivotConfig) {
            throw new Error('Pivot configuration required for pivot visualization');
        }

        const pivotData = this.buildPivotTable(data, config.pivotConfig);

        return {
            data: pivotData,
            visualization: {
                type: 'pivot',
                config: config.pivotConfig,
            },
        };
    }

    /**
     * Apply dashboard visualization
     */
    private applyDashboardVisualization(data: any[], config: VisualizationConfig): any {
        return {
            data,
            visualization: {
                type: 'dashboard',
                widgets: this.buildDashboardWidgets(data, config),
            },
        };
    }

    // Helper methods for data processing
    private flattenAnalyticsData(data: any): any[] {
        // Convert analytics data to flat array format
        return [data];
    }

    private flattenTeamData(data: any): any[] {
        // Convert team performance data to flat array format
        return data.teams || [];
    }

    private flattenCollaborationData(data: any): any[] {
        // Convert collaboration data to flat array format
        return [data];
    }

    private inferColumns(data: any[]): ColumnConfig[] {
        if (data.length === 0) return [];

        const firstRow = data[0];
        return Object.keys(firstRow).map(key => ({
            field: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            type: this.inferColumnType(firstRow[key]),
            sortable: true,
            filterable: true,
            visible: true,
        }));
    }

    private inferColumnType(value: any): 'string' | 'number' | 'date' | 'boolean' {
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (value instanceof Date) return 'date';
        if (typeof value === 'string' && !isNaN(Date.parse(value))) return 'date';
        return 'string';
    }

    private buildChartSeries(data: any[], config: VisualizationConfig): any[] {
        // Build chart series based on configuration
        return [];
    }

    private buildPivotTable(data: any[], config: PivotConfig): any[] {
        // Build pivot table from data
        return [];
    }

    private buildDashboardWidgets(data: any[], config: VisualizationConfig): any[] {
        // Build dashboard widgets from data
        return [];
    }

    private extractColumnMetadata(data: any[]): ColumnMetadata[] {
        if (data.length === 0) return [];

        const firstRow = data[0];
        return Object.keys(firstRow).map(key => ({
            name: key,
            type: this.inferColumnType(firstRow[key]),
            nullable: data.some(row => row[key] == null),
        }));
    }

    private async generateExportUrls(executionId: string, result: any): Promise<Record<string, string>> {
        // Generate URLs for different export formats
        return {
            csv: `/api/reports/export/${executionId}/csv`,
            excel: `/api/reports/export/${executionId}/excel`,
            pdf: `/api/reports/export/${executionId}/pdf`,
            json: `/api/reports/export/${executionId}/json`,
        };
    }

    private async updateExecutionStatus(executionId: string, status: string): Promise<void> {
        await this.db.reportExecution.update({
            where: { id: executionId },
            data: { status },
        });
    }

    private async getReport(reportId: string): Promise<ReportDefinition | null> {
        const reportData = await this.db.report.findUnique({
            where: { id: reportId },
        });

        if (!reportData) return null;

        return {
            id: reportData.id,
            name: reportData.name,
            description: reportData.description,
            organizationId: reportData.organizationId,
            createdBy: reportData.createdBy,
            category: reportData.category,
            query: JSON.parse(reportData.query),
            visualization: JSON.parse(reportData.visualization),
            schedule: reportData.schedule ? JSON.parse(reportData.schedule) : undefined,
            permissions: JSON.parse(reportData.permissions),
            parameters: reportData.parameters ? JSON.parse(reportData.parameters) : undefined,
            tags: reportData.tags,
            createdAt: reportData.createdAt,
            updatedAt: reportData.updatedAt,
        };
    }

    private canViewReport(report: ReportDefinition, userId: string): boolean {
        return report.createdBy === userId ||
            report.permissions.view.includes(userId) ||
            report.permissions.view.includes('*');
    }
}

// Export types
export type ValidatedReportDefinition = z.infer<typeof ReportDefinitionSchema>;
export type ValidatedReportQuery = z.infer<typeof ReportQuerySchema>;