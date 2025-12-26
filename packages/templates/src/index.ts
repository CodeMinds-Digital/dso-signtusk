// Main exports
export { TemplateService } from './template-service';
export { TemplateWizard } from './template-wizard';
export { WorkflowEngine } from './workflow-engine';
export { WorkflowStateManager } from './workflow-state-manager';
export { WorkflowDebugger } from './workflow-debugger';
export { AdvancedWorkflowEngine } from './advanced-workflow-engine';
export { WorkflowOptimizationService } from './workflow-optimization-service';
export { EnhancedTemplateSharingService } from './enhanced-sharing-service';
export { TemplatePermissionManager } from './permission-manager';
export { TemplateAnalyticsService } from './template-analytics-service';
export { TemplatePerformanceService } from './template-performance-service';
export { TemplatePerformanceMonitor } from './template-performance-monitor';
export { EnterpriseTemplateManager } from './enterprise-template-manager';
export { TemplateLibraryService } from './template-library-service';
export { TemplateInstantiationEngine } from './template-instantiation-engine';
export { TemplateCollaborationService } from './template-collaboration-service';
export { TemplateImportExportService } from './template-import-export-service';
export type {
    TemplateUsageMetrics,
    TemplatePerformanceMetrics,
    TemplateROIAnalysis,
    TemplateComplianceMetrics,
} from './template-analytics-service';
export type {
    TemplatePerformanceConfig,
    PerformanceRecommendation,
    UsagePattern,
    CacheStats,
} from './template-performance-service';

export type {
    TemplateSearch,
    TemplateRating,
    TemplateComparison,
    TemplateLibraryItem,
    TemplateReview,
    TemplateComparisonResult,
} from './template-library-service';

export type {
    BulkTemplateOperation,
    BulkOperationResult,
    TemplateVersion,
    TemplateChangeRecord,
    GovernancePolicy,
    GovernanceRule,
    ComplianceAuditResult,
    ComplianceViolation,
    ComplianceRecommendation,
} from './enterprise-template-manager';

export type {
    TemplateVariable,
    FieldMapping,
    RecipientMapping,
    TemplateInstantiationData,
    TemplateInstantiationResult,
    TemplateInstantiationValidation,
    VariableContext,
} from './template-instantiation-engine';

export type {
    TemplateComment,
    TemplateReviewRequest,
    TemplateCollaborator,
    TemplateVersionCreate,
    TemplateCollaborationResult,
    TemplateEditSession,
    TemplateChangeNotification,
} from './template-collaboration-service';

export type {
    TemplateExportFormat,
    TemplateExportOptions,
    TemplateImportOptions,
    BulkExportOptions,
    MigrationOptions,
    TemplateExportResult,
    TemplateImportResult,
    MigrationResult,
    BackupResult,
} from './template-import-export-service';

// Type exports
export type {
    TemplateField,
    TemplateRecipient,
    WorkflowConfig,
    TemplateCreate,
    TemplateUpdate,
    TemplateShare,
    RecipientRoleDefinition,
    TemplateWizardStep,
    TemplateWizardState,
    TemplateAnalytics,
    TemplateValidationResult,
    TemplatePermissions,
    TemplateWithPermissions,
} from './types';

export type {
    WorkflowStep,
    WorkflowCondition,
    WorkflowExecution,
    StepExecution,
    WorkflowAuditEntry,
} from './workflow-engine';

export type {
    WorkflowState,
    StepState,
    StateTransition,
    TransitionTrigger,
    WorkflowStateMetadata,
    StepStateMetadata,
    PerformanceMetrics,
    DebugInfo,
    StepDebugInfo,
    ConditionEvaluation,
    VariableChange,
    SystemEvent,
    RecipientAction,
    SystemAction,
    DataChange,
    StepError,
    WorkflowStatus,
    StepStatus,
    StateTransitionRule,
    TransitionCondition,
    TransitionAction,
    PerformanceAnalysis,
    TroubleshootingTip,
} from './workflow-state-manager';

export type {
    DebugSession,
    DebugEvent,
    Breakpoint,
    BreakpointAction,
    WatchedVariable,
    VariableAlert,
    StepTrace,
    PerformanceProfile,
    MemoryUsageProfile,
    ResourceUtilization,
    PerformanceBottleneck,
    OptimizationSuggestion,
    DetectedIssue,
    IssueFix,
    DebugLevel,
    DebugEventType,
    IssueType,
    TroubleshootingReport,
    StepAnalysis,
    IssueDetector,
} from './workflow-debugger';

export type {
    ConditionalRule,
    LogicalCondition,
    WorkflowAction,
    ApprovalProcess,
    ApprovalStep,
    ApproverDefinition,
    EscalationRule,
    EscalationTrigger,
    EscalationAction,
    ApprovalSettings,
    ReminderConfig,
    ReminderTrigger,
    ReminderAction,
    ReminderSchedule,
    WorkflowAnalytics,
} from './advanced-workflow-engine';

export type {
    OptimizationRecommendation,
    WorkflowOptimizationReport,
    WorkflowPerformanceMetrics,
    BenchmarkComparison,
    AutoOptimizationConfig,
} from './workflow-optimization-service';

// Schema exports for validation
export {
    TemplateFieldSchema,
    TemplateRecipientSchema,
    WorkflowConfigSchema,
    TemplateCreateSchema,
    TemplateUpdateSchema,
    TemplateShareSchema,
    RecipientRoleDefinitionSchema,
} from './types';

export {
    TemplateSearchSchema,
    TemplateRatingSchema,
    TemplateComparisonSchema,
} from './template-library-service';

export {
    TemplateVariableSchema,
    FieldMappingSchema,
    RecipientMappingSchema,
    TemplateInstantiationDataSchema,
} from './template-instantiation-engine';

export {
    TemplateCommentSchema,
    TemplateReviewRequestSchema,
    TemplateCollaboratorSchema,
    TemplateVersionCreateSchema,
} from './template-collaboration-service';

export {
    TemplateExportFormatSchema,
    TemplateExportOptionsSchema,
    TemplateImportOptionsSchema,
    BulkExportOptionsSchema,
    MigrationOptionsSchema,
} from './template-import-export-service';