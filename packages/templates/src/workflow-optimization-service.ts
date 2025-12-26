import { pino } from 'pino';
import { PrismaClient } from '@signtusk/database';
import { WorkflowAnalytics } from './advanced-workflow-engine';

const logger = pino({ name: 'workflow-optimization-service' });

export interface OptimizationRecommendation {
    id: string;
    type: 'performance' | 'efficiency' | 'user_experience' | 'compliance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    implementation: string;
    estimatedImprovement: {
        metric: string;
        value: number;
        unit: string;
    };
    confidence: number; // 0-100
}

export interface WorkflowOptimizationReport {
    workflowId: string;
    generatedAt: Date;
    overallScore: number; // 0-100
    recommendations: OptimizationRecommendation[];
    performanceMetrics: {
        current: WorkflowPerformanceMetrics;
        potential: WorkflowPerformanceMetrics;
    };
    benchmarkComparison: BenchmarkComparison;
}

export interface WorkflowPerformanceMetrics {
    completionRate: number;
    averageCompletionTime: number;
    userSatisfactionScore: number;
    errorRate: number;
    escalationRate: number;
    reminderEffectiveness: number;
    slaCompliance: number;
}

export interface BenchmarkComparison {
    industry: string;
    organizationSize: string;
    metrics: {
        [key: string]: {
            current: number;
            benchmark: number;
            percentile: number;
        };
    };
}

export interface AutoOptimizationConfig {
    enabled: boolean;
    autoApplyLowRisk: boolean;
    notificationThreshold: 'low' | 'medium' | 'high';
    optimizationFrequency: 'daily' | 'weekly' | 'monthly';
    excludedOptimizations: string[];
}

export class WorkflowOptimizationService {
    constructor(private db: PrismaClient) { }

    /**
     * Analyze workflow performance and generate optimization recommendations
     */
    async analyzeWorkflow(workflowId: string): Promise<WorkflowOptimizationReport | null> {
        try {
            // Get workflow analytics
            const analytics = await this.getWorkflowAnalytics(workflowId);
            if (!analytics) {
                return null;
            }

            // Generate recommendations
            const recommendations = await this.generateRecommendations(workflowId, analytics);

            // Calculate overall score
            const overallScore = this.calculateOverallScore(analytics);

            // Get benchmark comparison
            const benchmarkComparison = await this.getBenchmarkComparison(workflowId, analytics);

            // Calculate potential improvements
            const potentialMetrics = this.calculatePotentialMetrics(analytics, recommendations);

            const report: WorkflowOptimizationReport = {
                workflowId,
                generatedAt: new Date(),
                overallScore,
                recommendations,
                performanceMetrics: {
                    current: this.extractCurrentMetrics(analytics),
                    potential: potentialMetrics,
                },
                benchmarkComparison,
            };

            logger.info({
                workflowId,
                overallScore,
                recommendationsCount: recommendations.length
            }, 'Workflow analysis completed');

            return report;
        } catch (error) {
            logger.error({ error, workflowId }, 'Failed to analyze workflow');
            return null;
        }
    }

    /**
     * Generate optimization recommendations based on analytics
     */
    private async generateRecommendations(
        workflowId: string,
        analytics: WorkflowAnalytics
    ): Promise<OptimizationRecommendation[]> {
        const recommendations: OptimizationRecommendation[] = [];

        // Performance recommendations
        if (analytics.completionRate < 0.8) {
            recommendations.push({
                id: `perf_completion_${workflowId}`,
                type: 'performance',
                severity: 'high',
                title: 'Low Completion Rate',
                description: `Workflow completion rate is ${(analytics.completionRate * 100).toFixed(1)}%, which is below the recommended 80% threshold.`,
                impact: 'Improving completion rate will increase document processing efficiency and reduce manual follow-up.',
                implementation: 'Review bottleneck steps, simplify approval processes, and implement automated reminders.',
                estimatedImprovement: {
                    metric: 'completion_rate',
                    value: 15,
                    unit: 'percentage_points',
                },
                confidence: 85,
            });
        }

        if (analytics.averageCompletionTime > 1440) { // More than 24 hours
            recommendations.push({
                id: `perf_time_${workflowId}`,
                type: 'performance',
                severity: 'medium',
                title: 'Long Completion Time',
                description: `Average completion time is ${(analytics.averageCompletionTime / 60).toFixed(1)} hours, which may impact user experience.`,
                impact: 'Reducing completion time will improve user satisfaction and business velocity.',
                implementation: 'Optimize approval sequences, implement parallel processing where possible, and set appropriate timeouts.',
                estimatedImprovement: {
                    metric: 'completion_time',
                    value: 30,
                    unit: 'percent_reduction',
                },
                confidence: 75,
            });
        }

        // Bottleneck recommendations
        const bottlenecks = analytics.bottleneckSteps.filter(step => step.completionRate < 0.9);
        for (const bottleneck of bottlenecks) {
            recommendations.push({
                id: `bottleneck_${bottleneck.stepId}`,
                type: 'efficiency',
                severity: 'medium',
                title: `Bottleneck in ${bottleneck.stepName}`,
                description: `Step "${bottleneck.stepName}" has a completion rate of ${(bottleneck.completionRate * 100).toFixed(1)}% and average time of ${bottleneck.averageTime.toFixed(1)} minutes.`,
                impact: 'Resolving this bottleneck will improve overall workflow efficiency.',
                implementation: 'Review step requirements, provide additional training, or implement alternative approval paths.',
                estimatedImprovement: {
                    metric: 'step_completion_rate',
                    value: 10,
                    unit: 'percentage_points',
                },
                confidence: 70,
            });
        }

        // Escalation recommendations
        if (analytics.escalationFrequency > 0.2) {
            recommendations.push({
                id: `escalation_${workflowId}`,
                type: 'efficiency',
                severity: 'medium',
                title: 'High Escalation Rate',
                description: `Escalation frequency is ${(analytics.escalationFrequency * 100).toFixed(1)}%, indicating potential issues with initial assignments.`,
                impact: 'Reducing escalations will decrease administrative overhead and improve user experience.',
                implementation: 'Review initial approver assignments, implement better delegation rules, and provide clearer instructions.',
                estimatedImprovement: {
                    metric: 'escalation_rate',
                    value: 50,
                    unit: 'percent_reduction',
                },
                confidence: 80,
            });
        }

        // Reminder effectiveness recommendations
        if (analytics.reminderEffectiveness < 0.6) {
            recommendations.push({
                id: `reminders_${workflowId}`,
                type: 'user_experience',
                severity: 'low',
                title: 'Low Reminder Effectiveness',
                description: `Reminder effectiveness is ${(analytics.reminderEffectiveness * 100).toFixed(1)}%, suggesting reminders may not be optimally timed or formatted.`,
                impact: 'Improving reminder effectiveness will reduce the need for manual follow-up.',
                implementation: 'Optimize reminder timing, personalize reminder content, and use multiple communication channels.',
                estimatedImprovement: {
                    metric: 'reminder_effectiveness',
                    value: 25,
                    unit: 'percentage_points',
                },
                confidence: 65,
            });
        }

        // SLA compliance recommendations
        if (analytics.performanceMetrics.slaCompliance < 0.95) {
            recommendations.push({
                id: `sla_${workflowId}`,
                type: 'compliance',
                severity: 'high',
                title: 'SLA Compliance Issues',
                description: `SLA compliance is ${(analytics.performanceMetrics.slaCompliance * 100).toFixed(1)}%, below the recommended 95% threshold.`,
                impact: 'Improving SLA compliance will reduce business risk and improve customer satisfaction.',
                implementation: 'Review SLA definitions, implement proactive monitoring, and optimize critical path steps.',
                estimatedImprovement: {
                    metric: 'sla_compliance',
                    value: 10,
                    unit: 'percentage_points',
                },
                confidence: 90,
            });
        }

        return recommendations;
    }

    /**
     * Calculate overall workflow performance score
     */
    private calculateOverallScore(analytics: WorkflowAnalytics): number {
        const weights = {
            completionRate: 0.3,
            averageCompletionTime: 0.2,
            escalationFrequency: 0.15,
            reminderEffectiveness: 0.1,
            slaCompliance: 0.25,
        };

        // Normalize metrics to 0-100 scale
        const normalizedCompletionRate = analytics.completionRate * 100;
        const normalizedCompletionTime = Math.max(0, 100 - (analytics.averageCompletionTime / 1440) * 100); // Penalize long times
        const normalizedEscalationFrequency = Math.max(0, 100 - (analytics.escalationFrequency * 200)); // Penalize high escalations
        const normalizedReminderEffectiveness = analytics.reminderEffectiveness * 100;
        const normalizedSlaCompliance = analytics.performanceMetrics.slaCompliance * 100;

        const score =
            normalizedCompletionRate * weights.completionRate +
            normalizedCompletionTime * weights.averageCompletionTime +
            normalizedEscalationFrequency * weights.escalationFrequency +
            normalizedReminderEffectiveness * weights.reminderEffectiveness +
            normalizedSlaCompliance * weights.slaCompliance;

        return Math.round(Math.max(0, Math.min(100, score)));
    }

    /**
     * Get benchmark comparison data
     */
    private async getBenchmarkComparison(
        workflowId: string,
        analytics: WorkflowAnalytics
    ): Promise<BenchmarkComparison> {
        // In a real implementation, this would fetch industry benchmarks
        // For now, we'll use simulated benchmark data
        return {
            industry: 'Document Management',
            organizationSize: 'Medium (100-1000 employees)',
            metrics: {
                completionRate: {
                    current: analytics.completionRate,
                    benchmark: 0.85,
                    percentile: analytics.completionRate > 0.85 ? 75 : 25,
                },
                averageCompletionTime: {
                    current: analytics.averageCompletionTime,
                    benchmark: 720, // 12 hours
                    percentile: analytics.averageCompletionTime < 720 ? 75 : 25,
                },
                escalationRate: {
                    current: analytics.escalationFrequency,
                    benchmark: 0.15,
                    percentile: analytics.escalationFrequency < 0.15 ? 75 : 25,
                },
                slaCompliance: {
                    current: analytics.performanceMetrics.slaCompliance,
                    benchmark: 0.95,
                    percentile: analytics.performanceMetrics.slaCompliance > 0.95 ? 75 : 25,
                },
            },
        };
    }

    /**
     * Calculate potential performance metrics after implementing recommendations
     */
    private calculatePotentialMetrics(
        analytics: WorkflowAnalytics,
        recommendations: OptimizationRecommendation[]
    ): WorkflowPerformanceMetrics {
        let potentialCompletionRate = analytics.completionRate;
        let potentialCompletionTime = analytics.averageCompletionTime;
        let potentialEscalationRate = analytics.escalationFrequency;
        let potentialReminderEffectiveness = analytics.reminderEffectiveness;
        let potentialSlaCompliance = analytics.performanceMetrics.slaCompliance;

        // Apply improvements from recommendations
        for (const rec of recommendations) {
            const improvement = rec.estimatedImprovement;
            const confidenceFactor = rec.confidence / 100;

            switch (improvement.metric) {
                case 'completion_rate':
                    potentialCompletionRate = Math.min(1, potentialCompletionRate + (improvement.value / 100) * confidenceFactor);
                    break;
                case 'completion_time':
                    if (improvement.unit === 'percent_reduction') {
                        potentialCompletionTime = potentialCompletionTime * (1 - (improvement.value / 100) * confidenceFactor);
                    }
                    break;
                case 'escalation_rate':
                    if (improvement.unit === 'percent_reduction') {
                        potentialEscalationRate = potentialEscalationRate * (1 - (improvement.value / 100) * confidenceFactor);
                    }
                    break;
                case 'reminder_effectiveness':
                    potentialReminderEffectiveness = Math.min(1, potentialReminderEffectiveness + (improvement.value / 100) * confidenceFactor);
                    break;
                case 'sla_compliance':
                    potentialSlaCompliance = Math.min(1, potentialSlaCompliance + (improvement.value / 100) * confidenceFactor);
                    break;
            }
        }

        return {
            completionRate: potentialCompletionRate,
            averageCompletionTime: potentialCompletionTime,
            userSatisfactionScore: 0.8, // Estimated
            errorRate: analytics.performanceMetrics.errorRate * 0.8, // Assume 20% reduction
            escalationRate: potentialEscalationRate,
            reminderEffectiveness: potentialReminderEffectiveness,
            slaCompliance: potentialSlaCompliance,
        };
    }

    /**
     * Extract current performance metrics from analytics
     */
    private extractCurrentMetrics(analytics: WorkflowAnalytics): WorkflowPerformanceMetrics {
        return {
            completionRate: analytics.completionRate,
            averageCompletionTime: analytics.averageCompletionTime,
            userSatisfactionScore: 0.7, // Estimated based on performance
            errorRate: analytics.performanceMetrics.errorRate,
            escalationRate: analytics.escalationFrequency,
            reminderEffectiveness: analytics.reminderEffectiveness,
            slaCompliance: analytics.performanceMetrics.slaCompliance,
        };
    }

    /**
     * Get workflow analytics (placeholder - would use AdvancedWorkflowEngine)
     */
    private async getWorkflowAnalytics(workflowId: string): Promise<WorkflowAnalytics | null> {
        // This would typically call the AdvancedWorkflowEngine.getWorkflowAnalytics method
        // For now, return mock data
        return {
            workflowId,
            executionCount: 100,
            completionRate: 0.75,
            averageCompletionTime: 1800, // 30 hours
            bottleneckSteps: [
                {
                    stepId: 'step_1',
                    stepName: 'Initial Review',
                    averageTime: 720,
                    completionRate: 0.85,
                },
                {
                    stepId: 'step_2',
                    stepName: 'Manager Approval',
                    averageTime: 1080,
                    completionRate: 0.70,
                },
            ],
            escalationFrequency: 0.25,
            reminderEffectiveness: 0.55,
            performanceMetrics: {
                throughput: 2.5,
                errorRate: 0.05,
                slaCompliance: 0.88,
            },
        };
    }

    /**
     * Apply auto-optimization based on configuration
     */
    async applyAutoOptimization(
        workflowId: string,
        config: AutoOptimizationConfig
    ): Promise<{ success: boolean; appliedOptimizations?: string[]; errors?: string[] }> {
        try {
            if (!config.enabled) {
                return {
                    success: false,
                    errors: ['Auto-optimization is disabled'],
                };
            }

            const report = await this.analyzeWorkflow(workflowId);
            if (!report) {
                return {
                    success: false,
                    errors: ['Failed to generate optimization report'],
                };
            }

            const appliedOptimizations: string[] = [];

            // Apply low-risk optimizations automatically if configured
            if (config.autoApplyLowRisk) {
                const lowRiskRecommendations = report.recommendations.filter(
                    rec => rec.severity === 'low' && !config.excludedOptimizations.includes(rec.id)
                );

                for (const rec of lowRiskRecommendations) {
                    // Apply the optimization (implementation would depend on the specific recommendation)
                    await this.applyOptimization(workflowId, rec);
                    appliedOptimizations.push(rec.id);
                }
            }

            // Send notifications for higher-risk optimizations
            const notificationRecommendations = report.recommendations.filter(
                rec => this.shouldNotify(rec.severity, config.notificationThreshold)
            );

            if (notificationRecommendations.length > 0) {
                await this.sendOptimizationNotifications(workflowId, notificationRecommendations);
            }

            logger.info({
                workflowId,
                appliedCount: appliedOptimizations.length,
                notificationCount: notificationRecommendations.length
            }, 'Auto-optimization completed');

            return {
                success: true,
                appliedOptimizations,
            };
        } catch (error) {
            logger.error({ error, workflowId }, 'Failed to apply auto-optimization');
            return {
                success: false,
                errors: ['Failed to apply auto-optimization'],
            };
        }
    }

    /**
     * Apply a specific optimization recommendation
     */
    private async applyOptimization(workflowId: string, recommendation: OptimizationRecommendation): Promise<void> {
        // Implementation would depend on the specific recommendation type
        // This is a placeholder for the actual optimization logic
        logger.info({
            workflowId,
            recommendationId: recommendation.id,
            type: recommendation.type
        }, 'Applied optimization');
    }

    /**
     * Determine if notification should be sent based on severity and threshold
     */
    private shouldNotify(severity: string, threshold: string): boolean {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        const thresholdLevels = { low: 1, medium: 2, high: 3 };

        return severityLevels[severity as keyof typeof severityLevels] >=
            thresholdLevels[threshold as keyof typeof thresholdLevels];
    }

    /**
     * Send optimization notifications
     */
    private async sendOptimizationNotifications(
        workflowId: string,
        recommendations: OptimizationRecommendation[]
    ): Promise<void> {
        // Implementation for sending notifications
        logger.info({
            workflowId,
            recommendationsCount: recommendations.length
        }, 'Optimization notifications sent');
    }
}