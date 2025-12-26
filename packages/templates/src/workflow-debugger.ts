import { pino } from 'pino';
import { PrismaClient } from '@signtusk/database';
import { WorkflowStateManager, WorkflowState, StepState, StateTransition, PerformanceAnalysis, TroubleshootingTip } from './workflow-state-manager';

const logger = pino({ name: 'workflow-debugger' });

// Debugging and troubleshooting types
export interface DebugSession {
    id: string;
    executionId: string;
    startedAt: Date;
    endedAt?: Date;
    debugLevel: DebugLevel;
    capturedEvents: DebugEvent[];
    breakpoints: Breakpoint[];
    watchedVariables: WatchedVariable[];
    stepTrace: StepTrace[];
    performanceProfile: PerformanceProfile;
    issues: DetectedIssue[];
}

export interface DebugEvent {
    id: string;
    timestamp: Date;
    type: DebugEventType;
    source: string;
    message: string;
    data: Record<string, any>;
    severity: 'debug' | 'info' | 'warning' | 'error';
    stackTrace?: string;
}

export interface Breakpoint {
    id: string;
    type: 'step_entry' | 'step_exit' | 'condition' | 'error' | 'custom';
    target: string; // step ID, condition expression, etc.
    condition?: string;
    isActive: boolean;
    hitCount: number;
    actions: BreakpointAction[];
}

export interface BreakpointAction {
    type: 'log' | 'capture_state' | 'notify' | 'pause_execution';
    parameters: Record<string, any>;
}

export interface WatchedVariable {
    name: string;
    path: string; // dot notation path in context
    currentValue: any;
    previousValue: any;
    changeHistory: VariableChange[];
    alerts: VariableAlert[];
}

export interface VariableChange {
    timestamp: Date;
    oldValue: any;
    newValue: any;
    source: string;
    reason: string;
}

export interface VariableAlert {
    condition: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    isActive: boolean;
}

export interface StepTrace {
    stepId: string;
    enteredAt: Date;
    exitedAt?: Date;
    status: string;
    inputData: Record<string, any>;
    outputData: Record<string, any>;
    executionTime: number; // milliseconds
    memoryUsage?: number; // bytes
    errors: string[];
    warnings: string[];
    childTraces: StepTrace[];
}

export interface PerformanceProfile {
    totalExecutionTime: number;
    stepExecutionTimes: Map<string, number>;
    memoryUsage: MemoryUsageProfile;
    resourceUtilization: ResourceUtilization;
    bottlenecks: PerformanceBottleneck[];
    optimizationSuggestions: OptimizationSuggestion[];
}

export interface MemoryUsageProfile {
    peak: number;
    average: number;
    timeline: Array<{
        timestamp: Date;
        usage: number;
    }>;
}

export interface ResourceUtilization {
    cpu: number; // percentage
    memory: number; // percentage
    io: number; // operations per second
    network: number; // bytes per second
}

export interface PerformanceBottleneck {
    type: 'step_execution' | 'condition_evaluation' | 'data_access' | 'network_io';
    location: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    duration: number; // milliseconds
    description: string;
    suggestion: string;
}

export interface OptimizationSuggestion {
    category: 'performance' | 'reliability' | 'maintainability';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    implementation: string;
    estimatedImpact: string;
}

export interface DetectedIssue {
    id: string;
    type: IssueType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    location: string;
    detectedAt: Date;
    suggestedFixes: IssueFix[];
    relatedEvents: string[]; // debug event IDs
}

export interface IssueFix {
    title: string;
    description: string;
    automated: boolean;
    implementation?: () => Promise<void>;
}

export type DebugLevel = 'minimal' | 'standard' | 'verbose' | 'trace';
export type DebugEventType = 'state_change' | 'step_execution' | 'condition_evaluation' | 'error' | 'warning' | 'performance' | 'user_action';
export type IssueType = 'infinite_loop' | 'deadlock' | 'performance_degradation' | 'memory_leak' | 'configuration_error' | 'data_inconsistency';

export class WorkflowDebugger {
    private activeSessions: Map<string, DebugSession> = new Map();
    private globalBreakpoints: Map<string, Breakpoint> = new Map();
    private issueDetectors: IssueDetector[] = [];

    constructor(
        private db: PrismaClient,
        private stateManager: WorkflowStateManager
    ) {
        this.initializeIssueDetectors();
    }

    /**
     * Start debugging session
     */
    async startDebugSession(
        executionId: string,
        debugLevel: DebugLevel = 'standard'
    ): Promise<{ success: boolean; sessionId?: string; errors?: string[] }> {
        try {
            // Check if session already exists
            const existingSession = Array.from(this.activeSessions.values())
                .find(session => session.executionId === executionId && !session.endedAt);

            if (existingSession) {
                return {
                    success: false,
                    errors: ['Debug session already active for this execution'],
                };
            }

            // Create new debug session
            const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const session: DebugSession = {
                id: sessionId,
                executionId,
                startedAt: new Date(),
                debugLevel,
                capturedEvents: [],
                breakpoints: [],
                watchedVariables: [],
                stepTrace: [],
                performanceProfile: {
                    totalExecutionTime: 0,
                    stepExecutionTimes: new Map(),
                    memoryUsage: {
                        peak: 0,
                        average: 0,
                        timeline: [],
                    },
                    resourceUtilization: {
                        cpu: 0,
                        memory: 0,
                        io: 0,
                        network: 0,
                    },
                    bottlenecks: [],
                    optimizationSuggestions: [],
                },
                issues: [],
            };

            // Store session
            this.activeSessions.set(sessionId, session);

            // Enable debug mode in state manager
            this.stateManager.enableDebugMode();

            // Start monitoring
            await this.startMonitoring(session);

            logger.info({ sessionId, executionId, debugLevel }, 'Debug session started');

            return {
                success: true,
                sessionId,
            };
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to start debug session');
            return {
                success: false,
                errors: ['Failed to start debug session'],
            };
        }
    }

    /**
     * Stop debugging session
     */
    async stopDebugSession(sessionId: string): Promise<{ success: boolean; errors?: string[] }> {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                return {
                    success: false,
                    errors: ['Debug session not found'],
                };
            }

            if (session.endedAt) {
                return {
                    success: false,
                    errors: ['Debug session already ended'],
                };
            }

            // End session
            session.endedAt = new Date();
            session.performanceProfile.totalExecutionTime =
                session.endedAt.getTime() - session.startedAt.getTime();

            // Generate final analysis
            await this.generateFinalAnalysis(session);

            // Stop monitoring
            await this.stopMonitoring(session);

            // Disable debug mode if no other sessions active
            const activeSessions = Array.from(this.activeSessions.values())
                .filter(s => !s.endedAt);

            if (activeSessions.length === 0) {
                this.stateManager.disableDebugMode();
            }

            logger.info({ sessionId, duration: session.performanceProfile.totalExecutionTime }, 'Debug session ended');

            return { success: true };
        } catch (error) {
            logger.error({ error, sessionId }, 'Failed to stop debug session');
            return {
                success: false,
                errors: ['Failed to stop debug session'],
            };
        }
    }

    /**
     * Add breakpoint
     */
    async addBreakpoint(
        sessionId: string,
        type: Breakpoint['type'],
        target: string,
        condition?: string,
        actions: BreakpointAction[] = []
    ): Promise<{ success: boolean; breakpointId?: string; errors?: string[] }> {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                return {
                    success: false,
                    errors: ['Debug session not found'],
                };
            }

            const breakpointId = `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const breakpoint: Breakpoint = {
                id: breakpointId,
                type,
                target,
                condition,
                isActive: true,
                hitCount: 0,
                actions: actions.length > 0 ? actions : [
                    {
                        type: 'log',
                        parameters: { message: `Breakpoint hit: ${target}` },
                    },
                ],
            };

            session.breakpoints.push(breakpoint);

            logger.info({ sessionId, breakpointId, type, target }, 'Breakpoint added');

            return {
                success: true,
                breakpointId,
            };
        } catch (error) {
            logger.error({ error, sessionId }, 'Failed to add breakpoint');
            return {
                success: false,
                errors: ['Failed to add breakpoint'],
            };
        }
    }

    /**
     * Add watched variable
     */
    async addWatchedVariable(
        sessionId: string,
        name: string,
        path: string,
        alerts: VariableAlert[] = []
    ): Promise<{ success: boolean; errors?: string[] }> {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                return {
                    success: false,
                    errors: ['Debug session not found'],
                };
            }

            // Get current value
            const state = await this.stateManager.getState(session.executionId);
            const currentValue = this.getValueByPath(state?.context || {}, path);

            const watchedVariable: WatchedVariable = {
                name,
                path,
                currentValue,
                previousValue: undefined,
                changeHistory: [],
                alerts,
            };

            session.watchedVariables.push(watchedVariable);

            logger.info({ sessionId, name, path }, 'Watched variable added');

            return { success: true };
        } catch (error) {
            logger.error({ error, sessionId }, 'Failed to add watched variable');
            return {
                success: false,
                errors: ['Failed to add watched variable'],
            };
        }
    }

    /**
     * Get debug session status
     */
    async getDebugSession(sessionId: string): Promise<DebugSession | null> {
        return this.activeSessions.get(sessionId) || null;
    }

    /**
     * Get all active debug sessions
     */
    getActiveDebugSessions(): DebugSession[] {
        return Array.from(this.activeSessions.values()).filter(session => !session.endedAt);
    }

    /**
     * Analyze workflow performance
     */
    async analyzePerformance(executionId: string): Promise<{
        success: boolean;
        analysis?: PerformanceAnalysis;
        profile?: PerformanceProfile;
        errors?: string[];
    }> {
        try {
            // Get workflow state
            const state = await this.stateManager.getState(executionId);
            if (!state) {
                return {
                    success: false,
                    errors: ['Workflow state not found'],
                };
            }

            // Get debug session if active
            const session = Array.from(this.activeSessions.values())
                .find(s => s.executionId === executionId);

            // Analyze performance
            const analysis = this.performPerformanceAnalysis(state);
            const profile = session?.performanceProfile;

            return {
                success: true,
                analysis,
                profile,
            };
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to analyze performance');
            return {
                success: false,
                errors: ['Failed to analyze performance'],
            };
        }
    }

    /**
     * Generate troubleshooting report
     */
    async generateTroubleshootingReport(executionId: string): Promise<{
        success: boolean;
        report?: TroubleshootingReport;
        errors?: string[];
    }> {
        try {
            const state = await this.stateManager.getState(executionId);
            if (!state) {
                return {
                    success: false,
                    errors: ['Workflow state not found'],
                };
            }

            const session = Array.from(this.activeSessions.values())
                .find(s => s.executionId === executionId);

            const report: TroubleshootingReport = {
                executionId,
                generatedAt: new Date(),
                workflowStatus: state.status,
                summary: this.generateSummary(state, session),
                issues: session?.issues || [],
                performanceAnalysis: this.performPerformanceAnalysis(state),
                recommendations: this.generateRecommendations(state, session),
                debugEvents: session?.capturedEvents || [],
                stepAnalysis: this.analyzeSteps(state),
            };

            return {
                success: true,
                report,
            };
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to generate troubleshooting report');
            return {
                success: false,
                errors: ['Failed to generate troubleshooting report'],
            };
        }
    }

    // Private helper methods

    private async startMonitoring(session: DebugSession): Promise<void> {
        // Start performance monitoring
        this.startPerformanceMonitoring(session);

        // Start issue detection
        this.startIssueDetection(session);

        // Initialize step tracing
        await this.initializeStepTracing(session);
    }

    private async stopMonitoring(session: DebugSession): Promise<void> {
        // Stop all monitoring activities
        logger.debug({ sessionId: session.id }, 'Monitoring stopped');
    }

    private startPerformanceMonitoring(session: DebugSession): void {
        // Monitor memory usage
        const memoryInterval = setInterval(() => {
            if (session.endedAt) {
                clearInterval(memoryInterval);
                return;
            }

            const memoryUsage = process.memoryUsage().heapUsed;
            session.performanceProfile.memoryUsage.timeline.push({
                timestamp: new Date(),
                usage: memoryUsage,
            });

            if (memoryUsage > session.performanceProfile.memoryUsage.peak) {
                session.performanceProfile.memoryUsage.peak = memoryUsage;
            }
        }, 1000);
    }

    private startIssueDetection(session: DebugSession): void {
        // Run issue detectors periodically
        const detectionInterval = setInterval(async () => {
            if (session.endedAt) {
                clearInterval(detectionInterval);
                return;
            }

            for (const detector of this.issueDetectors) {
                try {
                    const issues = await detector.detect(session);
                    session.issues.push(...issues);
                } catch (error) {
                    logger.error({ error, detector: detector.name }, 'Issue detector failed');
                }
            }
        }, 5000);
    }

    private async initializeStepTracing(session: DebugSession): Promise<void> {
        // Initialize step tracing based on workflow definition
        const state = await this.stateManager.getState(session.executionId);
        if (state) {
            for (const [stepId, stepState] of state.stepStates) {
                const trace: StepTrace = {
                    stepId,
                    enteredAt: stepState.startedAt || new Date(),
                    status: stepState.status,
                    inputData: {},
                    outputData: stepState.results,
                    executionTime: 0,
                    errors: stepState.errors.map(e => e.message),
                    warnings: [],
                    childTraces: [],
                };

                if (stepState.startedAt && stepState.completedAt) {
                    trace.exitedAt = stepState.completedAt;
                    trace.executionTime = stepState.completedAt.getTime() - stepState.startedAt.getTime();
                }

                session.stepTrace.push(trace);
            }
        }
    }

    private async generateFinalAnalysis(session: DebugSession): Promise<void> {
        // Calculate average memory usage
        const memoryTimeline = session.performanceProfile.memoryUsage.timeline;
        if (memoryTimeline.length > 0) {
            const totalMemory = memoryTimeline.reduce((sum, point) => sum + point.usage, 0);
            session.performanceProfile.memoryUsage.average = totalMemory / memoryTimeline.length;
        }

        // Generate optimization suggestions
        session.performanceProfile.optimizationSuggestions = this.generateOptimizationSuggestions(session);

        // Identify bottlenecks
        session.performanceProfile.bottlenecks = this.identifyBottlenecks(session);
    }

    private performPerformanceAnalysis(state: WorkflowState): PerformanceAnalysis {
        const analysis: PerformanceAnalysis = {
            overallHealth: 'good',
            completionProgress: (state.metadata.completedSteps / state.metadata.totalSteps) * 100,
            estimatedTimeRemaining: 0,
            bottlenecks: [],
            recommendations: [],
        };

        // Analyze step performance
        for (const [stepId, stepState] of state.stepStates) {
            if (stepState.startedAt && stepState.completedAt) {
                const duration = stepState.completedAt.getTime() - stepState.startedAt.getTime();
                const estimatedDuration = stepState.metadata.estimatedDuration || 0;

                if (estimatedDuration > 0 && duration > estimatedDuration * 1.5) {
                    analysis.bottlenecks.push({
                        stepId,
                        issue: 'Execution time exceeded estimate',
                        impact: 'medium',
                        suggestion: 'Review step implementation for optimization opportunities',
                    });
                }
            }

            if (stepState.errors.length > 0) {
                analysis.overallHealth = 'warning';
                analysis.recommendations.push(`Address errors in step ${stepId}`);
            }
        }

        // Calculate estimated time remaining
        if (state.status === 'active') {
            const remainingSteps = state.metadata.totalSteps - state.metadata.completedSteps;
            const averageStepTime = state.metadata.performanceMetrics.averageStepDuration;
            analysis.estimatedTimeRemaining = remainingSteps * averageStepTime;
        }

        return analysis;
    }

    private generateSummary(state: WorkflowState, session?: DebugSession): string {
        const parts = [
            `Workflow Status: ${state.status}`,
            `Progress: ${state.metadata.completedSteps}/${state.metadata.totalSteps} steps completed`,
        ];

        if (state.metadata.failedSteps > 0) {
            parts.push(`Failed Steps: ${state.metadata.failedSteps}`);
        }

        if (session?.issues.length) {
            parts.push(`Issues Detected: ${session.issues.length}`);
        }

        return parts.join('. ');
    }

    private generateRecommendations(state: WorkflowState, session?: DebugSession): string[] {
        const recommendations: string[] = [];

        if (state.status === 'paused') {
            recommendations.push('Resume workflow execution to continue processing');
        }

        if (state.metadata.failedSteps > 0) {
            recommendations.push('Review and resolve failed steps before proceeding');
        }

        if (session?.performanceProfile.bottlenecks.length) {
            recommendations.push('Address performance bottlenecks to improve execution time');
        }

        if (state.metadata.performanceMetrics.efficiency < 80) {
            recommendations.push('Optimize workflow structure to improve efficiency');
        }

        return recommendations;
    }

    private analyzeSteps(state: WorkflowState): StepAnalysis[] {
        const analysis: StepAnalysis[] = [];

        for (const [stepId, stepState] of state.stepStates) {
            const stepAnalysis: StepAnalysis = {
                stepId,
                status: stepState.status,
                health: stepState.errors.length > 0 ? 'error' : 'good',
                executionTime: 0,
                issues: stepState.errors.map(e => e.message),
                recommendations: [],
            };

            if (stepState.startedAt && stepState.completedAt) {
                stepAnalysis.executionTime = stepState.completedAt.getTime() - stepState.startedAt.getTime();
            }

            if (stepState.status === 'failed') {
                stepAnalysis.recommendations.push('Review step configuration and error logs');
            }

            if (stepState.attempts > 1) {
                stepAnalysis.recommendations.push('Consider improving step reliability to reduce retries');
            }

            analysis.push(stepAnalysis);
        }

        return analysis;
    }

    private generateOptimizationSuggestions(session: DebugSession): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        // Memory optimization
        if (session.performanceProfile.memoryUsage.peak > 100 * 1024 * 1024) { // 100MB
            suggestions.push({
                category: 'performance',
                priority: 'medium',
                title: 'High Memory Usage',
                description: 'Workflow is using significant memory resources',
                implementation: 'Review data structures and consider streaming for large datasets',
                estimatedImpact: 'Reduced memory footprint by 20-40%',
            });
        }

        // Step optimization
        const longRunningSteps = session.stepTrace.filter(trace => trace.executionTime > 60000); // 1 minute
        if (longRunningSteps.length > 0) {
            suggestions.push({
                category: 'performance',
                priority: 'high',
                title: 'Long-Running Steps',
                description: 'Some steps are taking longer than expected',
                implementation: 'Break down complex steps or implement parallel processing',
                estimatedImpact: 'Reduced execution time by 30-50%',
            });
        }

        return suggestions;
    }

    private identifyBottlenecks(session: DebugSession): PerformanceBottleneck[] {
        const bottlenecks: PerformanceBottleneck[] = [];

        // Identify step execution bottlenecks
        for (const trace of session.stepTrace) {
            if (trace.executionTime > 30000) { // 30 seconds
                bottlenecks.push({
                    type: 'step_execution',
                    location: trace.stepId,
                    impact: trace.executionTime > 120000 ? 'critical' : 'high',
                    duration: trace.executionTime,
                    description: `Step ${trace.stepId} is taking ${Math.round(trace.executionTime / 1000)} seconds`,
                    suggestion: 'Optimize step implementation or break into smaller steps',
                });
            }
        }

        return bottlenecks;
    }

    private getValueByPath(obj: any, path: string): any {
        const parts = path.split('.');
        let value = obj;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return undefined;
            }
        }

        return value;
    }

    private initializeIssueDetectors(): void {
        // Initialize built-in issue detectors
        this.issueDetectors = [
            new InfiniteLoopDetector(),
            new DeadlockDetector(),
            new PerformanceDegradationDetector(),
            new MemoryLeakDetector(),
            new ConfigurationErrorDetector(),
        ];
    }
}

// Additional types
export interface TroubleshootingReport {
    executionId: string;
    generatedAt: Date;
    workflowStatus: string;
    summary: string;
    issues: DetectedIssue[];
    performanceAnalysis: PerformanceAnalysis;
    recommendations: string[];
    debugEvents: DebugEvent[];
    stepAnalysis: StepAnalysis[];
}

export interface StepAnalysis {
    stepId: string;
    status: string;
    health: 'good' | 'warning' | 'error';
    executionTime: number;
    issues: string[];
    recommendations: string[];
}

// Issue detector interface and implementations
export interface IssueDetector {
    name: string;
    detect(session: DebugSession): Promise<DetectedIssue[]>;
}

class InfiniteLoopDetector implements IssueDetector {
    name = 'InfiniteLoopDetector';

    async detect(session: DebugSession): Promise<DetectedIssue[]> {
        const issues: DetectedIssue[] = [];

        // Check for steps that have been running for too long
        const longRunningSteps = session.stepTrace.filter(trace =>
            !trace.exitedAt &&
            Date.now() - trace.enteredAt.getTime() > 300000 // 5 minutes
        );

        for (const step of longRunningSteps) {
            issues.push({
                id: `infinite_loop_${step.stepId}`,
                type: 'infinite_loop',
                severity: 'high',
                title: 'Potential Infinite Loop',
                description: `Step ${step.stepId} has been running for an unusually long time`,
                location: step.stepId,
                detectedAt: new Date(),
                suggestedFixes: [
                    {
                        title: 'Add timeout to step',
                        description: 'Configure a maximum execution time for this step',
                        automated: false,
                    },
                    {
                        title: 'Review step logic',
                        description: 'Check for infinite loops in step implementation',
                        automated: false,
                    },
                ],
                relatedEvents: [],
            });
        }

        return issues;
    }
}

class DeadlockDetector implements IssueDetector {
    name = 'DeadlockDetector';

    async detect(session: DebugSession): Promise<DetectedIssue[]> {
        const issues: DetectedIssue[] = [];

        // Check for circular dependencies in step execution
        const activeSteps = session.stepTrace.filter(trace => !trace.exitedAt);

        if (activeSteps.length > 1) {
            // Simple deadlock detection - multiple steps waiting indefinitely
            const waitingTime = Math.min(...activeSteps.map(step =>
                Date.now() - step.enteredAt.getTime()
            ));

            if (waitingTime > 600000) { // 10 minutes
                issues.push({
                    id: 'deadlock_detected',
                    type: 'deadlock',
                    severity: 'critical',
                    title: 'Potential Deadlock',
                    description: 'Multiple steps appear to be waiting indefinitely',
                    location: 'workflow',
                    detectedAt: new Date(),
                    suggestedFixes: [
                        {
                            title: 'Review step dependencies',
                            description: 'Check for circular dependencies between steps',
                            automated: false,
                        },
                        {
                            title: 'Add timeout mechanisms',
                            description: 'Implement timeouts to break potential deadlocks',
                            automated: false,
                        },
                    ],
                    relatedEvents: [],
                });
            }
        }

        return issues;
    }
}

class PerformanceDegradationDetector implements IssueDetector {
    name = 'PerformanceDegradationDetector';

    async detect(session: DebugSession): Promise<DetectedIssue[]> {
        const issues: DetectedIssue[] = [];

        // Check for performance degradation over time
        const memoryTimeline = session.performanceProfile.memoryUsage.timeline;
        if (memoryTimeline.length > 10) {
            const recent = memoryTimeline.slice(-5);
            const earlier = memoryTimeline.slice(0, 5);

            const recentAvg = recent.reduce((sum, point) => sum + point.usage, 0) / recent.length;
            const earlierAvg = earlier.reduce((sum, point) => sum + point.usage, 0) / earlier.length;

            if (recentAvg > earlierAvg * 1.5) {
                issues.push({
                    id: 'performance_degradation',
                    type: 'performance_degradation',
                    severity: 'medium',
                    title: 'Performance Degradation',
                    description: 'Memory usage has increased significantly during execution',
                    location: 'workflow',
                    detectedAt: new Date(),
                    suggestedFixes: [
                        {
                            title: 'Review memory usage patterns',
                            description: 'Identify and fix memory leaks or inefficient data handling',
                            automated: false,
                        },
                    ],
                    relatedEvents: [],
                });
            }
        }

        return issues;
    }
}

class MemoryLeakDetector implements IssueDetector {
    name = 'MemoryLeakDetector';

    async detect(session: DebugSession): Promise<DetectedIssue[]> {
        const issues: DetectedIssue[] = [];

        // Check for continuously increasing memory usage
        const memoryTimeline = session.performanceProfile.memoryUsage.timeline;
        if (memoryTimeline.length > 20) {
            const trend = this.calculateTrend(memoryTimeline.map(point => point.usage));

            if (trend > 0.1) { // Positive trend indicating memory leak
                issues.push({
                    id: 'memory_leak',
                    type: 'memory_leak',
                    severity: 'high',
                    title: 'Potential Memory Leak',
                    description: 'Memory usage is continuously increasing',
                    location: 'workflow',
                    detectedAt: new Date(),
                    suggestedFixes: [
                        {
                            title: 'Profile memory usage',
                            description: 'Use memory profiling tools to identify leak sources',
                            automated: false,
                        },
                        {
                            title: 'Review object lifecycle',
                            description: 'Ensure proper cleanup of objects and event listeners',
                            automated: false,
                        },
                    ],
                    relatedEvents: [],
                });
            }
        }

        return issues;
    }

    private calculateTrend(values: number[]): number {
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }
}

class ConfigurationErrorDetector implements IssueDetector {
    name = 'ConfigurationErrorDetector';

    async detect(session: DebugSession): Promise<DetectedIssue[]> {
        const issues: DetectedIssue[] = [];

        // Check for configuration-related errors in debug events
        const configErrors = session.capturedEvents.filter(event =>
            event.type === 'error' &&
            (event.message.includes('configuration') || event.message.includes('config'))
        );

        for (const error of configErrors) {
            issues.push({
                id: `config_error_${error.id}`,
                type: 'configuration_error',
                severity: 'medium',
                title: 'Configuration Error',
                description: error.message,
                location: error.source,
                detectedAt: error.timestamp,
                suggestedFixes: [
                    {
                        title: 'Review configuration',
                        description: 'Check workflow and step configuration for errors',
                        automated: false,
                    },
                ],
                relatedEvents: [error.id],
            });
        }

        return issues;
    }
}