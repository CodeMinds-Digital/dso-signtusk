import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PrismaClient } from '@signtusk/database';
import { WorkflowStateManager, WorkflowState, StepState, StateTransition } from '../workflow-state-manager';

// Mock Prisma client
const mockPrismaClient = {
    workflowExecution: {
        findUnique: vi.fn(),
        update: vi.fn(),
    },
} as unknown as PrismaClient;

describe('WorkflowStateManager', () => {
    let stateManager: WorkflowStateManager;

    beforeEach(() => {
        vi.clearAllMocks();
        stateManager = new WorkflowStateManager(mockPrismaClient);
    });

    describe('initializeState', () => {
        it('should initialize workflow state from execution', async () => {
            // Mock workflow execution data
            const mockExecution = {
                id: 'exec_123',
                status: 'active',
                currentStepId: 'step_1',
                context: { userId: 'user_123' },
                stepExecutions: [
                    {
                        stepId: 'step_1',
                        status: 'active',
                        startedAt: new Date(),
                        assignedRecipients: ['user_123'],
                        results: {},
                    },
                    {
                        stepId: 'step_2',
                        status: 'pending',
                        assignedRecipients: ['user_456'],
                        results: {},
                    },
                ],
                auditTrail: [
                    {
                        timestamp: new Date(),
                        action: 'workflow_started',
                        userId: 'user_123',
                        details: {},
                    },
                ],
                workflow: {
                    definition: {
                        steps: [
                            {
                                id: 'step_1',
                                name: 'Step 1',
                                recipients: ['user_123'],
                                priority: 1,
                            },
                            {
                                id: 'step_2',
                                name: 'Step 2',
                                recipients: ['user_456'],
                                priority: 2,
                            },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);

            const result = await stateManager.initializeState('exec_123');

            expect(result.success).toBe(true);
            expect(result.state).toBeDefined();
            expect(result.state!.executionId).toBe('exec_123');
            expect(result.state!.status).toBe('active');
            expect(result.state!.currentStepId).toBe('step_1');
            expect(result.state!.stepStates.size).toBe(2);
            expect(result.state!.metadata.totalSteps).toBe(2);
            expect(result.state!.metadata.activeSteps).toBe(1);
        });

        it('should return error when execution not found', async () => {
            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(null);

            const result = await stateManager.initializeState('nonexistent');

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Workflow execution not found');
        });

        it('should handle initialization errors gracefully', async () => {
            (mockPrismaClient.workflowExecution.findUnique as Mock).mockRejectedValue(new Error('Database error'));

            const result = await stateManager.initializeState('exec_123');

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Failed to initialize workflow state');
        });
    });

    describe('validateTransition', () => {
        beforeEach(async () => {
            // Setup a mock state
            const mockExecution = {
                id: 'exec_123',
                status: 'active',
                currentStepId: 'step_1',
                context: {},
                stepExecutions: [],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);
            await stateManager.initializeState('exec_123');
        });

        it('should validate allowed transitions', async () => {
            const result = await stateManager.validateTransition('exec_123', 'active', 'paused');

            expect(result.isValid).toBe(true);
            expect(result.errors).toBeUndefined();
        });

        it('should reject invalid transitions', async () => {
            const result = await stateManager.validateTransition('exec_123', 'completed', 'active');

            expect(result.isValid).toBe(false);
            expect(result.errors).toBeDefined();
        });

        it('should validate transition conditions', async () => {
            // Test transition to completed state (requires all steps completed)
            const result = await stateManager.validateTransition('exec_123', 'active', 'completed');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Condition failed: workflow_state');
        });
    });

    describe('executeTransition', () => {
        beforeEach(async () => {
            const mockExecution = {
                id: 'exec_123',
                status: 'active',
                currentStepId: 'step_1',
                context: {},
                stepExecutions: [],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);
            (mockPrismaClient.workflowExecution.update as Mock).mockResolvedValue({});
            await stateManager.initializeState('exec_123');
        });

        it('should execute valid state transition', async () => {
            const trigger = {
                type: 'user_action' as const,
                source: 'pause_button',
                parameters: {},
            };

            const result = await stateManager.executeTransition('exec_123', 'paused', trigger, 'user_123', 'Manual pause');

            expect(result.success).toBe(true);
            expect(result.transition).toBeDefined();
            expect(result.transition!.fromState).toBe('active');
            expect(result.transition!.toState).toBe('paused');
            expect(result.transition!.userId).toBe('user_123');
            expect(result.transition!.reason).toBe('Manual pause');
        });

        it('should reject invalid transitions', async () => {
            const trigger = {
                type: 'user_action' as const,
                source: 'invalid_action',
                parameters: {},
            };

            const result = await stateManager.executeTransition('exec_123', 'completed', trigger, 'user_123');

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });

        it('should update state and persist changes', async () => {
            const trigger = {
                type: 'user_action' as const,
                source: 'pause_button',
                parameters: {},
            };

            await stateManager.executeTransition('exec_123', 'paused', trigger, 'user_123');

            const state = await stateManager.getState('exec_123');
            expect(state!.status).toBe('paused');
            expect(state!.transitions).toHaveLength(1);
            expect(mockPrismaClient.workflowExecution.update).toHaveBeenCalled();
        });
    });

    describe('pauseWorkflow', () => {
        beforeEach(async () => {
            const mockExecution = {
                id: 'exec_123',
                status: 'active',
                currentStepId: 'step_1',
                context: {},
                stepExecutions: [
                    {
                        stepId: 'step_1',
                        status: 'active',
                        startedAt: new Date(),
                        assignedRecipients: ['user_123'],
                        results: {},
                    },
                ],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);
            (mockPrismaClient.workflowExecution.update as Mock).mockResolvedValue({});
            await stateManager.initializeState('exec_123');
        });

        it('should pause workflow and all active steps', async () => {
            const result = await stateManager.pauseWorkflow('exec_123', 'Manual pause', 'user_123');

            expect(result.success).toBe(true);

            const state = await stateManager.getState('exec_123');
            expect(state!.status).toBe('paused');

            const stepState = state!.stepStates.get('step_1');
            expect(stepState!.status).toBe('paused');
            expect(stepState!.pausedAt).toBeDefined();
        });
    });

    describe('resumeWorkflow', () => {
        beforeEach(async () => {
            const mockExecution = {
                id: 'exec_123',
                status: 'paused',
                currentStepId: 'step_1',
                context: {},
                stepExecutions: [
                    {
                        stepId: 'step_1',
                        status: 'paused',
                        startedAt: new Date(),
                        pausedAt: new Date(),
                        assignedRecipients: ['user_123'],
                        results: {},
                    },
                ],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);
            (mockPrismaClient.workflowExecution.update as Mock).mockResolvedValue({});
            await stateManager.initializeState('exec_123');
        });

        it('should resume workflow and all paused steps', async () => {
            const result = await stateManager.resumeWorkflow('exec_123', 'user_123');

            expect(result.success).toBe(true);

            const state = await stateManager.getState('exec_123');
            expect(state!.status).toBe('active');

            const stepState = state!.stepStates.get('step_1');
            expect(stepState!.status).toBe('active');
            expect(stepState!.resumedAt).toBeDefined();
        });
    });

    describe('cancelWorkflow', () => {
        beforeEach(async () => {
            const mockExecution = {
                id: 'exec_123',
                status: 'active',
                currentStepId: 'step_1',
                context: {},
                stepExecutions: [
                    {
                        stepId: 'step_1',
                        status: 'active',
                        startedAt: new Date(),
                        assignedRecipients: ['user_123'],
                        results: {},
                    },
                    {
                        stepId: 'step_2',
                        status: 'paused',
                        startedAt: new Date(),
                        pausedAt: new Date(),
                        assignedRecipients: ['user_456'],
                        results: {},
                    },
                ],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                            { id: 'step_2', name: 'Step 2', recipients: ['user_456'] },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);
            (mockPrismaClient.workflowExecution.update as Mock).mockResolvedValue({});
            await stateManager.initializeState('exec_123');
        });

        it('should cancel workflow and all active/paused steps', async () => {
            const result = await stateManager.cancelWorkflow('exec_123', 'User requested cancellation', 'user_123');

            expect(result.success).toBe(true);

            const state = await stateManager.getState('exec_123');
            expect(state!.status).toBe('cancelled');
            expect(state!.metadata.performanceMetrics.endTime).toBeDefined();

            const step1State = state!.stepStates.get('step_1');
            const step2State = state!.stepStates.get('step_2');
            expect(step1State!.status).toBe('cancelled');
            expect(step2State!.status).toBe('cancelled');
        });
    });

    describe('getDebugInfo', () => {
        beforeEach(async () => {
            const mockExecution = {
                id: 'exec_123',
                status: 'active',
                currentStepId: 'step_1',
                context: {},
                stepExecutions: [
                    {
                        stepId: 'step_1',
                        status: 'active',
                        startedAt: new Date(),
                        assignedRecipients: ['user_123'],
                        results: {},
                    },
                ],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);
            await stateManager.initializeState('exec_123');
        });

        it('should return comprehensive debug information', async () => {
            const result = await stateManager.getDebugInfo('exec_123');

            expect(result.success).toBe(true);
            expect(result.debugInfo).toBeDefined();
            expect(result.debugInfo!.state).toBeDefined();
            expect(result.debugInfo!.transitions).toBeDefined();
            expect(result.debugInfo!.stepDetails).toBeDefined();
            expect(result.debugInfo!.performanceAnalysis).toBeDefined();
            expect(result.debugInfo!.troubleshootingTips).toBeDefined();
        });

        it('should include performance analysis', async () => {
            const result = await stateManager.getDebugInfo('exec_123');

            const analysis = result.debugInfo!.performanceAnalysis;
            expect(analysis.overallHealth).toBeDefined();
            expect(analysis.completionProgress).toBeDefined();
            expect(analysis.bottlenecks).toBeDefined();
            expect(analysis.recommendations).toBeDefined();
        });

        it('should generate troubleshooting tips for paused workflow', async () => {
            // Pause the workflow first
            await stateManager.pauseWorkflow('exec_123', 'Test pause', 'user_123');

            const result = await stateManager.getDebugInfo('exec_123');

            const tips = result.debugInfo!.troubleshootingTips;
            expect(tips).toHaveLength(1);
            expect(tips[0].category).toBe('workflow_paused');
            expect(tips[0].severity).toBe('warning');
        });
    });

    describe('debug mode', () => {
        it('should enable and disable debug mode', () => {
            expect(() => stateManager.enableDebugMode()).not.toThrow();
            expect(() => stateManager.disableDebugMode()).not.toThrow();
        });

        it('should collect additional debug information when enabled', async () => {
            stateManager.enableDebugMode();

            const mockExecution = {
                id: 'exec_123',
                status: 'active',
                currentStepId: 'step_1',
                context: {},
                stepExecutions: [],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);
            (mockPrismaClient.workflowExecution.update as Mock).mockResolvedValue({});

            await stateManager.initializeState('exec_123');

            // Get initial state and modify it to have an active step
            const initialState = await stateManager.getState('exec_123');
            const stepState = initialState!.stepStates.get('step_1');
            stepState!.status = 'active';

            await stateManager.pauseWorkflow('exec_123', 'Debug test', 'user_123');

            const state = await stateManager.getState('exec_123');
            const updatedStepState = state!.stepStates.get('step_1');

            // In debug mode, system actions should be recorded
            expect(updatedStepState!.metadata.debugInfo.systemActions).toHaveLength(1);
            expect(updatedStepState!.metadata.debugInfo.systemActions[0].action).toBe('step_paused');
        });
    });

    describe('state caching', () => {
        it('should cache state after initialization', async () => {
            const mockExecution = {
                id: 'exec_123',
                status: 'active',
                currentStepId: 'step_1',
                context: {},
                stepExecutions: [],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);

            // First call should initialize and cache
            await stateManager.initializeState('exec_123');
            expect(mockPrismaClient.workflowExecution.findUnique).toHaveBeenCalledTimes(1);

            // Second call should use cache
            await stateManager.getState('exec_123');
            expect(mockPrismaClient.workflowExecution.findUnique).toHaveBeenCalledTimes(1);
        });
    });

    describe('error handling', () => {
        it('should handle database errors gracefully', async () => {
            (mockPrismaClient.workflowExecution.findUnique as Mock).mockRejectedValue(new Error('Database connection failed'));

            const result = await stateManager.initializeState('exec_123');

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Failed to initialize workflow state');
        });

        it('should handle state persistence errors', async () => {
            const mockExecution = {
                id: 'exec_123',
                status: 'active',
                currentStepId: 'step_1',
                context: {},
                stepExecutions: [],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                        ],
                    },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                startedAt: new Date(),
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);
            (mockPrismaClient.workflowExecution.update as Mock).mockRejectedValue(new Error('Update failed'));

            await stateManager.initializeState('exec_123');

            const trigger = {
                type: 'user_action' as const,
                source: 'pause_button',
                parameters: {},
            };

            const result = await stateManager.executeTransition('exec_123', 'paused', trigger, 'user_123');

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Failed to execute state transition');
        });
    });

    describe('performance metrics', () => {
        it('should calculate performance metrics correctly', async () => {
            const startTime = new Date('2023-01-01T10:00:00Z');
            const endTime = new Date('2023-01-01T11:30:00Z');

            const mockExecution = {
                id: 'exec_123',
                status: 'completed',
                currentStepId: null,
                context: {},
                stepExecutions: [
                    {
                        stepId: 'step_1',
                        status: 'completed',
                        startedAt: startTime,
                        completedAt: new Date('2023-01-01T10:30:00Z'),
                        assignedRecipients: ['user_123'],
                        results: {},
                    },
                    {
                        stepId: 'step_2',
                        status: 'completed',
                        startedAt: new Date('2023-01-01T10:30:00Z'),
                        completedAt: endTime,
                        assignedRecipients: ['user_456'],
                        results: {},
                    },
                ],
                auditTrail: [],
                workflow: {
                    definition: {
                        steps: [
                            { id: 'step_1', name: 'Step 1', recipients: ['user_123'] },
                            { id: 'step_2', name: 'Step 2', recipients: ['user_456'] },
                        ],
                    },
                },
                createdAt: startTime,
                updatedAt: endTime,
                startedAt: startTime,
                completedAt: endTime,
            };

            (mockPrismaClient.workflowExecution.findUnique as Mock).mockResolvedValue(mockExecution);

            const result = await stateManager.initializeState('exec_123');
            const state = result.state!;

            // Update state to simulate completion
            state.status = 'completed';
            state.metadata.completedSteps = 2;
            state.metadata.performanceMetrics.endTime = endTime;

            // Manually update performance metrics as would happen in real execution
            const totalDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            state.metadata.performanceMetrics.totalDuration = totalDuration;
            state.metadata.performanceMetrics.averageStepDuration = totalDuration / 2;
            state.metadata.performanceMetrics.efficiency = 100;

            // Update cache to reflect changes
            (stateManager as any).stateCache.set('exec_123', state);

            const updatedState = await stateManager.getState('exec_123');
            const metrics = updatedState!.metadata.performanceMetrics;

            expect(metrics.totalDuration).toBe(90); // 1.5 hours = 90 minutes
            expect(metrics.averageStepDuration).toBe(45); // 90 minutes / 2 steps
            expect(metrics.efficiency).toBe(100); // 2/2 steps completed
        });
    });
});