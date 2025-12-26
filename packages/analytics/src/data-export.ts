import { z } from 'zod';

// ============================================================================
// DATA EXPORT TYPES
// ============================================================================

export interface ExportRequest {
    id: string;
    organizationId: string;
    requestedBy: string;
    type: 'dashboard' | 'report' | 'analytics' | 'custom';
    format: 'csv' | 'excel' | 'pdf' | 'json' | 'xml';
    source: ExportSource;
    configuration: ExportConfiguration;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number; // 0-100
    result?: ExportResult;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

export interface ExportSource {
    type: 'dashboard' | 'report' | 'query' | 'data';
    id?: string; // dashboard/report ID
    query?: string; // SQL query or analytics function
    data?: any[]; // Direct data array
    parameters?: Record<string, any>;
}

export interface ExportConfiguration {
    filename?: string;
    includeHeaders?: boolean;
    dateFormat?: string;
    numberFormat?: string;
    encoding?: 'utf-8' | 'latin1' | 'ascii';
    compression?: 'none' | 'gzip' | 'zip';
    pagination?: PaginationConfig;
    filtering?: FilterConfig[];
    sorting?: SortConfig[];
    styling?: ExportStyling;
    metadata?: boolean;
}

export interface PaginationConfig {
    enabled: boolean;
    pageSize?: number;
    maxPages?: number;
}

export interface FilterConfig {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value?: any;
}

export interface SortConfig {
    field: string;
    direction: 'asc' | 'desc';
}

export interface ExportStyling {
    theme?: 'light' | 'dark' | 'corporate';
    colors?: string[];
    fonts?: FontStyling;
    layout?: LayoutStyling;
    branding?: BrandingStyling;
}

export interface FontStyling {
    family?: string;
    size?: number;
    headerSize?: number;
    color?: string;
    headerColor?: string;
}

export interface LayoutStyling {
    orientation?: 'portrait' | 'landscape';
    margins?: MarginConfig;
    spacing?: number;
    borders?: boolean;
    gridLines?: boolean;
}

export interface MarginConfig {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

export interface BrandingStyling {
    logo?: string; // URL or base64
    companyName?: string;
    headerText?: string;
    footerText?: string;
    watermark?: string;
}

export interface ExportResult {
    url: string;
    filename: string;
    size: number; // in bytes
    format: string;
    downloadCount: number;
    expiresAt?: Date;
    metadata?: ExportMetadata;
}

export interface ExportMetadata {
    totalRows: number;
    totalColumns: number;
    generatedAt: Date;
    processingTime: number; // in milliseconds
    dataSource: string;
    filters?: FilterConfig[];
    sorting?: SortConfig[];
}

export interface VisualizationExport {
    type: 'chart' | 'table' | 'pivot' | 'dashboard';
    format: 'png' | 'svg' | 'pdf' | 'html';
    configuration: VisualizationConfig;
    data: any[];
    styling?: VisualizationStyling;
}

export interface VisualizationConfig {
    width?: number;
    height?: number;
    dpi?: number;
    quality?: 'low' | 'medium' | 'high';
    interactive?: boolean;
    animations?: boolean;
}

export interface VisualizationStyling {
    theme?: 'light' | 'dark' | 'custom';
    colors?: string[];
    backgroundColor?: string;
    title?: TitleStyling;
    legend?: LegendStyling;
    axes?: AxesStyling;
}

export interface TitleStyling {
    text?: string;
    fontSize?: number;
    color?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface LegendStyling {
    show?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
    fontSize?: number;
    color?: string;
}

export interface AxesStyling {
    showX?: boolean;
    showY?: boolean;
    labelColor?: string;
    gridColor?: string;
    fontSize?: number;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const ExportConfigurationSchema = z.object({
    filename: z.string().optional(),
    includeHeaders: z.boolean().default(true),
    dateFormat: z.string().default('YYYY-MM-DD'),
    numberFormat: z.string().default('#,##0.00'),
    encoding: z.enum(['utf-8', 'latin1', 'ascii']).default('utf-8'),
    compression: z.enum(['none', 'gzip', 'zip']).default('none'),
    pagination: z.object({
        enabled: z.boolean(),
        pageSize: z.number().optional(),
        maxPages: z.number().optional(),
    }).optional(),
    filtering: z.array(z.object({
        field: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
        value: z.any(),
    })).optional(),
    sorting: z.array(z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']),
    })).optional(),
    styling: z.object({
        theme: z.enum(['light', 'dark', 'corporate']).optional(),
        colors: z.array(z.string()).optional(),
        fonts: z.object({
            family: z.string().optional(),
            size: z.number().optional(),
            headerSize: z.number().optional(),
            color: z.string().optional(),
            headerColor: z.string().optional(),
        }).optional(),
        layout: z.object({
            orientation: z.enum(['portrait', 'landscape']).optional(),
            margins: z.object({
                top: z.number().optional(),
                right: z.number().optional(),
                bottom: z.number().optional(),
                left: z.number().optional(),
            }).optional(),
            spacing: z.number().optional(),
            borders: z.boolean().optional(),
            gridLines: z.boolean().optional(),
        }).optional(),
        branding: z.object({
            logo: z.string().optional(),
            companyName: z.string().optional(),
            headerText: z.string().optional(),
            footerText: z.string().optional(),
            watermark: z.string().optional(),
        }).optional(),
    }).optional(),
    metadata: z.boolean().default(false),
});

export const ExportRequestSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    requestedBy: z.string(),
    type: z.enum(['dashboard', 'report', 'analytics', 'custom']),
    format: z.enum(['csv', 'excel', 'pdf', 'json', 'xml']),
    source: z.object({
        type: z.enum(['dashboard', 'report', 'query', 'data']),
        id: z.string().optional(),
        query: z.string().optional(),
        data: z.array(z.any()).optional(),
        parameters: z.record(z.any()).optional(),
    }),
    configuration: ExportConfigurationSchema,
    status: z.enum(['pending', 'processing', 'completed', 'failed']),
    progress: z.number().min(0).max(100).optional(),
    result: z.object({
        url: z.string(),
        filename: z.string(),
        size: z.number(),
        format: z.string(),
        downloadCount: z.number(),
        expiresAt: z.date().optional(),
        metadata: z.object({
            totalRows: z.number(),
            totalColumns: z.number(),
            generatedAt: z.date(),
            processingTime: z.number(),
            dataSource: z.string(),
            filters: z.array(z.object({
                field: z.string(),
                operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
                value: z.any(),
            })).optional(),
            sorting: z.array(z.object({
                field: z.string(),
                direction: z.enum(['asc', 'desc']),
            })).optional(),
        }).optional(),
    }).optional(),
    error: z.string().optional(),
    createdAt: z.date(),
    completedAt: z.date().optional(),
});

// ============================================================================
// DATA EXPORT SERVICE
// ============================================================================

export class DataExportService {
    constructor(
        private db: any,
        private storageService: any,
        private analyticsService: any,
        private reportingService: any
    ) { }

    /**
     * Create export request
     */
    async createExportRequest(
        organizationId: string,
        userId: string,
        exportData: Omit<ExportRequest, 'id' | 'status' | 'createdAt'>
    ): Promise<ExportRequest> {
        const request: ExportRequest = {
            id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            createdAt: new Date(),
            ...exportData,
        };

        const validatedRequest = ExportRequestSchema.parse(request);

        // Store request in database
        await this.db.exportRequest.create({
            data: {
                id: validatedRequest.id,
                organizationId: validatedRequest.organizationId,
                requestedBy: validatedRequest.requestedBy,
                type: validatedRequest.type,
                format: validatedRequest.format,
                source: JSON.stringify(validatedRequest.source),
                configuration: JSON.stringify(validatedRequest.configuration),
                status: validatedRequest.status,
                progress: validatedRequest.progress,
                createdAt: validatedRequest.createdAt,
            },
        });

        // Process export asynchronously
        this.processExportAsync(validatedRequest).catch(error => {
            console.error('Export processing failed:', error);
        });

        return validatedRequest;
    }

    /**
     * Process export asynchronously
     */
    private async processExportAsync(request: ExportRequest): Promise<void> {
        const startTime = Date.now();

        try {
            // Update status to processing
            await this.updateExportStatus(request.id, 'processing', 0);

            // Get data from source
            const data = await this.getDataFromSource(request.source, request.organizationId);
            await this.updateExportStatus(request.id, 'processing', 25);

            // Apply filtering and sorting
            const processedData = await this.processData(data, request.configuration);
            await this.updateExportStatus(request.id, 'processing', 50);

            // Generate export file
            const exportFile = await this.generateExportFile(
                processedData,
                request.format,
                request.configuration
            );
            await this.updateExportStatus(request.id, 'processing', 75);

            // Upload to storage
            const fileUrl = await this.storageService.uploadFile(
                exportFile.buffer,
                exportFile.filename,
                {
                    contentType: exportFile.contentType,
                    organizationId: request.organizationId,
                    category: 'exports',
                }
            );
            await this.updateExportStatus(request.id, 'processing', 90);

            const processingTime = Date.now() - startTime;

            // Update request with result
            const result: ExportResult = {
                url: fileUrl,
                filename: exportFile.filename,
                size: exportFile.buffer.length,
                format: request.format,
                downloadCount: 0,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                metadata: {
                    totalRows: processedData.length,
                    totalColumns: processedData.length > 0 ? Object.keys(processedData[0]).length : 0,
                    generatedAt: new Date(),
                    processingTime,
                    dataSource: request.source.type,
                    filters: request.configuration.filtering,
                    sorting: request.configuration.sorting,
                },
            };

            await this.db.exportRequest.update({
                where: { id: request.id },
                data: {
                    status: 'completed',
                    progress: 100,
                    result: JSON.stringify(result),
                    completedAt: new Date(),
                },
            });

        } catch (error) {
            await this.db.exportRequest.update({
                where: { id: request.id },
                data: {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    completedAt: new Date(),
                },
            });
        }
    }

    /**
     * Get data from source
     */
    private async getDataFromSource(source: ExportSource, organizationId: string): Promise<any[]> {
        switch (source.type) {
            case 'dashboard':
                return this.getDashboardData(source.id!, organizationId, source.parameters);

            case 'report':
                return this.getReportData(source.id!, organizationId, source.parameters);

            case 'query':
                return this.getQueryData(source.query!, organizationId, source.parameters);

            case 'data':
                return source.data || [];

            default:
                throw new Error(`Unsupported source type: ${source.type}`);
        }
    }

    /**
     * Get dashboard data
     */
    private async getDashboardData(
        dashboardId: string,
        organizationId: string,
        parameters?: Record<string, any>
    ): Promise<any[]> {
        // Get dashboard widgets and aggregate their data
        const dashboard = await this.db.dashboard.findUnique({
            where: { id: dashboardId, organizationId },
        });

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        const widgets = JSON.parse(dashboard.widgets);
        const allData: any[] = [];

        for (const widget of widgets) {
            if (widget.dataSource) {
                try {
                    const widgetData = await this.getWidgetData(widget, organizationId, parameters);
                    if (Array.isArray(widgetData)) {
                        allData.push(...widgetData);
                    } else {
                        allData.push(widgetData);
                    }
                } catch (error) {
                    console.error(`Failed to get data for widget ${widget.id}:`, error);
                }
            }
        }

        return allData;
    }

    /**
     * Get report data
     */
    private async getReportData(
        reportId: string,
        organizationId: string,
        parameters?: Record<string, any>
    ): Promise<any[]> {
        // Execute report and return data
        const execution = await this.reportingService.executeReport(reportId, 'system', parameters);

        // Wait for completion (simplified - in real implementation, use polling or events)
        let attempts = 0;
        while (execution.status === 'pending' || execution.status === 'running') {
            if (attempts > 30) { // 30 seconds timeout
                throw new Error('Report execution timeout');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        if (execution.status === 'failed') {
            throw new Error(`Report execution failed: ${execution.error}`);
        }

        return execution.result?.data || [];
    }

    /**
     * Get query data
     */
    private async getQueryData(
        query: string,
        organizationId: string,
        parameters?: Record<string, any>
    ): Promise<any[]> {
        // Execute analytics query
        if (query.startsWith('analytics:')) {
            const analyticsFunction = query.replace('analytics:', '');
            return this.executeAnalyticsFunction(analyticsFunction, organizationId, parameters);
        }

        // Execute SQL query (with security restrictions)
        return this.executeSafeQuery(query, organizationId, parameters);
    }

    /**
     * Execute analytics function
     */
    private async executeAnalyticsFunction(
        functionName: string,
        organizationId: string,
        parameters?: Record<string, any>
    ): Promise<any[]> {
        switch (functionName) {
            case 'usage_analytics':
                const usageData = await this.analyticsService.generateUsageAnalytics(
                    organizationId,
                    parameters?.timeRange
                );
                return [usageData];

            case 'team_performance':
                const teamData = await this.analyticsService.generateTeamPerformanceMetrics(
                    organizationId,
                    parameters?.timeRange
                );
                return teamData.teams;

            default:
                throw new Error(`Unknown analytics function: ${functionName}`);
        }
    }

    /**
     * Execute safe query
     */
    private async executeSafeQuery(
        query: string,
        organizationId: string,
        parameters?: Record<string, any>
    ): Promise<any[]> {
        // Security: Only allow predefined safe queries
        const allowedQueries = [
            'SELECT * FROM documents WHERE organization_id = $organizationId',
            'SELECT * FROM users WHERE organization_id = $organizationId',
            'SELECT * FROM signing_requests WHERE organization_id = $organizationId',
        ];

        if (!allowedQueries.some(allowed => query.startsWith(allowed.split(' WHERE')[0]))) {
            throw new Error('Query not allowed for security reasons');
        }

        // Replace parameters
        let processedQuery = query;
        if (parameters) {
            Object.entries(parameters).forEach(([key, value]) => {
                processedQuery = processedQuery.replace(`$${key}`, String(value));
            });
        }

        // Ensure organization filter
        if (!processedQuery.includes('organization_id')) {
            throw new Error('Query must include organization_id filter');
        }

        return await this.db.$queryRaw`${processedQuery}`;
    }

    /**
     * Process data with filtering and sorting
     */
    private async processData(data: any[], configuration: ExportConfiguration): Promise<any[]> {
        let processedData = [...data];

        // Apply filtering
        if (configuration.filtering && configuration.filtering.length > 0) {
            processedData = processedData.filter(row => {
                return configuration.filtering!.every(filter => {
                    const value = row[filter.field];
                    return this.applyFilter(value, filter.operator, filter.value);
                });
            });
        }

        // Apply sorting
        if (configuration.sorting && configuration.sorting.length > 0) {
            processedData.sort((a, b) => {
                for (const sort of configuration.sorting!) {
                    const aValue = a[sort.field];
                    const bValue = b[sort.field];

                    let comparison = 0;
                    if (aValue < bValue) comparison = -1;
                    else if (aValue > bValue) comparison = 1;

                    if (comparison !== 0) {
                        return sort.direction === 'desc' ? -comparison : comparison;
                    }
                }
                return 0;
            });
        }

        // Apply pagination
        if (configuration.pagination?.enabled) {
            const pageSize = configuration.pagination.pageSize || 1000;
            const maxPages = configuration.pagination.maxPages || 10;
            const maxRows = pageSize * maxPages;

            if (processedData.length > maxRows) {
                processedData = processedData.slice(0, maxRows);
            }
        }

        return processedData;
    }

    /**
     * Apply filter to value
     */
    private applyFilter(value: any, operator: string, filterValue: any): boolean {
        switch (operator) {
            case 'eq': return value === filterValue;
            case 'ne': return value !== filterValue;
            case 'gt': return value > filterValue;
            case 'gte': return value >= filterValue;
            case 'lt': return value < filterValue;
            case 'lte': return value <= filterValue;
            case 'in': return Array.isArray(filterValue) && filterValue.includes(value);
            case 'contains': return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            default: return true;
        }
    }

    /**
     * Generate export file
     */
    private async generateExportFile(
        data: any[],
        format: string,
        configuration: ExportConfiguration
    ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseFilename = configuration.filename || `export-${timestamp}`;

        switch (format) {
            case 'csv':
                return this.generateCsvFile(data, baseFilename, configuration);

            case 'excel':
                return this.generateExcelFile(data, baseFilename, configuration);

            case 'pdf':
                return this.generatePdfFile(data, baseFilename, configuration);

            case 'json':
                return this.generateJsonFile(data, baseFilename, configuration);

            case 'xml':
                return this.generateXmlFile(data, baseFilename, configuration);

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Generate CSV file
     */
    private async generateCsvFile(
        data: any[],
        filename: string,
        configuration: ExportConfiguration
    ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
        if (data.length === 0) {
            return {
                buffer: Buffer.from(''),
                filename: `${filename}.csv`,
                contentType: 'text/csv',
            };
        }

        const headers = Object.keys(data[0]);
        let csv = '';

        // Add headers
        if (configuration.includeHeaders) {
            csv += headers.join(',') + '\n';
        }

        // Add data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '';

                // Format dates
                if (value instanceof Date) {
                    return value.toISOString().split('T')[0];
                }

                // Format numbers
                if (typeof value === 'number') {
                    return value.toString();
                }

                // Escape CSV values
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }

                return stringValue;
            });
            csv += values.join(',') + '\n';
        }

        return {
            buffer: Buffer.from(csv, configuration.encoding || 'utf-8'),
            filename: `${filename}.csv`,
            contentType: 'text/csv',
        };
    }

    /**
     * Generate Excel file
     */
    private async generateExcelFile(
        data: any[],
        filename: string,
        configuration: ExportConfiguration
    ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
        // This would use a library like ExcelJS to generate Excel files
        // Simplified implementation returns CSV for now
        const csvFile = await this.generateCsvFile(data, filename, configuration);
        return {
            ...csvFile,
            filename: `${filename}.xlsx`,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }

    /**
     * Generate PDF file
     */
    private async generatePdfFile(
        data: any[],
        filename: string,
        configuration: ExportConfiguration
    ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
        // This would use a library like PDFKit or Puppeteer to generate PDFs
        // Simplified implementation
        const content = JSON.stringify(data, null, 2);
        return {
            buffer: Buffer.from(content),
            filename: `${filename}.pdf`,
            contentType: 'application/pdf',
        };
    }

    /**
     * Generate JSON file
     */
    private async generateJsonFile(
        data: any[],
        filename: string,
        configuration: ExportConfiguration
    ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
        const jsonContent = JSON.stringify(data, null, 2);
        return {
            buffer: Buffer.from(jsonContent, configuration.encoding || 'utf-8'),
            filename: `${filename}.json`,
            contentType: 'application/json',
        };
    }

    /**
     * Generate XML file
     */
    private async generateXmlFile(
        data: any[],
        filename: string,
        configuration: ExportConfiguration
    ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
        // Simple XML generation
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';

        for (const item of data) {
            xml += '  <item>\n';
            for (const [key, value] of Object.entries(item)) {
                xml += `    <${key}>${this.escapeXml(String(value))}</${key}>\n`;
            }
            xml += '  </item>\n';
        }

        xml += '</data>';

        return {
            buffer: Buffer.from(xml, configuration.encoding || 'utf-8'),
            filename: `${filename}.xml`,
            contentType: 'application/xml',
        };
    }

    /**
     * Escape XML special characters
     */
    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Get widget data
     */
    private async getWidgetData(
        widget: any,
        organizationId: string,
        parameters?: Record<string, any>
    ): Promise<any> {
        // This would integrate with the dashboard builder service
        // Simplified implementation
        return [];
    }

    /**
     * Update export status
     */
    private async updateExportStatus(
        exportId: string,
        status: string,
        progress?: number
    ): Promise<void> {
        await this.db.exportRequest.update({
            where: { id: exportId },
            data: {
                status,
                progress,
            },
        });
    }

    /**
     * Get export request
     */
    async getExportRequest(exportId: string): Promise<ExportRequest | null> {
        const exportData = await this.db.exportRequest.findUnique({
            where: { id: exportId },
        });

        if (!exportData) return null;

        return {
            id: exportData.id,
            organizationId: exportData.organizationId,
            requestedBy: exportData.requestedBy,
            type: exportData.type,
            format: exportData.format,
            source: JSON.parse(exportData.source),
            configuration: JSON.parse(exportData.configuration),
            status: exportData.status,
            progress: exportData.progress,
            result: exportData.result ? JSON.parse(exportData.result) : undefined,
            error: exportData.error,
            createdAt: exportData.createdAt,
            completedAt: exportData.completedAt,
        };
    }

    /**
     * List export requests for organization
     */
    async listExportRequests(
        organizationId: string,
        options?: {
            status?: string;
            type?: string;
            limit?: number;
            offset?: number;
        }
    ): Promise<ExportRequest[]> {
        const where: any = { organizationId };

        if (options?.status) where.status = options.status;
        if (options?.type) where.type = options.type;

        const exports = await this.db.exportRequest.findMany({
            where,
            take: options?.limit || 50,
            skip: options?.offset || 0,
            orderBy: { createdAt: 'desc' },
        });

        return exports.map((exportData: any) => ({
            id: exportData.id,
            organizationId: exportData.organizationId,
            requestedBy: exportData.requestedBy,
            type: exportData.type,
            format: exportData.format,
            source: JSON.parse(exportData.source),
            configuration: JSON.parse(exportData.configuration),
            status: exportData.status,
            progress: exportData.progress,
            result: exportData.result ? JSON.parse(exportData.result) : undefined,
            error: exportData.error,
            createdAt: exportData.createdAt,
            completedAt: exportData.completedAt,
        }));
    }
}

// Export types
export type ValidatedExportRequest = z.infer<typeof ExportRequestSchema>;
export type ValidatedExportConfiguration = z.infer<typeof ExportConfigurationSchema>;