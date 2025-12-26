// Organization Analytics Package
// Comprehensive analytics and reporting system for organizations

export { OrganizationAnalyticsService } from './organization-analytics';
export { DashboardBuilderService } from './dashboard-builder';
export { AdvancedReportingEngineService } from './reporting-engine';
export { DataExportService } from './data-export';
export { PredictiveAnalyticsService } from './predictive-analytics';

export type {
    UsageAnalytics,
    TeamPerformanceMetrics,
    CollaborationInsights,
    CostAnalysis,
    OptimizationRecommendation,
    PredictiveAnalytics,
    OrganizationAnalyticsDashboard,
    AnalyticsRequest,
    AnalyticsEvent,
    ValidatedAnalyticsEvent,
    ValidatedOptimizationRecommendation,
} from './types';

export type {
    Dashboard,
    DashboardWidget,
    WidgetConfiguration,
    DataSourceConfig,
    DashboardLayout,
    ValidatedDashboard,
    ValidatedDashboardWidget,
    ValidatedWidgetConfiguration,
} from './dashboard-builder';

export type {
    ReportDefinition,
    ReportQuery,
    ReportVisualization,
    ReportExecution,
    ReportResult,
    ValidatedReportDefinition,
    ValidatedReportQuery,
    VisualQueryBuilder,
    QueryBuilderConfig,
    ReportScheduler,
    ScheduleConfig,
    DistributionConfig,
    ReportShare,
    ShareSettings,
    ExportFormatConfig,
} from './reporting-engine';

export type {
    ExportRequest,
    ExportConfiguration,
    ExportResult,
    VisualizationExport,
    ValidatedExportRequest,
    ValidatedExportConfiguration,
} from './data-export';

export type {
    PredictiveModel,
    ModelConfiguration,
    FeatureDefinition,
    PredictionRequest,
    PredictionResult,
    MLInsight,
    ValidatedPredictiveModel,
    ValidatedFeatureDefinition,
    ValidatedModelConfiguration,
} from './predictive-analytics';

export {
    TimeRangeSchema,
    AnalyticsRequestSchema,
    OptimizationRecommendationSchema,
    AnalyticsEventSchema,
} from './types';

export {
    DashboardSchema,
    DashboardWidgetSchema,
    WidgetConfigurationSchema,
} from './dashboard-builder';

export {
    ReportDefinitionSchema,
    ReportQuerySchema,
} from './reporting-engine';

export {
    ExportRequestSchema,
    ExportConfigurationSchema,
} from './data-export';

export {
    PredictiveModelSchema,
    FeatureDefinitionSchema,
    ModelConfigurationSchema,
} from './predictive-analytics';