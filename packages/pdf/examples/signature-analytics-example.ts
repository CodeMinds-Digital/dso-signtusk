/**
 * Signature Analytics Engine Example
 * 
 * This example demonstrates how to use the Signature Analytics Engine to:
 * - Track signature events and workflow events
 * - Calculate completion rate metrics
 * - Identify performance bottlenecks
 * - Generate optimization recommendations
 * - Create analytics dashboards
 */

import { PrismaClient } from '@prisma/client';
import { SignatureAnalyticsEngine } from '../src/signature-analytics-engine';
import type {
    SignatureEvent,
    SignatureWorkflowEvent,
    SignatureCompletionMetrics,
    SignaturePerformanceMetrics,
    SignatureAnalyticsDashboard
} from '../src/signature-analytics-engine';

async function demonstrateSignatureAnalytics() {
    // Initialize the analytics engine with a database connection
    const db = new PrismaClient();
    const analyticsEngine = new SignatureAnalyticsEngine(db);

    console.log('🔍 Signature Analytics Engine Demo\n');

    // ============================================================================
    // 1. TRACKING SIGNATURE EVENTS
    // ============================================================================
    console.log('📊 1. Tracking Signature Events');
    console.log('================================\n');

    const documentId = 'doc-12345';
    const sessionId = 'session-67890';
    const userId = 'user-abc123';

    // Track signature start event
    const signatureStartEvent: SignatureEvent = {
        documentId,
        userId,
        sessionId,
        eventType: 'signature_start',
        fieldId: 'signature-field-1',
        fieldType: 'drawn',
        metadata: {
            page: 1,
            fieldPosition: { x: 100, y: 200 },
            deviceType: 'desktop',
        },
        timestamp: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    await analyticsEngine.trackSignatureEvent(signatureStartEvent);
    console.log('✅ Tracked signature start event');

    // Track signature progress event
    const signatureProgressEvent: SignatureEvent = {
        documentId,
        userId,
        sessionId,
        eventType: 'signature_progress',
        fieldId: 'signature-field-1',
        fieldType: 'drawn',
        metadata: {
            progress: 0.5,
            strokeCount: 3,
        },
        timestamp: new Date(Date.now() + 30000), // 30 seconds later
    };

    await analyticsEngine.trackSignatureEvent(signatureProgressEvent);
    console.log('✅ Tracked signature progress event');

    // Track signature completion event
    const signatureCompleteEvent: SignatureEvent = {
        documentId,
        userId,
        sessionId,
        eventType: 'signature_complete',
        fieldId: 'signature-field-1',
        fieldType: 'drawn',
        metadata: {
            completionTime: 120, // 2 minutes
            strokeCount: 8,
            qualityScore: 0.85,
        },
        timestamp: new Date(Date.now() + 120000), // 2 minutes later
    };

    await analyticsEngine.trackSignatureEvent(signatureCompleteEvent);
    console.log('✅ Tracked signature completion event\n');

    // ============================================================================
    // 2. TRACKING WORKFLOW EVENTS
    // ============================================================================
    console.log('🔄 2. Tracking Workflow Events');
    console.log('===============================\n');

    const workflowId = 'workflow-xyz789';
    const recipientId = 'recipient-def456';

    // Track workflow start
    const workflowStartEvent: SignatureWorkflowEvent = {
        workflowId,
        documentId,
        recipientId,
        eventType: 'workflow_start',
        metadata: {
            initiatedBy: userId,
            totalRecipients: 3,
            expectedDuration: 7200, // 2 hours
        },
        timestamp: new Date(),
    };

    await analyticsEngine.trackWorkflowEvent(workflowStartEvent);
    console.log('✅ Tracked workflow start event');

    // Track recipient notification
    const recipientNotifiedEvent: SignatureWorkflowEvent = {
        workflowId,
        documentId,
        recipientId,
        eventType: 'recipient_notified',
        metadata: {
            notificationMethod: 'email',
            recipientEmail: 'recipient@example.com',
        },
        timestamp: new Date(Date.now() + 5000), // 5 seconds later
    };

    await analyticsEngine.trackWorkflowEvent(recipientNotifiedEvent);
    console.log('✅ Tracked recipient notification event\n');

    // ============================================================================
    // 3. CALCULATING COMPLETION METRICS
    // ============================================================================
    console.log('📈 3. Calculating Completion Metrics');
    console.log('=====================================\n');

    try {
        const completionMetrics = await analyticsEngine.getSignatureCompletionMetrics(
            documentId,
            new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            new Date()
        );

        console.log('📊 Signature Completion Metrics:');
        console.log(`   Total Signature Requests: ${completionMetrics.totalSignatureRequests}`);
        console.log(`   Completed Signatures: ${completionMetrics.completedSignatures}`);
        console.log(`   Completion Rate: ${completionMetrics.completionRate.toFixed(2)}%`);
        console.log(`   Average Time to Sign: ${completionMetrics.averageTimeToSign.toFixed(2)} seconds`);
        console.log(`   Median Time to Sign: ${completionMetrics.medianTimeToSign.toFixed(2)} seconds`);
        console.log(`   Abandonment Rate: ${completionMetrics.abandonmentRate.toFixed(2)}%`);

        console.log('\n📋 Completions by Method:');
        completionMetrics.completionsByMethod.forEach(method => {
            console.log(`   ${method.method}: ${method.count} completions (avg: ${method.averageTime.toFixed(2)}s)`);
        });

        console.log('\n📅 Completion Trends:');
        completionMetrics.completionTrends.slice(0, 3).forEach(trend => {
            console.log(`   ${trend.date}: ${trend.completions}/${trend.requests} (${trend.rate.toFixed(2)}%)`);
        });
    } catch (error) {
        console.log('ℹ️  No completion metrics available yet (database not populated)');
    }

    console.log();

    // ============================================================================
    // 4. ANALYZING PERFORMANCE METRICS
    // ============================================================================
    console.log('⚡ 4. Analyzing Performance Metrics');
    console.log('===================================\n');

    try {
        const performanceMetrics = await analyticsEngine.getSignaturePerformanceMetrics(
            documentId,
            new Date(Date.now() - 24 * 60 * 60 * 1000),
            new Date()
        );

        console.log('🚨 Identified Bottlenecks:');
        if (performanceMetrics.bottlenecks.length === 0) {
            console.log('   No bottlenecks identified');
        } else {
            performanceMetrics.bottlenecks.forEach((bottleneck, index) => {
                console.log(`   ${index + 1}. ${bottleneck.type} (${bottleneck.severity})`);
                console.log(`      ${bottleneck.description}`);
                console.log(`      Impact: ${bottleneck.impact}`);
                console.log(`      Recommendations: ${bottleneck.recommendations.slice(0, 2).join(', ')}`);
            });
        }

        console.log('\n📊 Field Performance:');
        if (performanceMetrics.fieldPerformance.length === 0) {
            console.log('   No field performance data available');
        } else {
            performanceMetrics.fieldPerformance.slice(0, 3).forEach(field => {
                console.log(`   ${field.fieldName} (${field.fieldType}):`);
                console.log(`     Completion Rate: ${field.completionRate.toFixed(2)}%`);
                console.log(`     Avg Time: ${field.averageTimeToComplete.toFixed(2)}s`);
                console.log(`     Abandonment Rate: ${field.abandonmentRate.toFixed(2)}%`);
            });
        }

        console.log('\n👤 User Behavior Insights:');
        const insights = performanceMetrics.userBehaviorInsights;
        console.log(`   Most Common Method: ${insights.mostCommonSignatureMethod}`);
        console.log(`   Avg Fields per Document: ${insights.averageFieldsPerDocument.toFixed(2)}`);
        console.log(`   Peak Signing Hours: ${insights.peakSigningHours.join(', ')}`);
        console.log('   Device Usage:');
        insights.deviceUsage.forEach(device => {
            console.log(`     ${device.deviceType}: ${device.percentage}% (${device.completionRate}% completion)`);
        });
    } catch (error) {
        console.log('ℹ️  No performance metrics available yet (database not populated)');
    }

    console.log();

    // ============================================================================
    // 5. GENERATING OPTIMIZATION RECOMMENDATIONS
    // ============================================================================
    console.log('💡 5. Generating Optimization Recommendations');
    console.log('==============================================\n');

    try {
        const recommendations = await analyticsEngine.generateOptimizationRecommendations(
            documentId,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            new Date()
        );

        if (recommendations.length === 0) {
            console.log('✅ No optimization recommendations - performance is good!');
        } else {
            recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.title} (${rec.priority} priority)`);
                console.log(`   Type: ${rec.type}`);
                console.log(`   Description: ${rec.description}`);
                console.log(`   Impact: ${rec.impact}`);
                console.log(`   Estimated Improvement: ${rec.estimatedImprovement.improvement} in ${rec.estimatedImprovement.metric}`);
                console.log('   Action Items:');
                rec.actionItems.slice(0, 3).forEach(action => {
                    console.log(`     • ${action}`);
                });
                if (rec.affectedFields && rec.affectedFields.length > 0) {
                    console.log(`   Affected Fields: ${rec.affectedFields.join(', ')}`);
                }
                console.log();
            });
        }
    } catch (error) {
        console.log('ℹ️  No recommendations available yet (database not populated)');
    }

    // ============================================================================
    // 6. CREATING ANALYTICS DASHBOARD
    // ============================================================================
    console.log('📊 6. Creating Analytics Dashboard');
    console.log('===================================\n');

    const organizationId = 'org-123456';
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const endDate = new Date();

    try {
        const dashboard = await analyticsEngine.getSignatureAnalyticsDashboard(
            organizationId,
            startDate,
            endDate
        );

        console.log('🏢 Organization Dashboard:');
        console.log(`   Organization ID: ${dashboard.organizationId}`);
        console.log(`   Time Range: ${dashboard.timeRange.startDate.toDateString()} - ${dashboard.timeRange.endDate.toDateString()}`);

        console.log('\n📈 Overview:');
        console.log(`   Total Documents: ${dashboard.overview.totalDocuments}`);
        console.log(`   Total Signature Requests: ${dashboard.overview.totalSignatureRequests}`);
        console.log(`   Total Completed Signatures: ${dashboard.overview.totalCompletedSignatures}`);
        console.log(`   Overall Completion Rate: ${dashboard.overview.overallCompletionRate.toFixed(2)}%`);
        console.log(`   Average Time to Sign: ${dashboard.overview.averageTimeToSign.toFixed(2)} seconds`);
        console.log(`   Total Active Workflows: ${dashboard.overview.totalActiveWorkflows}`);

        console.log('\n📊 Trends:');
        console.log('   Completion Rate Trend (last 3 days):');
        dashboard.trends.completionRateTrend.slice(-3).forEach(trend => {
            console.log(`     ${trend.date}: ${trend.rate.toFixed(2)}%`);
        });

        console.log('\n🏆 Top Performing Documents:');
        if (dashboard.topPerformingDocuments.length === 0) {
            console.log('   No top performing documents available');
        } else {
            dashboard.topPerformingDocuments.slice(0, 3).forEach((doc, index) => {
                console.log(`   ${index + 1}. ${doc.documentName}`);
                console.log(`      Completion Rate: ${doc.completionRate.toFixed(2)}%`);
                console.log(`      Avg Time to Sign: ${doc.averageTimeToSign.toFixed(2)}s`);
                console.log(`      Total Signatures: ${doc.totalSignatures}`);
            });
        }

        console.log('\n⚠️  Underperforming Documents:');
        if (dashboard.underperformingDocuments.length === 0) {
            console.log('   No underperforming documents identified');
        } else {
            dashboard.underperformingDocuments.slice(0, 2).forEach((doc, index) => {
                console.log(`   ${index + 1}. ${doc.documentName}`);
                console.log(`      Completion Rate: ${doc.completionRate.toFixed(2)}%`);
                console.log(`      Recommendations: ${doc.recommendations.length} available`);
            });
        }
    } catch (error) {
        console.log('ℹ️  Dashboard not available yet (database not populated)');
    }

    console.log();

    // ============================================================================
    // 7. ORGANIZATION-WIDE METRICS
    // ============================================================================
    console.log('🌐 7. Organization-wide Metrics');
    console.log('================================\n');

    try {
        const orgMetrics = await analyticsEngine.getOrganizationCompletionMetrics(
            organizationId,
            startDate,
            endDate
        );

        console.log('🏢 Organization Completion Metrics:');
        console.log(`   Total Signature Requests: ${orgMetrics.totalSignatureRequests}`);
        console.log(`   Completed Signatures: ${orgMetrics.completedSignatures}`);
        console.log(`   Organization Completion Rate: ${orgMetrics.completionRate.toFixed(2)}%`);
        console.log(`   Organization Average Time to Sign: ${orgMetrics.averageTimeToSign.toFixed(2)} seconds`);
        console.log(`   Organization Abandonment Rate: ${orgMetrics.abandonmentRate.toFixed(2)}%`);

        console.log('\n📊 Organization Trends:');
        orgMetrics.completionTrends.slice(-5).forEach(trend => {
            console.log(`   ${trend.date}: ${trend.completions}/${trend.requests} (${trend.rate.toFixed(2)}%)`);
        });
    } catch (error) {
        console.log('ℹ️  Organization metrics not available yet (database not populated)');
    }

    console.log('\n✅ Signature Analytics Demo Complete!');
    console.log('\n💡 Key Benefits:');
    console.log('   • Real-time signature completion tracking');
    console.log('   • Performance bottleneck identification');
    console.log('   • Data-driven optimization recommendations');
    console.log('   • Comprehensive analytics dashboards');
    console.log('   • User behavior insights for UX improvements');

    // Clean up
    await db.$disconnect();
}

// Example of using the analytics engine in a real application
async function realWorldUsageExample() {
    console.log('\n🚀 Real-world Usage Example');
    console.log('============================\n');

    const db = new PrismaClient();
    const analytics = new SignatureAnalyticsEngine(db);

    // Example: Monitoring a document signing process
    const documentId = 'contract-2024-001';

    // 1. Track when user starts signing
    await analytics.trackSignatureEvent({
        documentId,
        userId: 'user-123',
        sessionId: 'session-456',
        eventType: 'signature_start',
        fieldId: 'signature-1',
        fieldType: 'drawn',
        metadata: {
            referrer: 'email-notification',
            deviceType: 'mobile',
        },
        timestamp: new Date(),
    });

    // 2. Periodically check performance and get recommendations
    const recommendations = await analytics.generateOptimizationRecommendations(documentId);

    if (recommendations.length > 0) {
        console.log('📋 Optimization recommendations available:');
        recommendations.forEach(rec => {
            console.log(`   • ${rec.title}: ${rec.estimatedImprovement.improvement}`);
        });
    }

    // 3. Generate daily dashboard for monitoring
    const dashboard = await analytics.getSignatureAnalyticsDashboard(
        'org-123',
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
    );

    console.log(`📊 Daily completion rate: ${dashboard.overview.overallCompletionRate.toFixed(2)}%`);

    await db.$disconnect();
}

// Run the examples
if (require.main === module) {
    demonstrateSignatureAnalytics()
        .then(() => realWorldUsageExample())
        .catch(console.error);
}

export {
    demonstrateSignatureAnalytics,
    realWorldUsageExample
};