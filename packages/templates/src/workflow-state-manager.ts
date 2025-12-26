import { pino } from 'pino';
import { PrismaClient } from '@signtusk/database';
import { WorkflowExecution, WorkflowStep, StepExecution, WorkflowAuditEntry } from './workflow-engine';

const logger = pino({ name: 'workflow-state-manager' });

// Workflow state management types
export interface WorkflowState {
    id: string;
    executionId: string;
    status: WorkflowStatus;
    currentStepId?: string;
    previousStepId?: string;
    context: Record<string, any>;
    stepStates: Map<string, StepState>;
    transitions: StateTransition[];
    metadata: WorkflowStateMetadata;
    createdAt: Date;
    updatedAt: Date;
}

export interface StepState {
    stepId: string;
    status: StepStatus;
    startedAt?: Date;
    completedAt?: Date;
    pausedAt?: Date;
    resumedAt?: Date;
    assignedRecipients: string[];
    activeRecipients: string[];
    completedRecipients: string[];
    results: Record<string, any>;
    attempts: number;
    errors: StepError[];
    metadata: StepStateMetadata;
}

export interface StateTransition {
    id: string;
    fromState: WorkflowStatus | StepStatus;
    toState: WorkflowStatus | StepStatus;
    trigger: TransitionTrigger;
    timestamp: Date;
    userId?: string;
    reason?: string;
    metadata: Record<string, any>;
    isValid: boolean;
    validationErrors?: string[];
}

export interface TransitionTrigger {
    type: 'user_action' | 'system_event' | 'timer' | 'condition' | 'external';
    source: string;
    parameters: Record<string, any>;
}

export interface WorkflowStateMetadata {
    totalSteps: number;
    completedSteps: number;
    activeSteps: number;
    pausedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    estimatedCompletionTime?: Date;
    actualCompletionTime?: Date;
    performanceMetrics: PerformanceMetrics;
    debugInfo: DebugInfo;
}

export interface StepStateMetadata {
    estimatedDuration?: number; // minutes
    actualDuration?: number; // minutes
    priority: number;
    dependencies: string[];
    blockedBy: string[];
    retryCount: number;
    maxRetries: number;
    timeoutMinutes?: number;
    escalationLevel: number;
    debugInfo: StepDebugInfo;
}

export interface PerformanceMetrics {
    startTime: Date;
    endTime?: Date;
    totalDuration?: number; // minutes
    averageStepDuration: number;
    bottleneckSteps: string[];
    throughput: number; // steps per hour
    efficiency: number; // percentage
}

export interface DebugInfo {
    executionPath: string[];
    conditionEvaluations: ConditionEvaluation[];
    variableChanges: VariableChange[];
    systemEvents: SystemEvent[];
    warnings: string[];
    errors: string[];
}

export interface StepDebugInfo {
    entryConditions: ConditionEvaluation[];
    exitConditions: ConditionEvaluation[];
    recipientActions: RecipientAction[];
    systemActions: SystemAction[];
    dataChanges: DataChange[];
    warnings: string[];
    errors: string[];
}

export interface ConditionEvaluation {
    condition: string;
    result: boolean;
    evaluatedAt: Date;
    context: Record<string, any>;
    details: string;
}

export interface VariableChange {
    variable: string;
    oldValue: any;
    newValue: any;
    changedAt: Date;
    changedBy: string;
    reason: string;
}

export interface SystemEvent {
    type: string;
    description: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'error';
    metadata: Record<string, any>;
}

export interface RecipientAction {
    recipientId: string;
    action: string;
    timestamp: Date;
    result: 'success' | 'failure' | 'pending';
    details: Record<string, any>;
}

export interface SystemAction {
    action: string;
    timestamp: Date;
    result: 'success' | 'failure' | 'pending';
    details: Record<string, any>;
    duration?: number; // milliseconds
}

export interface DataChange {
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: Date;
    source: string;
}

export interface StepError {
    code: string;
    message: string;
    timestamp: Date;
    severity: 'warning' | 'error' | 'critical';
    recoverable: boolean;
    context: Record<string, any>;
    stackTrace?: string;
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'expired' | 'failed';
export type StepStatus = 'pending' | 'active' | 'paused' | 'completed' | 'skipped' | 'failed' | 'cancelled';

// State transition validation rules
export interface StateTransitionRule {
    fromState: WorkflowStatus | StepStatus;
    toState: WorkflowStatus | StepStatus;
    conditions: TransitionCondition[];
    actions: TransitionAction[];
    isAllowed: boolean;
}

export interface TransitionCondition {
    type: 'user_permission' | 'workflow_state' | 'step_state' | 'time_constraint' | 'custom';
    parameters: Record<string, any>;
    validator: (state: WorkflowState, context: Record<string, any>) => boolean;
}

export interface TransitionAction {
    type: 'update_state' | 'notify_users' | 'log_event' | 'trigger_webhook' | 'custom';
    parameters: Record<string, any>;
    executor: (state: WorkflowState, context: Record<string, any>) => Promise<void>;
}

export class WorkflowStateManager {
    private stateCache: Map<string, WorkflowState> = new Map();
    private transitionRules: Map<string, StateTransitionRule[]> = new Map();
    private debugMode: boolean = false;

    constructor(private db: PrismaClient) {
        this.initializeTransitionRules();
    }

    /**
     * Initialize workflow state from execution
     */
    async initializeState(executionId: string): Promise<{ success: boolean; state?: WorkflowState; errors?: string[] }> {
        try {
            // Get workflow execution
            const execution = await this.db.workflowExecution.findUnique({
                where: { id: executionId },
                include: {
                    workflow: true,
                },
            });

            if (!execution) {
                return {
                    success: false,
                    errors: ['Workflow execution not found'],
                };
            }

            // Create initial state
            const state: WorkflowState = {
                id: `state_${executionId}`,
                executionId,
                status: execution.status as WorkflowStatus,
                currentStepId: execution.currentStepId || undefined,
                context: execution.context as Record<string, any>,
                stepStates: new Map(),
                transitions: [],
                metadata: {
                    totalSteps: 0,
                    completedSteps: 0,
                    activeSteps: 0,
                    pausedSteps: 0,
                    failedSteps: 0,
                    skippedSteps: 0,
                    performanceMetrics: {
                        startTime: execution.startedAt || execution.createdAt,
                        averageStepDuration: 0,
                        bottleneckSteps: [],
                        throughput: 0,
                        efficiency: 0,
                    },
                    debugInfo: {
                        executionPath: [],
                        conditionEvaluations: [],
                        variableChanges: [],
                        systemEvents: [],
                        warnings: [],
                        errors: [],
                    },
                },
                createdAt: execution.createdAt,
                updatedAt: execution.updatedAt,
            };

            // Initialize step states
            const workflowDefinition = execution.workflow.definition as any;
            const stepExecutions = Array.isArray(execution.stepExecutions)
                ? execution.stepExecutions as unknown as StepExecution[]
                : [];

            if (workflowDefinition.steps) {
                state.metadata.totalSteps = workflowDefinition.steps.length;

                for (const step of workflowDefinition.steps) {
                    const stepExecution = stepExecutions.find(se => se.stepId === step.id);

                    const stepState: StepState = {
                        stepId: step.id,
                        status: (stepExecution?.status as StepStatus) || 'pending',
                        startedAt: stepExecution?.startedAt,
                        completedAt: stepExecution?.completedAt,
                        assignedRecipients: stepExecution?.assignedRecipients || step.recipients || [],
                        activeRecipients: [],
                        completedRecipients: [],
                        results: stepExecution?.results || {},
                        attempts: 0,
                        errors: [],
                        metadata: {
                            priority: step.priority || 0,
                            dependencies: step.dependencies || [],
                            blockedBy: [],
                            retryCount: 0,
                            maxRetries: step.maxRetries || 3,
                            timeoutMinutes: step.timeoutMinutes,
                            escalationLevel: 0,
                            debugInfo: {
                                entryConditions: [],
                                exitConditions: [],
                                recipientActions: [],
                                systemActions: [],
                                dataChanges: [],
                                warnings: [],
                                errors: [],
                            },
                        },
                    };

                    state.stepStates.set(step.id, stepState);

                    // Update counters
                    switch (stepState.status) {
                        case 'completed':
                            state.metadata.completedSteps++;
                            break;
                        case 'active':
                            state.metadata.activeSteps++;
                            break;
                        case 'paused':
                            state.metadata.pausedSteps++;
                            break;
                        case 'failed':
                            state.metadata.failedSteps++;
                            break;
                        case 'skipped':
                            state.metadata.skippedSteps++;
                            break;
                    }
                }
            }

            // Initialize audit trail as transitions
            const auditTrail = Array.isArray(execution.auditTrail)
                ? execution.auditTrail as unknown as WorkflowAuditEntry[]
                : [];
            state.transitions = auditTrail.map((entry, index) => ({
                id: `transition_${index}`,
                fromState: 'draft' as WorkflowStatus,
                toState: execution.status as WorkflowStatus,
                trigger: {
                    type: 'system_event',
                    source: entry.action,
                    parameters: entry.details,
                },
                timestamp: entry.timestamp,
                userId: entry.userId,
                reason: entry.action,
                metadata: entry.details,
                isValid: true,
            }));

            // Cache state
            this.stateCache.set(executionId, state);

            logger.info({ executionId, stateId: state.id }, 'Workflow state initialized');

            return {
                success: true,
                state,
            };
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to initialize workflow state');
            return {
                success: false,
                errors: ['Failed to initialize workflow state'],
            };
        }
    }

    /**
     * Get current workflow state
     */
    async getState(executionId: string): Promise<WorkflowState | null> {
        try {
            // Check cache first
            if (this.stateCache.has(executionId)) {
                return this.stateCache.get(executionId)!;
            }

            // Initialize state if not cached
            const result = await this.initializeState(executionId);
            return result.success ? result.state! : null;
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to get workflow state');
            return null;
        }
    }

    /**
     * Validate state transition
     */
    async validateTransition(
        executionId: string,
        fromState: WorkflowStatus | StepStatus,
        toState: WorkflowStatus | StepStatus,
        context: Record<string, any> = {}
    ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
        try {
            const state = await this.getState(executionId);
            if (!state) {
                return {
                    isValid: false,
                    errors: ['Workflow state not found'],
                };
            }

            const transitionKey = `${fromState}_to_${toState}`;
            const rules = this.transitionRules.get(transitionKey) || [];

            const errors: string[] = [];
            const warnings: string[] = [];

            // Check if transition is allowed
            const allowedRule = rules.find(rule => rule.isAllowed);
            if (!allowedRule) {
                errors.push(`Transition from ${fromState} to ${toState} is not allowed`);
            }

            // Validate conditions
            for (const rule of rules) {
                for (const condition of rule.conditions) {
                    try {
                        const isValid = condition.validator(state, context);
                        if (!isValid) {
                            if (rule.isAllowed) {
                                errors.push(`Condition failed: ${condition.type}`);
                            } else {
                                warnings.push(`Condition warning: ${condition.type}`);
                            }
                        }
                    } catch (conditionError) {
                        errors.push(`Condition validation error: ${condition.type}`);
                        logger.error({ conditionError, condition }, 'Condition validation failed');
                    }
                }
            }

            // Log validation result
            if (this.debugMode) {
                state.metadata.debugInfo.systemEvents.push({
                    type: 'transition_validation',
                    description: `Validated transition from ${fromState} to ${toState}`,
                    timestamp: new Date(),
                    severity: errors.length > 0 ? 'error' : 'info',
                    metadata: { fromState, toState, errors, warnings },
                });
            }

            return {
                isValid: errors.length === 0,
                errors: errors.length > 0 ? errors : undefined,
                warnings: warnings.length > 0 ? warnings : undefined,
            };
        } catch (error) {
            logger.error({ error, executionId, fromState, toState }, 'Failed to validate state transition');
            return {
                isValid: false,
                errors: ['Failed to validate state transition'],
            };
        }
    }

    /**
     * Execute state transition
     */
    async executeTransition(
        executionId: string,
        toState: WorkflowStatus | StepStatus,
        trigger: TransitionTrigger,
        userId?: string,
        reason?: string
    ): Promise<{ success: boolean; transition?: StateTransition; errors?: string[] }> {
        try {
            const state = await this.getState(executionId);
            if (!state) {
                return {
                    success: false,
                    errors: ['Workflow state not found'],
                };
            }

            const fromState = state.status;

            // Validate transition
            const validation = await this.validateTransition(executionId, fromState, toState as WorkflowStatus);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors,
                };
            }

            // Create transition record
            const transition: StateTransition = {
                id: `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                fromState,
                toState: toState as WorkflowStatus,
                trigger,
                timestamp: new Date(),
                userId,
                reason,
                metadata: {},
                isValid: true,
            };

            // Update state
            state.status = toState as WorkflowStatus;
            state.previousStepId = state.currentStepId;
            state.updatedAt = new Date();
            state.transitions.push(transition);

            // Execute transition actions
            const transitionKey = `${fromState}_to_${toState}`;
            const rules = this.transitionRules.get(transitionKey) || [];

            for (const rule of rules) {
                if (rule.isAllowed) {
                    for (const action of rule.actions) {
                        try {
                            await action.executor(state, { userId, reason, trigger });
                        } catch (actionError) {
                            logger.error({ actionError, action }, 'Transition action failed');
                            state.metadata.debugInfo.errors.push(`Transition action failed: ${action.type}`);
                        }
                    }
                }
            }

            // Update performance metrics
            this.updatePerformanceMetrics(state);

            // Persist state changes
            await this.persistState(state);

            // Update cache
            this.stateCache.set(executionId, state);

            logger.info({
                executionId,
                transitionId: transition.id,
                fromState,
                toState,
                userId
            }, 'State transition executed successfully');

            return {
                success: true,
                transition,
            };
        } catch (error) {
            logger.error({ error, executionId, toState }, 'Failed to execute state transition');
            return {
                success: false,
                errors: ['Failed to execute state transition'],
            };
        }
    }

    /**
     * Pause workflow execution
     */
    async pauseWorkflow(
        executionId: string,
        reason?: string,
        userId?: string
    ): Promise<{ success: boolean; errors?: string[] }> {
        try {
            const result = await this.executeTransition(
                executionId,
                'paused',
                {
                    type: 'user_action',
                    source: 'pause_request',
                    parameters: { reason },
                },
                userId,
                reason
            );

            if (result.success) {
                // Pause all active steps
                const state = await this.getState(executionId);
                if (state) {
                    for (const [stepId, stepState] of state.stepStates) {
                        if (stepState.status === 'active') {
                            stepState.status = 'paused';
                            stepState.pausedAt = new Date();

                            if (this.debugMode) {
                                stepState.metadata.debugInfo.systemActions.push({
                                    action: 'step_paused',
                                    timestamp: new Date(),
                                    result: 'success',
                                    details: { reason, userId },
                                });
                            }
                        }
                    }

                    // Update cache
                    this.stateCache.set(executionId, state);
                    await this.persistState(state);
                }
            }

            return result;
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to pause workflow');
            return {
                success: false,
                errors: ['Failed to pause workflow'],
            };
        }
    }

    /**
     * Resume workflow execution
     */
    async resumeWorkflow(
        executionId: string,
        userId?: string
    ): Promise<{ success: boolean; errors?: string[] }> {
        try {
            const result = await this.executeTransition(
                executionId,
                'active',
                {
                    type: 'user_action',
                    source: 'resume_request',
                    parameters: {},
                },
                userId,
                'Workflow resumed'
            );

            if (result.success) {
                // Resume paused steps
                const state = await this.getState(executionId);
                if (state) {
                    for (const [stepId, stepState] of state.stepStates) {
                        if (stepState.status === 'paused') {
                            stepState.status = 'active';
                            stepState.resumedAt = new Date();

                            if (this.debugMode) {
                                stepState.metadata.debugInfo.systemActions.push({
                                    action: 'step_resumed',
                                    timestamp: new Date(),
                                    result: 'success',
                                    details: { userId },
                                });
                            }
                        }
                    }

                    await this.persistState(state);
                }
            }

            return result;
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to resume workflow');
            return {
                success: false,
                errors: ['Failed to resume workflow'],
            };
        }
    }

    /**
     * Cancel workflow execution
     */
    async cancelWorkflow(
        executionId: string,
        reason?: string,
        userId?: string
    ): Promise<{ success: boolean; errors?: string[] }> {
        try {
            const result = await this.executeTransition(
                executionId,
                'cancelled',
                {
                    type: 'user_action',
                    source: 'cancel_request',
                    parameters: { reason },
                },
                userId,
                reason
            );

            if (result.success) {
                // Cancel all active and paused steps
                const state = await this.getState(executionId);
                if (state) {
                    for (const [stepId, stepState] of state.stepStates) {
                        if (stepState.status === 'active' || stepState.status === 'paused') {
                            stepState.status = 'cancelled';

                            if (this.debugMode) {
                                stepState.metadata.debugInfo.systemActions.push({
                                    action: 'step_cancelled',
                                    timestamp: new Date(),
                                    result: 'success',
                                    details: { reason, userId },
                                });
                            }
                        }
                    }

                    // Update metadata
                    state.metadata.performanceMetrics.endTime = new Date();

                    await this.persistState(state);
                }
            }

            return result;
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to cancel workflow');
            return {
                success: false,
                errors: ['Failed to cancel workflow'],
            };
        }
    }

    /**
     * Get workflow debugging information
     */
    async getDebugInfo(executionId: string): Promise<{
        success: boolean;
        debugInfo?: {
            state: WorkflowState;
            transitions: StateTransition[];
            stepDetails: Map<string, StepState>;
            performanceAnalysis: PerformanceAnalysis;
            troubleshootingTips: TroubleshootingTip[];
        };
        errors?: string[];
    }> {
        try {
            const state = await this.getState(executionId);
            if (!state) {
                return {
                    success: false,
                    errors: ['Workflow state not found'],
                };
            }

            // Analyze performance
            const performanceAnalysis = this.analyzePerformance(state);

            // Generate troubleshooting tips
            const troubleshootingTips = this.generateTroubleshootingTips(state);

            return {
                success: true,
                debugInfo: {
                    state,
                    transitions: state.transitions,
                    stepDetails: state.stepStates,
                    performanceAnalysis,
                    troubleshootingTips,
                },
            };
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to get debug info');
            return {
                success: false,
                errors: ['Failed to get debug info'],
            };
        }
    }

    /**
     * Enable debug mode
     */
    enableDebugMode(): void {
        this.debugMode = true;
        logger.info('Debug mode enabled');
    }

    /**
     * Disable debug mode
     */
    disableDebugMode(): void {
        this.debugMode = false;
        logger.info('Debug mode disabled');
    }

    // Private helper methods

    private initializeTransitionRules(): void {
        // Define allowed state transitions and their rules
        const rules: Array<{ key: string; rule: StateTransitionRule }> = [
            // Workflow state transitions
            {
                key: 'draft_to_active',
                rule: {
                    fromState: 'draft',
                    toState: 'active',
                    conditions: [
                        {
                            type: 'workflow_state',
                            parameters: {},
                            validator: (state) => state.metadata.totalSteps > 0,
                        },
                    ],
                    actions: [
                        {
                            type: 'log_event',
                            parameters: {},
                            executor: async (state) => {
                                state.metadata.performanceMetrics.startTime = new Date();
                            },
                        },
                    ],
                    isAllowed: true,
                },
            },
            {
                key: 'active_to_paused',
                rule: {
                    fromState: 'active',
                    toState: 'paused',
                    conditions: [],
                    actions: [
                        {
                            type: 'update_state',
                            parameters: {},
                            executor: async (state) => {
                                // Pause logic handled in pauseWorkflow method
                            },
                        },
                    ],
                    isAllowed: true,
                },
            },
            {
                key: 'paused_to_active',
                rule: {
                    fromState: 'paused',
                    toState: 'active',
                    conditions: [],
                    actions: [
                        {
                            type: 'update_state',
                            parameters: {},
                            executor: async (state) => {
                                // Resume logic handled in resumeWorkflow method
                            },
                        },
                    ],
                    isAllowed: true,
                },
            },
            {
                key: 'active_to_completed',
                rule: {
                    fromState: 'active',
                    toState: 'completed',
                    conditions: [
                        {
                            type: 'workflow_state',
                            parameters: {},
                            validator: (state) => {
                                const totalSteps = state.metadata.totalSteps;
                                const completedSteps = state.metadata.completedSteps;
                                return completedSteps === totalSteps;
                            },
                        },
                    ],
                    actions: [
                        {
                            type: 'update_state',
                            parameters: {},
                            executor: async (state) => {
                                state.metadata.performanceMetrics.endTime = new Date();
                                state.metadata.actualCompletionTime = new Date();
                            },
                        },
                    ],
                    isAllowed: true,
                },
            },
            {
                key: 'active_to_cancelled',
                rule: {
                    fromState: 'active',
                    toState: 'cancelled',
                    conditions: [],
                    actions: [
                        {
                            type: 'update_state',
                            parameters: {},
                            executor: async (state) => {
                                state.metadata.performanceMetrics.endTime = new Date();
                            },
                        },
                    ],
                    isAllowed: true,
                },
            },
            {
                key: 'paused_to_cancelled',
                rule: {
                    fromState: 'paused',
                    toState: 'cancelled',
                    conditions: [],
                    actions: [
                        {
                            type: 'update_state',
                            parameters: {},
                            executor: async (state) => {
                                state.metadata.performanceMetrics.endTime = new Date();
                            },
                        },
                    ],
                    isAllowed: true,
                },
            },
            // Step state transitions
            {
                key: 'pending_to_active',
                rule: {
                    fromState: 'pending',
                    toState: 'active',
                    conditions: [],
                    actions: [],
                    isAllowed: true,
                },
            },
            {
                key: 'active_to_completed',
                rule: {
                    fromState: 'active',
                    toState: 'completed',
                    conditions: [],
                    actions: [],
                    isAllowed: true,
                },
            },
            {
                key: 'active_to_paused',
                rule: {
                    fromState: 'active',
                    toState: 'paused',
                    conditions: [],
                    actions: [],
                    isAllowed: true,
                },
            },
            {
                key: 'paused_to_active',
                rule: {
                    fromState: 'paused',
                    toState: 'active',
                    conditions: [],
                    actions: [],
                    isAllowed: true,
                },
            },
            {
                key: 'active_to_failed',
                rule: {
                    fromState: 'active',
                    toState: 'failed',
                    conditions: [],
                    actions: [],
                    isAllowed: true,
                },
            },
            {
                key: 'pending_to_skipped',
                rule: {
                    fromState: 'pending',
                    toState: 'skipped',
                    conditions: [],
                    actions: [],
                    isAllowed: true,
                },
            },
        ];

        // Store rules in map
        for (const { key, rule } of rules) {
            if (!this.transitionRules.has(key)) {
                this.transitionRules.set(key, []);
            }
            this.transitionRules.get(key)!.push(rule);
        }
    }

    private updatePerformanceMetrics(state: WorkflowState): void {
        const now = new Date();
        const startTime = state.metadata.performanceMetrics.startTime;

        if (state.metadata.performanceMetrics.endTime) {
            const totalDuration = (state.metadata.performanceMetrics.endTime.getTime() - startTime.getTime()) / (1000 * 60);
            state.metadata.performanceMetrics.totalDuration = totalDuration;

            if (state.metadata.completedSteps > 0) {
                state.metadata.performanceMetrics.averageStepDuration = totalDuration / state.metadata.completedSteps;
                state.metadata.performanceMetrics.throughput = (state.metadata.completedSteps / totalDuration) * 60; // steps per hour
            }

            state.metadata.performanceMetrics.efficiency = (state.metadata.completedSteps / state.metadata.totalSteps) * 100;
        }

        // Identify bottleneck steps
        const stepDurations: Array<{ stepId: string; duration: number }> = [];
        for (const [stepId, stepState] of state.stepStates) {
            if (stepState.startedAt && stepState.completedAt) {
                const duration = (stepState.completedAt.getTime() - stepState.startedAt.getTime()) / (1000 * 60);
                stepDurations.push({ stepId, duration });
            }
        }

        stepDurations.sort((a, b) => b.duration - a.duration);
        state.metadata.performanceMetrics.bottleneckSteps = stepDurations.slice(0, 3).map(s => s.stepId);
    }

    private async persistState(state: WorkflowState): Promise<void> {
        try {
            // Convert step states map to array for JSON storage
            const stepStatesArray = Array.from(state.stepStates.entries()).map(([stepId, stepState]) => ({
                stepId,
                status: stepState.status,
                startedAt: stepState.startedAt,
                completedAt: stepState.completedAt,
                pausedAt: stepState.pausedAt,
                resumedAt: stepState.resumedAt,
                assignedRecipients: stepState.assignedRecipients,
                results: stepState.results,
                metadata: stepState.metadata,
            }));

            // Update workflow execution record
            await this.db.workflowExecution.update({
                where: { id: state.executionId },
                data: {
                    status: state.status,
                    currentStepId: state.currentStepId,
                    context: state.context,
                    stepExecutions: JSON.parse(JSON.stringify(stepStatesArray)),
                    auditTrail: JSON.parse(JSON.stringify(state.transitions.map(t => ({
                        timestamp: t.timestamp,
                        action: `${t.fromState}_to_${t.toState}`,
                        userId: t.userId,
                        details: {
                            trigger: t.trigger,
                            reason: t.reason,
                            metadata: t.metadata,
                        },
                    })))),
                    updatedAt: state.updatedAt,
                },
            });

            logger.debug({ executionId: state.executionId }, 'Workflow state persisted');
        } catch (error) {
            logger.error({ error, executionId: state.executionId }, 'Failed to persist workflow state');
            throw error;
        }
    }

    private analyzePerformance(state: WorkflowState): PerformanceAnalysis {
        const analysis: PerformanceAnalysis = {
            overallHealth: 'good',
            completionProgress: (state.metadata.completedSteps / state.metadata.totalSteps) * 100,
            estimatedTimeRemaining: 0,
            bottlenecks: [],
            recommendations: [],
        };

        // Analyze bottlenecks
        for (const stepId of state.metadata.performanceMetrics.bottleneckSteps) {
            const stepState = state.stepStates.get(stepId);
            if (stepState) {
                analysis.bottlenecks.push({
                    stepId,
                    issue: 'Long execution time',
                    impact: 'high',
                    suggestion: 'Consider breaking down this step or optimizing the process',
                });
            }
        }

        // Generate recommendations
        if (state.metadata.failedSteps > 0) {
            analysis.recommendations.push('Review failed steps and implement error handling');
            analysis.overallHealth = 'warning';
        }

        if (state.metadata.performanceMetrics.efficiency < 50) {
            analysis.recommendations.push('Workflow efficiency is low, consider optimizing step dependencies');
            analysis.overallHealth = 'warning';
        }

        return analysis;
    }

    private generateTroubleshootingTips(state: WorkflowState): TroubleshootingTip[] {
        const tips: TroubleshootingTip[] = [];

        // Check for common issues
        if (state.status === 'paused') {
            tips.push({
                category: 'workflow_paused',
                title: 'Workflow is Paused',
                description: 'The workflow execution has been paused and needs to be resumed',
                severity: 'warning',
                actions: ['Resume the workflow to continue execution'],
            });
        }

        if (state.metadata.failedSteps > 0) {
            tips.push({
                category: 'failed_steps',
                title: 'Failed Steps Detected',
                description: 'Some workflow steps have failed and may need attention',
                severity: 'error',
                actions: [
                    'Review error logs for failed steps',
                    'Check step configuration and dependencies',
                    'Consider retrying failed steps',
                ],
            });
        }

        if (state.metadata.performanceMetrics.bottleneckSteps.length > 0) {
            tips.push({
                category: 'performance',
                title: 'Performance Bottlenecks',
                description: 'Some steps are taking longer than expected',
                severity: 'info',
                actions: [
                    'Review bottleneck steps for optimization opportunities',
                    'Consider parallel execution where possible',
                    'Check for resource constraints',
                ],
            });
        }

        return tips;
    }
}

// Additional types for debugging and troubleshooting
export interface PerformanceAnalysis {
    overallHealth: 'good' | 'warning' | 'error';
    completionProgress: number; // percentage
    estimatedTimeRemaining: number; // minutes
    bottlenecks: Array<{
        stepId: string;
        issue: string;
        impact: 'low' | 'medium' | 'high';
        suggestion: string;
    }>;
    recommendations: string[];
}

export interface TroubleshootingTip {
    category: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'error';
    actions: string[];
}