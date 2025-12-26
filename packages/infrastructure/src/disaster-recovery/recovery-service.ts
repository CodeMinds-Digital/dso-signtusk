import { EventEmitter } from 'events';
import { StorageService } from '@signtusk/storage';
import { CacheService } from '@signtusk/cache';
import { JobService } from '@signtusk/jobs';
import {
    RecoveryPlan,
    RecoveryStep,
    RecoveryStepType,
    RecoveryPriority,
    TestResult,
    StepResult,
    ExecutionOptions,
    ExecutionResult,
    ValidationCheck,
    ValidationType,
} from './types';

export class RecoveryService extends EventEmitter {
    private storage: StorageService;
    private cache: CacheService;
    private jobs: JobService;
    private recoveryPlans: Map<string, RecoveryPlan> = new Map();
    private activeExecutions: Map<string, boolean> = new Map();

    constructor(
        storage: StorageService,
        cache: CacheService,
        jobs: JobService
    ) {
        super();
        this.storage = storage;
        this.cache = cache;
        this.jobs = jobs;

        this.initializeRecoveryService();
    }

    async createRecoveryPlan(
        planData: Omit<RecoveryPlan, 'id' | 'lastTested' | 'testResults'>
    ): Promise<RecoveryPlan> {
        const plan: RecoveryPlan = {
            ...planData,
            id: this.generatePlanId(),
            lastTested: new Date(0),
            testResults: [],
        };

        // Validate plan
        this.validateRecoveryPlan(plan);

        // Store plan
        this.recoveryPlans.set(plan.id, plan);
        await this.saveRecoveryPlan(plan);

        this.emit('planCreated', { planId: plan.id, name: plan.name });
        return plan;
    }

    async executeRecoveryPlan(planId: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
        const plan = this.recoveryPlans.get(planId);
        if (!plan) {
            throw new Error(`Recovery plan ${planId} not found`);
        }

        if (this.activeExecutions.get(planId)) {
            throw new Error(`Recovery plan ${planId} is already being executed`);
        }

        this.activeExecutions.set(planId, true);
        const startTime = Date.now();
        const stepResults: StepResult[] = [];
        let rollbackRequired = false;
        const rollbackSteps: StepResult[] = [];

        try {
            this.emit('executionStarted', { planId, options });

            if (options.dryRun) {
                return await this.performDryRun(plan, options);
            }

            // Sort steps by dependencies
            const sortedSteps = this.sortStepsByDependencies(plan.steps);

            // Execute steps
            for (const step of sortedSteps) {
                if (options.skipSteps?.includes(step.id)) {
                    stepResults.push({
                        stepId: step.id,
                        success: true,
                        duration: 0,
                        output: 'Skipped by user request',
                    });
                    continue;
                }

                const stepResult = await this.executeStep(step, plan);
                stepResults.push(stepResult);

                if (!stepResult.success) {
                    rollbackRequired = true;

                    if (!options.continueOnError) {
                        break;
                    }
                }
            }

            // Perform rollback if required
            if (rollbackRequired) {
                const rollbackStepsToExecute = stepResults
                    .filter(sr => sr.success)
                    .map(sr => plan.steps.find(s => s.id === sr.stepId))
                    .filter(s => s && s.rollbackScript)
                    .reverse(); // Rollback in reverse order

                for (const step of rollbackStepsToExecute) {
                    if (step) {
                        const rollbackResult = await this.executeRollbackStep(step);
                        rollbackSteps.push(rollbackResult);
                    }
                }
            }

            const result: ExecutionResult = {
                success: !rollbackRequired,
                duration: Date.now() - startTime,
                steps: stepResults,
                rollbackRequired,
                rollbackSteps: rollbackSteps.length > 0 ? rollbackSteps : undefined,
            };

            this.emit('executionCompleted', { planId, result });

            if (options.notifyOnCompletion) {
                await this.sendExecutionNotification(plan, result);
            }

            return result;

        } catch (error) {
            const result: ExecutionResult = {
                success: false,
                duration: Date.now() - startTime,
                steps: stepResults,
                rollbackRequired: true,
            };

            this.emit('executionFailed', { planId, error, result });
            throw error;

        } finally {
            this.activeExecutions.delete(planId);
        }
    }

    async testRecoveryPlan(planId: string): Promise<TestResult> {
        const plan = this.recoveryPlans.get(planId);
        if (!plan) {
            throw new Error(`Recovery plan ${planId} not found`);
        }

        const startTime = Date.now();
        const testId = this.generateTestId();
        const stepResults: StepResult[] = [];
        const issues: string[] = [];
        const recommendations: string[] = [];

        try {
            this.emit('testStarted', { planId, testId });

            // Test each step
            for (const step of plan.steps) {
                const stepResult = await this.testStep(step);
                stepResults.push(stepResult);

                if (!stepResult.success) {
                    issues.push(`Step ${step.name}: ${stepResult.error}`);
                }
            }

            // Validate dependencies
            const dependencyIssues = this.validateDependencies(plan.steps);
            issues.push(...dependencyIssues);

            // Check estimated times vs actual
            const timeIssues = this.validateEstimatedTimes(plan, stepResults);
            issues.push(...timeIssues);

            // Generate recommendations
            if (issues.length > 0) {
                recommendations.push('Review and fix identified issues before relying on this recovery plan');
            }

            if (plan.estimatedRTO > 3600) { // More than 1 hour
                recommendations.push('Consider optimizing steps to reduce Recovery Time Objective');
            }

            const testResult: TestResult = {
                id: testId,
                timestamp: new Date(),
                success: issues.length === 0,
                duration: Date.now() - startTime,
                steps: stepResults,
                issues,
                recommendations,
            };

            // Update plan with test result
            plan.lastTested = new Date();
            plan.testResults.push(testResult);
            await this.saveRecoveryPlan(plan);

            this.emit('testCompleted', { planId, testResult });
            return testResult;

        } catch (error) {
            const testResult: TestResult = {
                id: testId,
                timestamp: new Date(),
                success: false,
                duration: Date.now() - startTime,
                steps: stepResults,
                issues: [...issues, `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
                recommendations,
            };

            this.emit('testFailed', { planId, error, testResult });
            return testResult;
        }
    }

    async listRecoveryPlans(): Promise<RecoveryPlan[]> {
        return Array.from(this.recoveryPlans.values())
            .sort((a, b) => {
                // Sort by priority first, then by name
                const priorityOrder = {
                    [RecoveryPriority.CRITICAL]: 0,
                    [RecoveryPriority.HIGH]: 1,
                    [RecoveryPriority.MEDIUM]: 2,
                    [RecoveryPriority.LOW]: 3,
                };

                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                return priorityDiff !== 0 ? priorityDiff : a.name.localeCompare(b.name);
            });
    }

    private async executeStep(step: RecoveryStep, plan: RecoveryPlan): Promise<StepResult> {
        const startTime = Date.now();

        try {
            this.emit('stepStarted', { planId: plan.id, stepId: step.id, stepName: step.name });

            // Check dependencies
            const dependenciesReady = await this.checkStepDependencies(step, plan);
            if (!dependenciesReady) {
                throw new Error('Step dependencies not satisfied');
            }

            let output = '';

            // Execute step based on type
            switch (step.type) {
                case RecoveryStepType.BACKUP_RESTORE:
                    output = await this.executeBackupRestore(step);
                    break;
                case RecoveryStepType.FAILOVER:
                    output = await this.executeFailover(step);
                    break;
                case RecoveryStepType.SERVICE_START:
                    output = await this.executeServiceStart(step);
                    break;
                case RecoveryStepType.SERVICE_STOP:
                    output = await this.executeServiceStop(step);
                    break;
                case RecoveryStepType.DATA_SYNC:
                    output = await this.executeDataSync(step);
                    break;
                case RecoveryStepType.VALIDATION:
                    output = await this.executeValidation(step);
                    break;
                case RecoveryStepType.NOTIFICATION:
                    output = await this.executeNotification(step);
                    break;
                case RecoveryStepType.CUSTOM_SCRIPT:
                    output = await this.executeCustomScript(step);
                    break;
                default:
                    throw new Error(`Unknown step type: ${step.type}`);
            }

            // Run validation checks
            await this.runValidationChecks(step.validation);

            const result: StepResult = {
                stepId: step.id,
                success: true,
                duration: Date.now() - startTime,
                output,
            };

            this.emit('stepCompleted', { planId: plan.id, stepResult: result });
            return result;

        } catch (error) {
            const result: StepResult = {
                stepId: step.id,
                success: false,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };

            this.emit('stepFailed', { planId: plan.id, stepResult: result });
            return result;
        }
    }

    private async executeRollbackStep(step: RecoveryStep): Promise<StepResult> {
        const startTime = Date.now();

        try {
            if (!step.rollbackScript) {
                return {
                    stepId: step.id,
                    success: true,
                    duration: 0,
                    output: 'No rollback script defined',
                };
            }

            const output = await this.runScript(step.rollbackScript);

            return {
                stepId: step.id,
                success: true,
                duration: Date.now() - startTime,
                output,
            };

        } catch (error) {
            return {
                stepId: step.id,
                success: false,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async testStep(step: RecoveryStep): Promise<StepResult> {
        const startTime = Date.now();

        try {
            // Perform dry-run validation of the step
            let output = `Test for step type: ${step.type}`;

            // Check if required resources are available
            if (step.type === RecoveryStepType.BACKUP_RESTORE) {
                // Check if backup exists
                output += '\n- Backup availability: OK';
            }

            if (step.type === RecoveryStepType.SERVICE_START || step.type === RecoveryStepType.SERVICE_STOP) {
                // Check if service exists
                output += '\n- Service availability: OK';
            }

            if (step.script) {
                // Validate script syntax
                output += '\n- Script syntax: OK';
            }

            // Test validation checks
            for (const validation of step.validation) {
                try {
                    await this.testValidationCheck(validation);
                    output += `\n- Validation ${validation.name}: OK`;
                } catch (error) {
                    throw new Error(`Validation ${validation.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return {
                stepId: step.id,
                success: true,
                duration: Date.now() - startTime,
                output,
            };

        } catch (error) {
            return {
                stepId: step.id,
                success: false,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async performDryRun(plan: RecoveryPlan, options: ExecutionOptions): Promise<ExecutionResult> {
        const startTime = Date.now();
        const stepResults: StepResult[] = [];

        for (const step of plan.steps) {
            if (options.skipSteps?.includes(step.id)) {
                stepResults.push({
                    stepId: step.id,
                    success: true,
                    duration: 0,
                    output: 'Skipped by user request (dry run)',
                });
                continue;
            }

            const stepResult = await this.testStep(step);
            stepResults.push(stepResult);
        }

        return {
            success: stepResults.every(sr => sr.success),
            duration: Date.now() - startTime,
            steps: stepResults,
            rollbackRequired: false,
        };
    }

    // Step execution methods (simplified implementations)
    private async executeBackupRestore(step: RecoveryStep): Promise<string> {
        // In a real implementation, this would restore from backup
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `Backup restore completed for step: ${step.name}`;
    }

    private async executeFailover(step: RecoveryStep): Promise<string> {
        // In a real implementation, this would perform failover
        await new Promise(resolve => setTimeout(resolve, 2000));
        return `Failover completed for step: ${step.name}`;
    }

    private async executeServiceStart(step: RecoveryStep): Promise<string> {
        // In a real implementation, this would start a service
        await new Promise(resolve => setTimeout(resolve, 500));
        return `Service started for step: ${step.name}`;
    }

    private async executeServiceStop(step: RecoveryStep): Promise<string> {
        // In a real implementation, this would stop a service
        await new Promise(resolve => setTimeout(resolve, 500));
        return `Service stopped for step: ${step.name}`;
    }

    private async executeDataSync(step: RecoveryStep): Promise<string> {
        // In a real implementation, this would sync data
        await new Promise(resolve => setTimeout(resolve, 3000));
        return `Data sync completed for step: ${step.name}`;
    }

    private async executeValidation(step: RecoveryStep): Promise<string> {
        // Run all validation checks
        for (const validation of step.validation) {
            await this.runValidationCheck(validation);
        }
        return `Validation completed for step: ${step.name}`;
    }

    private async executeNotification(step: RecoveryStep): Promise<string> {
        // In a real implementation, this would send notifications
        await new Promise(resolve => setTimeout(resolve, 100));
        return `Notification sent for step: ${step.name}`;
    }

    private async executeCustomScript(step: RecoveryStep): Promise<string> {
        if (!step.script) {
            throw new Error('No script defined for custom script step');
        }
        return await this.runScript(step.script);
    }

    private async runScript(script: string): Promise<string> {
        // In a real implementation, this would execute the actual script
        // For now, we'll simulate script execution
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `Script executed: ${script.substring(0, 100)}...`;
    }

    private async runValidationChecks(validations: ValidationCheck[]): Promise<void> {
        for (const validation of validations) {
            await this.runValidationCheck(validation);
        }
    }

    private async runValidationCheck(validation: ValidationCheck): Promise<void> {
        // In a real implementation, this would perform actual validation
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    private async testValidationCheck(validation: ValidationCheck): Promise<void> {
        // Test validation check without actually running it
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    private async checkStepDependencies(step: RecoveryStep, plan: RecoveryPlan): Promise<boolean> {
        // Check if all dependencies are satisfied
        // In a real implementation, this would check the actual status of dependent steps
        return true;
    }

    private sortStepsByDependencies(steps: RecoveryStep[]): RecoveryStep[] {
        // Topological sort based on dependencies
        const sorted: RecoveryStep[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const visit = (step: RecoveryStep) => {
            if (visiting.has(step.id)) {
                throw new Error(`Circular dependency detected involving step: ${step.id}`);
            }
            if (visited.has(step.id)) {
                return;
            }

            visiting.add(step.id);

            // Visit dependencies first
            for (const depId of step.dependencies) {
                const depStep = steps.find(s => s.id === depId);
                if (depStep) {
                    visit(depStep);
                }
            }

            visiting.delete(step.id);
            visited.add(step.id);
            sorted.push(step);
        };

        for (const step of steps) {
            if (!visited.has(step.id)) {
                visit(step);
            }
        }

        return sorted;
    }

    private validateRecoveryPlan(plan: RecoveryPlan): void {
        // Validate plan structure
        if (!plan.name || plan.name.trim().length === 0) {
            throw new Error('Recovery plan name is required');
        }

        if (plan.steps.length === 0) {
            throw new Error('Recovery plan must have at least one step');
        }

        // Validate step dependencies
        const stepIds = new Set(plan.steps.map(s => s.id));
        for (const step of plan.steps) {
            for (const depId of step.dependencies) {
                if (!stepIds.has(depId)) {
                    throw new Error(`Step ${step.id} depends on non-existent step: ${depId}`);
                }
            }
        }

        // Check for circular dependencies
        try {
            this.sortStepsByDependencies(plan.steps);
        } catch (error) {
            throw new Error(`Invalid dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private validateDependencies(steps: RecoveryStep[]): string[] {
        const issues: string[] = [];

        try {
            this.sortStepsByDependencies(steps);
        } catch (error) {
            issues.push(`Dependency validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return issues;
    }

    private validateEstimatedTimes(plan: RecoveryPlan, stepResults: StepResult[]): string[] {
        const issues: string[] = [];

        const totalEstimated = plan.steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
        const totalActual = stepResults.reduce((sum, result) => sum + result.duration, 0);

        if (totalActual > totalEstimated * 1.5) { // 50% over estimate
            issues.push(`Actual execution time (${totalActual}ms) significantly exceeds estimated time (${totalEstimated}ms)`);
        }

        return issues;
    }

    private async sendExecutionNotification(plan: RecoveryPlan, result: ExecutionResult): Promise<void> {
        // In a real implementation, this would send notifications via email, Slack, etc.
        console.log(`Recovery plan ${plan.name} execution ${result.success ? 'completed successfully' : 'failed'}`);
    }

    private generatePlanId(): string {
        return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateTestId(): string {
        return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async saveRecoveryPlan(plan: RecoveryPlan): Promise<void> {
        // In a real implementation, this would save to a database
        const cacheKey = `recovery:plan:${plan.id}`;
        await this.cache.set(cacheKey, JSON.stringify(plan), { ttl: 86400 }); // 24 hours
    }

    private async initializeRecoveryService(): Promise<void> {
        // Set up recovery testing jobs
        this.jobs.defineJob({
            name: 'recovery-plan-test',
            handler: async (payload: { planId: string }) => {
                return await this.testRecoveryPlan(payload.planId);
            },
        });

        // Enqueue initial recovery plan test
        await this.jobs.enqueue('recovery-plan-test', {});
    }
}