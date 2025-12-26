import { pino } from 'pino';
import { PrismaClient } from '@signtusk/database';
import { WorkflowConfig } from './types';

const logger = pino({ name: 'workflow-engine' });

export interface WorkflowStep {
    id: string;
    name: string;
    type: 'signing' | 'approval' | 'review' | 'notification';
    recipients: string[];
    conditions?: WorkflowCondition[];
    settings: Record<string, any>;
}

export interface WorkflowCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
    value: any;
}

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    documentId: string;
    status: 'active' | 'paused' | 'completed' | 'cancelled' | 'expired';
    currentStepId?: string;
    context: Record<string, any>;
    stepExecutions: StepExecution[];
    auditTrail: WorkflowAuditEntry[];
}

export interface StepExecution {
    stepId: string;
    status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    assignedRecipients: string[];
    results: Record<string, any>;
}

export interface WorkflowAuditEntry {
    timestamp: Date;
    action: string;
    stepId?: string;
    userId?: string;
    details: Record<string, any>;
}

export class WorkflowEngine {
    constructor(protected db: PrismaClient) { }

    /**
     * Create a new workflow from configuration
     */
    async createWorkflow(
        config: WorkflowConfig,
        documentId?: string,
        templateId?: string,
        organizationId?: string,
        createdBy?: string
    ): Promise<{ success: boolean; workflowId?: string; errors?: string[] }> {
        try {
            // Validate workflow configuration
            const validation = this.validateWorkflowConfig(config);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors,
                };
            }

            // Create workflow record
            const workflow = await this.db.workflow.create({
                data: {
                    name: `Workflow for ${documentId || templateId}`,
                    type: config.type,
                    documentId,
                    templateId,
                    organizationId: organizationId || '',
                    createdBy: createdBy || '',
                    definition: config as any,
                    settings: config.settings,
                    status: 'draft',
                },
            });

            logger.info({ workflowId: workflow.id }, 'Workflow created successfully');

            return {
                success: true,
                workflowId: workflow.id,
            };
        } catch (error) {
            logger.error({ error, config }, 'Failed to create workflow');
            return {
                success: false,
                errors: ['Failed to create workflow'],
            };
        }
    }

    /**
     * Start workflow execution
     */
    async startExecution(
        workflowId: string,
        documentId: string,
        context: Record<string, any> = {}
    ): Promise<{ success: boolean; executionId?: string; errors?: string[] }> {
        try {
            // Get workflow definition
            const workflow = await this.db.workflow.findUnique({
                where: { id: workflowId },
            });

            if (!workflow) {
                return {
                    success: false,
                    errors: ['Workflow not found'],
                };
            }

            const config = workflow.definition as WorkflowConfig;

            // Create execution record
            const execution = await this.db.workflowExecution.create({
                data: {
                    workflowId,
                    documentId,
                    status: 'active',
                    context,
                    stepExecutions: JSON.parse(JSON.stringify([])),
                    auditTrail: JSON.parse(JSON.stringify([{
                        timestamp: new Date(),
                        action: 'workflow_started',
                        details: { context },
                    }])),
                },
            });

            // Initialize step executions
            const stepExecutions: StepExecution[] = config.steps.map(step => ({
                stepId: step.id,
                status: 'pending',
                assignedRecipients: step.recipients,
                results: {},
            }));

            // Determine first step to execute
            const firstStep = this.getNextStep(config, stepExecutions, context);
            if (firstStep) {
                stepExecutions.find(se => se.stepId === firstStep.id)!.status = 'active';
                stepExecutions.find(se => se.stepId === firstStep.id)!.startedAt = new Date();

                await this.db.workflowExecution.update({
                    where: { id: execution.id },
                    data: {
                        currentStepId: firstStep.id,
                        stepExecutions: JSON.parse(JSON.stringify(stepExecutions)),
                    },
                });
            }

            logger.info({ executionId: execution.id, workflowId }, 'Workflow execution started');

            return {
                success: true,
                executionId: execution.id,
            };
        } catch (error) {
            logger.error({ error, workflowId, documentId }, 'Failed to start workflow execution');
            return {
                success: false,
                errors: ['Failed to start workflow execution'],
            };
        }
    }

    /**
     * Complete a workflow step
     */
    async completeStep(
        executionId: string,
        stepId: string,
        results: Record<string, any>,
        userId?: string
    ): Promise<{ success: boolean; nextStep?: WorkflowStep; errors?: string[] }> {
        try {
            // Get execution
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

            const config = execution.workflow.definition as WorkflowConfig;
            const stepExecutions = Array.isArray(execution.stepExecutions)
                ? execution.stepExecutions as unknown as StepExecution[]
                : [];

            // Find and update step execution
            const stepExecution = stepExecutions.find(se => se.stepId === stepId);
            if (!stepExecution) {
                return {
                    success: false,
                    errors: ['Step not found in execution'],
                };
            }

            if (stepExecution.status !== 'active') {
                return {
                    success: false,
                    errors: ['Step is not currently active'],
                };
            }

            // Update step execution
            stepExecution.status = 'completed';
            stepExecution.completedAt = new Date();
            stepExecution.results = results;

            // Update context with step results
            const updatedContext = {
                ...(execution.context as Record<string, any> || {}),
                [`step_${stepId}`]: results,
            };

            // Determine next step
            const nextStep = this.getNextStep(config, stepExecutions, updatedContext);
            let workflowStatus = execution.status;
            let currentStepId = execution.currentStepId;

            if (nextStep) {
                // Activate next step
                const nextStepExecution = stepExecutions.find(se => se.stepId === nextStep.id);
                if (nextStepExecution) {
                    nextStepExecution.status = 'active';
                    nextStepExecution.startedAt = new Date();
                    currentStepId = nextStep.id;
                }
            } else {
                // No more steps, complete workflow
                workflowStatus = 'completed';
                currentStepId = null;
            }

            // Update execution
            await this.db.workflowExecution.update({
                where: { id: executionId },
                data: {
                    status: workflowStatus,
                    currentStepId: currentStepId || null,
                    context: updatedContext,
                    stepExecutions: JSON.parse(JSON.stringify(stepExecutions)),
                    auditTrail: JSON.parse(JSON.stringify([
                        ...(Array.isArray(execution.auditTrail) ? execution.auditTrail as unknown as WorkflowAuditEntry[] : []),
                        {
                            timestamp: new Date(),
                            action: 'step_completed',
                            stepId,
                            userId,
                            details: { results },
                        },
                    ])),
                },
            });

            logger.info({ executionId, stepId, nextStepId: nextStep?.id }, 'Workflow step completed');

            return {
                success: true,
                nextStep: nextStep || undefined,
            };
        } catch (error) {
            logger.error({ error, executionId, stepId }, 'Failed to complete workflow step');
            return {
                success: false,
                errors: ['Failed to complete workflow step'],
            };
        }
    }

    /**
     * Pause workflow execution
     */
    async pauseExecution(
        executionId: string,
        reason?: string,
        userId?: string
    ): Promise<{ success: boolean; errors?: string[] }> {
        try {
            const execution = await this.db.workflowExecution.findUnique({
                where: { id: executionId },
            });

            if (!execution) {
                return {
                    success: false,
                    errors: ['Workflow execution not found'],
                };
            }

            if (execution.status !== 'active') {
                return {
                    success: false,
                    errors: ['Workflow is not currently active'],
                };
            }

            await this.db.workflowExecution.update({
                where: { id: executionId },
                data: {
                    status: 'paused',
                    auditTrail: JSON.parse(JSON.stringify([
                        ...(Array.isArray(execution.auditTrail) ? execution.auditTrail as unknown as WorkflowAuditEntry[] : []),
                        {
                            timestamp: new Date(),
                            action: 'workflow_paused',
                            userId,
                            details: { reason },
                        },
                    ])),
                },
            });

            logger.info({ executionId, reason, userId }, 'Workflow execution paused');

            return { success: true };
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to pause workflow execution');
            return {
                success: false,
                errors: ['Failed to pause workflow execution'],
            };
        }
    }

    /**
     * Resume workflow execution
     */
    async resumeExecution(
        executionId: string,
        userId?: string
    ): Promise<{ success: boolean; errors?: string[] }> {
        try {
            const execution = await this.db.workflowExecution.findUnique({
                where: { id: executionId },
            });

            if (!execution) {
                return {
                    success: false,
                    errors: ['Workflow execution not found'],
                };
            }

            if (execution.status !== 'paused') {
                return {
                    success: false,
                    errors: ['Workflow is not currently paused'],
                };
            }

            await this.db.workflowExecution.update({
                where: { id: executionId },
                data: {
                    status: 'active',
                    auditTrail: JSON.parse(JSON.stringify([
                        ...(Array.isArray(execution.auditTrail) ? execution.auditTrail as unknown as WorkflowAuditEntry[] : []),
                        {
                            timestamp: new Date(),
                            action: 'workflow_resumed',
                            userId,
                            details: {},
                        },
                    ])),
                },
            });

            logger.info({ executionId, userId }, 'Workflow execution resumed');

            return { success: true };
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to resume workflow execution');
            return {
                success: false,
                errors: ['Failed to resume workflow execution'],
            };
        }
    }

    /**
     * Cancel workflow execution
     */
    async cancelExecution(
        executionId: string,
        reason?: string,
        userId?: string
    ): Promise<{ success: boolean; errors?: string[] }> {
        try {
            const execution = await this.db.workflowExecution.findUnique({
                where: { id: executionId },
            });

            if (!execution) {
                return {
                    success: false,
                    errors: ['Workflow execution not found'],
                };
            }

            if (execution.status === 'completed' || execution.status === 'cancelled') {
                return {
                    success: false,
                    errors: ['Workflow is already completed or cancelled'],
                };
            }

            await this.db.workflowExecution.update({
                where: { id: executionId },
                data: {
                    status: 'cancelled',
                    auditTrail: JSON.parse(JSON.stringify([
                        ...(Array.isArray(execution.auditTrail) ? execution.auditTrail as unknown as WorkflowAuditEntry[] : []),
                        {
                            timestamp: new Date(),
                            action: 'workflow_cancelled',
                            userId,
                            details: { reason },
                        },
                    ])),
                },
            });

            logger.info({ executionId, reason, userId }, 'Workflow execution cancelled');

            return { success: true };
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to cancel workflow execution');
            return {
                success: false,
                errors: ['Failed to cancel workflow execution'],
            };
        }
    }

    /**
     * Get workflow execution status
     */
    async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
        try {
            const execution = await this.db.workflowExecution.findUnique({
                where: { id: executionId },
                include: {
                    workflow: true,
                },
            });

            if (!execution) {
                return null;
            }

            return {
                id: execution.id,
                workflowId: execution.workflowId,
                documentId: execution.documentId,
                status: execution.status as any,
                currentStepId: execution.currentStepId || undefined,
                context: execution.context as Record<string, any>,
                stepExecutions: Array.isArray(execution.stepExecutions)
                    ? execution.stepExecutions as unknown as StepExecution[]
                    : [],
                auditTrail: Array.isArray(execution.auditTrail)
                    ? execution.auditTrail as unknown as WorkflowAuditEntry[]
                    : [],
            };
        } catch (error) {
            logger.error({ error, executionId }, 'Failed to get workflow execution status');
            return null;
        }
    }

    /**
     * Validate workflow configuration
     */
    private validateWorkflowConfig(config: WorkflowConfig): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.steps || config.steps.length === 0) {
            errors.push('Workflow must have at least one step');
        } else {
            const stepIds = new Set<string>();

            config.steps.forEach((step, index) => {
                if (stepIds.has(step.id)) {
                    errors.push(`Duplicate step ID: ${step.id}`);
                }
                stepIds.add(step.id);

                if (!step.name.trim()) {
                    errors.push(`Step ${index + 1} name is required`);
                }

                if (!step.recipients || step.recipients.length === 0) {
                    errors.push(`Step "${step.name}" must have at least one recipient`);
                }

                // Validate conditions
                if (step.conditions) {
                    step.conditions.forEach((condition, condIndex) => {
                        if (!condition.field.trim()) {
                            errors.push(`Step "${step.name}" condition ${condIndex + 1} field is required`);
                        }
                    });
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Convert workflow config step to WorkflowStep interface
     */
    private convertConfigStepToWorkflowStep(configStep: any): WorkflowStep {
        return {
            id: configStep.id,
            name: configStep.name,
            type: configStep.type,
            recipients: configStep.recipients,
            conditions: configStep.conditions?.map((condition: any) => ({
                field: condition.field,
                operator: condition.operator,
                value: condition.value,
            })),
            settings: configStep.settings || {},
        };
    }

    /**
     * Determine next step to execute based on workflow type and conditions
     */
    private getNextStep(
        config: WorkflowConfig,
        stepExecutions: StepExecution[],
        context: Record<string, any>
    ): WorkflowStep | null {
        const completedSteps = stepExecutions.filter(se => se.status === 'completed');
        const pendingSteps = stepExecutions.filter(se => se.status === 'pending');

        if (pendingSteps.length === 0) {
            return null; // All steps completed
        }

        switch (config.type) {
            case 'sequential':
                return this.getNextSequentialStep(config, stepExecutions);

            case 'parallel':
                return this.getNextParallelStep(config, stepExecutions);

            case 'conditional':
                return this.getNextConditionalStep(config, stepExecutions, context);

            case 'hybrid':
                return this.getNextHybridStep(config, stepExecutions, context);

            default:
                return null;
        }
    }

    /**
     * Get next step for sequential workflow
     */
    private getNextSequentialStep(
        config: WorkflowConfig,
        stepExecutions: StepExecution[]
    ): WorkflowStep | null {
        // Find first pending step in order
        for (const step of config.steps) {
            const execution = stepExecutions.find(se => se.stepId === step.id);
            if (execution && execution.status === 'pending') {
                return this.convertConfigStepToWorkflowStep(step);
            }
        }
        return null;
    }

    /**
     * Get next step for parallel workflow
     */
    private getNextParallelStep(
        config: WorkflowConfig,
        stepExecutions: StepExecution[]
    ): WorkflowStep | null {
        // Return first pending step (all can run in parallel)
        for (const step of config.steps) {
            const execution = stepExecutions.find(se => se.stepId === step.id);
            if (execution && execution.status === 'pending') {
                return this.convertConfigStepToWorkflowStep(step);
            }
        }
        return null;
    }

    /**
     * Get next step for conditional workflow
     */
    private getNextConditionalStep(
        config: WorkflowConfig,
        stepExecutions: StepExecution[],
        context: Record<string, any>
    ): WorkflowStep | null {
        for (const step of config.steps) {
            const execution = stepExecutions.find(se => se.stepId === step.id);
            if (execution && execution.status === 'pending') {
                const workflowStep = this.convertConfigStepToWorkflowStep(step);
                // Check if step conditions are met
                if (this.evaluateStepConditions(workflowStep, context)) {
                    return workflowStep;
                } else {
                    // Mark step as skipped if conditions not met
                    execution.status = 'skipped';
                }
            }
        }
        return null;
    }

    /**
     * Get next step for hybrid workflow
     */
    private getNextHybridStep(
        config: WorkflowConfig,
        stepExecutions: StepExecution[],
        context: Record<string, any>
    ): WorkflowStep | null {
        // Hybrid combines sequential and conditional logic
        // Steps must be completed in order, but conditions are evaluated
        for (const step of config.steps) {
            const execution = stepExecutions.find(se => se.stepId === step.id);
            if (execution && execution.status === 'pending') {
                const workflowStep = this.convertConfigStepToWorkflowStep(step);
                if (this.evaluateStepConditions(workflowStep, context)) {
                    return workflowStep;
                } else {
                    execution.status = 'skipped';
                }
            }
        }
        return null;
    }

    /**
     * Evaluate step conditions
     */
    private evaluateStepConditions(step: WorkflowStep, context: Record<string, any>): boolean {
        if (!step.conditions || step.conditions.length === 0) {
            return true; // No conditions means step should execute
        }

        // All conditions must be true (AND logic)
        return step.conditions.every(condition => {
            const fieldValue = this.getContextValue(context, condition.field);
            return this.evaluateCondition(fieldValue, condition.operator, condition.value);
        });
    }

    /**
     * Get value from context using dot notation
     */
    private getContextValue(context: Record<string, any>, field: string): any {
        const parts = field.split('.');
        let value = context;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Evaluate a single condition
     */
    private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
        switch (operator) {
            case 'equals':
                return fieldValue === expectedValue;

            case 'not_equals':
                return fieldValue !== expectedValue;

            case 'contains':
                return typeof fieldValue === 'string' && fieldValue.includes(expectedValue);

            case 'not_contains':
                return typeof fieldValue === 'string' && !fieldValue.includes(expectedValue);

            case 'greater_than':
                return typeof fieldValue === 'number' && fieldValue > expectedValue;

            case 'less_than':
                return typeof fieldValue === 'number' && fieldValue < expectedValue;

            default:
                return false;
        }
    }
}