import { z } from 'zod';

// ============================================================================
// DASHBOARD BUILDER TYPES
// ============================================================================

export interface DashboardWidget {
    id: string;
    type: 'chart' | 'metric' | 'table' | 'text' | 'filter';
    title: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    configuration: WidgetConfiguration;
    dataSource?: DataSourceConfig;
    refreshInterval?: number; // in seconds
    permissions?: WidgetPermissions;
}

export interface WidgetConfiguration {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
    metrics?: string[];
    dimensions?: string[];
    filters?: FilterConfig[];
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    timeRange?: TimeRangeConfig;
    styling?: WidgetStyling;
    interactions?: WidgetInteraction[];
}

export interface DataSourceConfig {
    type: 'analytics' | 'database' | 'api' | 'custom';
    query?: string;
    endpoint?: string;
    parameters?: Record<string, any>;
    cacheTimeout?: number;
}

export interface FilterConfig {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value?: any;
    label?: string;
}

export interface TimeRangeConfig {
    type: 'relative' | 'absolute';
    value: string | { start: Date; end: Date };
    granularity?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface WidgetStyling {
    colors?: string[];
    theme?: 'light' | 'dark' | 'auto';
    fontSize?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltips?: boolean;
}

export interface WidgetInteraction {
    type: 'click' | 'hover' | 'drill-down';
    action: 'filter' | 'navigate' | 'expand' | 'custom';
    target?: string;
    parameters?: Record<string, any>;
}

export interface WidgetPermissions {
    view: string[];
    edit: string[];
    delete: string[];
}

export interface Dashboard {
    id: string;
    name: string;
    description?: string;
    organizationId: string;
    createdBy: string;
    isPublic: boolean;
    widgets: DashboardWidget[];
    layout: DashboardLayout;
    permissions: DashboardPermissions;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface DashboardLayout {
    columns: number;
    rowHeight: number;
    margin: [number, number];
    containerPadding: [number, number];
    breakpoints: Record<string, number>;
    layouts: Record<string, LayoutItem[]>;
}

export interface LayoutItem {
    i: string; // widget id
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    static?: boolean;
}

export interface DashboardPermissions {
    view: string[];
    edit: string[];
    delete: string[];
    share: string[];
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const WidgetConfigurationSchema = z.object({
    chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter', 'heatmap']).optional(),
    metrics: z.array(z.string()).optional(),
    dimensions: z.array(z.string()).optional(),
    filters: z.array(z.object({
        field: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
        value: z.any(),
        label: z.string().optional(),
    })).optional(),
    aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
    timeRange: z.object({
        type: z.enum(['relative', 'absolute']),
        value: z.union([z.string(), z.object({
            start: z.date(),
            end: z.date(),
        })]),
        granularity: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']).optional(),
    }).optional(),
    styling: z.object({
        colors: z.array(z.string()).optional(),
        theme: z.enum(['light', 'dark', 'auto']).optional(),
        fontSize: z.number().optional(),
        showLegend: z.boolean().optional(),
        showGrid: z.boolean().optional(),
        showTooltips: z.boolean().optional(),
    }).optional(),
    interactions: z.array(z.object({
        type: z.enum(['click', 'hover', 'drill-down']),
        action: z.enum(['filter', 'navigate', 'expand', 'custom']),
        target: z.string().optional(),
        parameters: z.record(z.any()).optional(),
    })).optional(),
});

export const DashboardWidgetSchema = z.object({
    id: z.string(),
    type: z.enum(['chart', 'metric', 'table', 'text', 'filter']),
    title: z.string(),
    position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
    }),
    configuration: WidgetConfigurationSchema,
    dataSource: z.object({
        type: z.enum(['analytics', 'database', 'api', 'custom']),
        query: z.string().optional(),
        endpoint: z.string().optional(),
        parameters: z.record(z.any()).optional(),
        cacheTimeout: z.number().optional(),
    }).optional(),
    refreshInterval: z.number().optional(),
    permissions: z.object({
        view: z.array(z.string()),
        edit: z.array(z.string()),
        delete: z.array(z.string()),
    }).optional(),
});

export const DashboardSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    organizationId: z.string(),
    createdBy: z.string(),
    isPublic: z.boolean(),
    widgets: z.array(DashboardWidgetSchema),
    layout: z.object({
        columns: z.number(),
        rowHeight: z.number(),
        margin: z.tuple([z.number(), z.number()]),
        containerPadding: z.tuple([z.number(), z.number()]),
        breakpoints: z.record(z.number()),
        layouts: z.record(z.array(z.object({
            i: z.string(),
            x: z.number(),
            y: z.number(),
            w: z.number(),
            h: z.number(),
            minW: z.number().optional(),
            maxW: z.number().optional(),
            minH: z.number().optional(),
            maxH: z.number().optional(),
            static: z.boolean().optional(),
        }))),
    }),
    permissions: z.object({
        view: z.array(z.string()),
        edit: z.array(z.string()),
        delete: z.array(z.string()),
        share: z.array(z.string()),
    }),
    tags: z.array(z.string()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// ============================================================================
// DASHBOARD BUILDER SERVICE
// ============================================================================

export class DashboardBuilderService {
    constructor(private db: any, private analyticsService: any) { }

    /**
     * Create a new dashboard
     */
    async createDashboard(
        organizationId: string,
        userId: string,
        dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<Dashboard> {
        const dashboard: Dashboard = {
            id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...dashboardData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const validatedDashboard = DashboardSchema.parse(dashboard);

        await this.db.dashboard.create({
            data: {
                id: validatedDashboard.id,
                name: validatedDashboard.name,
                description: validatedDashboard.description,
                organizationId: validatedDashboard.organizationId,
                createdBy: validatedDashboard.createdBy,
                isPublic: validatedDashboard.isPublic,
                widgets: JSON.stringify(validatedDashboard.widgets),
                layout: JSON.stringify(validatedDashboard.layout),
                permissions: JSON.stringify(validatedDashboard.permissions),
                tags: validatedDashboard.tags,
                createdAt: validatedDashboard.createdAt,
                updatedAt: validatedDashboard.updatedAt,
            },
        });

        return validatedDashboard;
    }

    /**
     * Update an existing dashboard
     */
    async updateDashboard(
        dashboardId: string,
        userId: string,
        updates: Partial<Dashboard>
    ): Promise<Dashboard> {
        const existingDashboard = await this.getDashboard(dashboardId);

        if (!existingDashboard) {
            throw new Error('Dashboard not found');
        }

        // Check permissions
        if (!this.canEditDashboard(existingDashboard, userId)) {
            throw new Error('Insufficient permissions to edit dashboard');
        }

        const updatedDashboard: Dashboard = {
            ...existingDashboard,
            ...updates,
            updatedAt: new Date(),
        };

        const validatedDashboard = DashboardSchema.parse(updatedDashboard);

        await this.db.dashboard.update({
            where: { id: dashboardId },
            data: {
                name: validatedDashboard.name,
                description: validatedDashboard.description,
                isPublic: validatedDashboard.isPublic,
                widgets: JSON.stringify(validatedDashboard.widgets),
                layout: JSON.stringify(validatedDashboard.layout),
                permissions: JSON.stringify(validatedDashboard.permissions),
                tags: validatedDashboard.tags,
                updatedAt: validatedDashboard.updatedAt,
            },
        });

        return validatedDashboard;
    }

    /**
     * Get dashboard by ID
     */
    async getDashboard(dashboardId: string): Promise<Dashboard | null> {
        const dashboardData = await this.db.dashboard.findUnique({
            where: { id: dashboardId },
        });

        if (!dashboardData) {
            return null;
        }

        return {
            id: dashboardData.id,
            name: dashboardData.name,
            description: dashboardData.description,
            organizationId: dashboardData.organizationId,
            createdBy: dashboardData.createdBy,
            isPublic: dashboardData.isPublic,
            widgets: JSON.parse(dashboardData.widgets),
            layout: JSON.parse(dashboardData.layout),
            permissions: JSON.parse(dashboardData.permissions),
            tags: dashboardData.tags,
            createdAt: dashboardData.createdAt,
            updatedAt: dashboardData.updatedAt,
        };
    }

    /**
     * List dashboards for an organization
     */
    async listDashboards(
        organizationId: string,
        userId: string,
        options?: {
            includePublic?: boolean;
            tags?: string[];
            limit?: number;
            offset?: number;
        }
    ): Promise<Dashboard[]> {
        const where: any = {
            organizationId,
        };

        if (options?.tags && options.tags.length > 0) {
            where.tags = {
                hasSome: options.tags,
            };
        }

        const dashboards = await this.db.dashboard.findMany({
            where,
            take: options?.limit || 50,
            skip: options?.offset || 0,
            orderBy: { updatedAt: 'desc' },
        });

        return dashboards
            .map((dashboard: any) => ({
                id: dashboard.id,
                name: dashboard.name,
                description: dashboard.description,
                organizationId: dashboard.organizationId,
                createdBy: dashboard.createdBy,
                isPublic: dashboard.isPublic,
                widgets: JSON.parse(dashboard.widgets),
                layout: JSON.parse(dashboard.layout),
                permissions: JSON.parse(dashboard.permissions),
                tags: dashboard.tags,
                createdAt: dashboard.createdAt,
                updatedAt: dashboard.updatedAt,
            }))
            .filter((dashboard: Dashboard) => this.canViewDashboard(dashboard, userId));
    }

    /**
     * Delete a dashboard
     */
    async deleteDashboard(dashboardId: string, userId: string): Promise<void> {
        const dashboard = await this.getDashboard(dashboardId);

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        if (!this.canDeleteDashboard(dashboard, userId)) {
            throw new Error('Insufficient permissions to delete dashboard');
        }

        await this.db.dashboard.delete({
            where: { id: dashboardId },
        });
    }

    /**
     * Add widget to dashboard
     */
    async addWidget(
        dashboardId: string,
        userId: string,
        widget: DashboardWidget
    ): Promise<Dashboard> {
        const dashboard = await this.getDashboard(dashboardId);

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        if (!this.canEditDashboard(dashboard, userId)) {
            throw new Error('Insufficient permissions to edit dashboard');
        }

        const validatedWidget = DashboardWidgetSchema.parse(widget);

        const updatedWidgets = [...dashboard.widgets, validatedWidget];

        return this.updateDashboard(dashboardId, userId, {
            widgets: updatedWidgets,
        });
    }

    /**
     * Update widget in dashboard
     */
    async updateWidget(
        dashboardId: string,
        widgetId: string,
        userId: string,
        updates: Partial<DashboardWidget>
    ): Promise<Dashboard> {
        const dashboard = await this.getDashboard(dashboardId);

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        if (!this.canEditDashboard(dashboard, userId)) {
            throw new Error('Insufficient permissions to edit dashboard');
        }

        const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
        if (widgetIndex === -1) {
            throw new Error('Widget not found');
        }

        const updatedWidget = { ...dashboard.widgets[widgetIndex], ...updates };
        const validatedWidget = DashboardWidgetSchema.parse(updatedWidget);

        const updatedWidgets = [...dashboard.widgets];
        updatedWidgets[widgetIndex] = validatedWidget;

        return this.updateDashboard(dashboardId, userId, {
            widgets: updatedWidgets,
        });
    }

    /**
     * Remove widget from dashboard
     */
    async removeWidget(
        dashboardId: string,
        widgetId: string,
        userId: string
    ): Promise<Dashboard> {
        const dashboard = await this.getDashboard(dashboardId);

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        if (!this.canEditDashboard(dashboard, userId)) {
            throw new Error('Insufficient permissions to edit dashboard');
        }

        const updatedWidgets = dashboard.widgets.filter(w => w.id !== widgetId);

        return this.updateDashboard(dashboardId, userId, {
            widgets: updatedWidgets,
        });
    }

    /**
     * Get widget data
     */
    async getWidgetData(
        widgetId: string,
        organizationId: string,
        parameters?: Record<string, any>
    ): Promise<any> {
        // Find the widget in any dashboard
        const dashboards = await this.db.dashboard.findMany({
            where: { organizationId },
        });

        let widget: DashboardWidget | null = null;
        for (const dashboard of dashboards) {
            const widgets = JSON.parse(dashboard.widgets);
            const foundWidget = widgets.find((w: DashboardWidget) => w.id === widgetId);
            if (foundWidget) {
                widget = foundWidget;
                break;
            }
        }

        if (!widget) {
            throw new Error('Widget not found');
        }

        return this.executeWidgetDataSource(widget, organizationId, parameters);
    }

    /**
     * Execute widget data source
     */
    private async executeWidgetDataSource(
        widget: DashboardWidget,
        organizationId: string,
        parameters?: Record<string, any>
    ): Promise<any> {
        if (!widget.dataSource) {
            return null;
        }

        const { type, query, endpoint, parameters: dsParams } = widget.dataSource;
        const mergedParams = { ...dsParams, ...parameters, organizationId };

        switch (type) {
            case 'analytics':
                return this.executeAnalyticsQuery(query, mergedParams);

            case 'database':
                return this.executeDatabaseQuery(query, mergedParams);

            case 'api':
                return this.executeApiCall(endpoint, mergedParams);

            case 'custom':
                return this.executeCustomDataSource(query, mergedParams);

            default:
                throw new Error(`Unsupported data source type: ${type}`);
        }
    }

    /**
     * Execute analytics query
     */
    private async executeAnalyticsQuery(query?: string, parameters?: Record<string, any>): Promise<any> {
        if (!query || !parameters?.organizationId) {
            return null;
        }

        // Parse the query to determine what analytics to fetch
        if (query.includes('usage_analytics')) {
            return this.analyticsService.generateUsageAnalytics(
                parameters.organizationId,
                parameters.timeRange
            );
        }

        if (query.includes('team_performance')) {
            return this.analyticsService.generateTeamPerformanceMetrics(
                parameters.organizationId,
                parameters.timeRange
            );
        }

        // Default to usage analytics
        return this.analyticsService.generateUsageAnalytics(
            parameters.organizationId,
            parameters.timeRange
        );
    }

    /**
     * Execute database query
     */
    private async executeDatabaseQuery(query?: string, parameters?: Record<string, any>): Promise<any> {
        if (!query) {
            return null;
        }

        // For security, only allow predefined queries or use a query builder
        // This is a simplified implementation
        try {
            return await this.db.$queryRaw`${query}`;
        } catch (error) {
            console.error('Database query error:', error);
            throw new Error('Failed to execute database query');
        }
    }

    /**
     * Execute API call
     */
    private async executeApiCall(endpoint?: string, parameters?: Record<string, any>): Promise<any> {
        if (!endpoint) {
            return null;
        }

        try {
            const url = new URL(endpoint);
            if (parameters) {
                Object.entries(parameters).forEach(([key, value]) => {
                    url.searchParams.append(key, String(value));
                });
            }

            const response = await fetch(url.toString());
            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            throw new Error('Failed to execute API call');
        }
    }

    /**
     * Execute custom data source
     */
    private async executeCustomDataSource(query?: string, parameters?: Record<string, any>): Promise<any> {
        // This would be implemented based on specific custom data source requirements
        return null;
    }

    // Permission helper methods
    private canViewDashboard(dashboard: Dashboard, userId: string): boolean {
        return dashboard.isPublic ||
            dashboard.createdBy === userId ||
            dashboard.permissions.view.includes(userId) ||
            dashboard.permissions.view.includes('*');
    }

    private canEditDashboard(dashboard: Dashboard, userId: string): boolean {
        return dashboard.createdBy === userId ||
            dashboard.permissions.edit.includes(userId) ||
            dashboard.permissions.edit.includes('*');
    }

    private canDeleteDashboard(dashboard: Dashboard, userId: string): boolean {
        return dashboard.createdBy === userId ||
            dashboard.permissions.delete.includes(userId) ||
            dashboard.permissions.delete.includes('*');
    }
}

// Export types
export type ValidatedDashboard = z.infer<typeof DashboardSchema>;
export type ValidatedDashboardWidget = z.infer<typeof DashboardWidgetSchema>;
export type ValidatedWidgetConfiguration = z.infer<typeof WidgetConfigurationSchema>;