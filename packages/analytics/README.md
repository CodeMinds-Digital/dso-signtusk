# @signtusk/analytics

Comprehensive organization analytics and reporting system providing usage analytics, team performance insights, collaboration metrics, cost analysis, and predictive analytics for capacity planning.

## Features

### 📊 Usage Analytics & Engagement Metrics
- User activity and engagement tracking
- Document creation and completion metrics
- Signing request analytics
- Template usage statistics
- Storage and API usage monitoring
- Growth trends and patterns

### 👥 Team Performance & Collaboration Insights
- Team-level performance metrics
- Individual contributor analytics
- Cross-team collaboration patterns
- Performance benchmarking
- Top performer identification
- Collaboration network analysis

### 💰 Cost Analysis & Optimization Recommendations
- Subscription cost breakdown
- Usage-based cost analysis
- Cost per user/document metrics
- Overage charge tracking
- Cost optimization recommendations
- Budget projections and forecasting

### 🔮 Predictive Analytics for Capacity Planning
- User growth predictions
- Document volume forecasting
- Storage needs projection
- Cost projections
- Capacity planning recommendations
- Risk factor identification

## Installation

```bash
npm install @signtusk/analytics
```

## Usage

### Basic Analytics Dashboard

```typescript
import { OrganizationAnalyticsService } from '@signtusk/analytics';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const analyticsService = new OrganizationAnalyticsService(db);

// Generate comprehensive analytics dashboard
const dashboard = await analyticsService.generateAnalyticsDashboard({
  organizationId: 'org-123',
  timeRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  },
  includeTeamMetrics: true,
  includeCollaborationInsights: true,
  includeCostAnalysis: true,
  includePredictiveAnalytics: true,
});

console.log('Organization Overview:', dashboard.overview);
console.log('Usage Analytics:', dashboard.usageAnalytics);
console.log('Team Performance:', dashboard.teamPerformance);
console.log('Cost Analysis:', dashboard.costAnalysis);
console.log('Optimization Recommendations:', dashboard.optimizationRecommendations);
```

### Usage Analytics Only

```typescript
const usageAnalytics = await analyticsService.generateUsageAnalytics(
  'org-123',
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  }
);

console.log('Total Users:', usageAnalytics.metrics.totalUsers);
console.log('Active Users:', usageAnalytics.metrics.activeUsers);
console.log('Documents Created:', usageAnalytics.metrics.documentsCreated);
console.log('Completion Rate:', 
  (usageAnalytics.metrics.signingRequestsCompleted / usageAnalytics.metrics.totalSigningRequests) * 100
);
```

### Team Performance Analysis

```typescript
const teamMetrics = await analyticsService.generateTeamPerformanceMetrics(
  'org-123',
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  }
);

// Analyze team performance
teamMetrics.teams.forEach(team => {
  console.log(`Team: ${team.teamName}`);
  console.log(`Completion Rate: ${team.metrics.completionRate}%`);
  console.log(`Average Completion Time: ${team.metrics.averageCompletionTime} hours`);
  console.log('Top Performers:', team.topPerformers);
});
```

### Cost Analysis & Optimization

```typescript
const costAnalysis = await analyticsService.generateCostAnalysis(
  'org-123',
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  }
);

console.log('Total Cost:', costAnalysis.costs.totalCost);
console.log('Cost Per User:', costAnalysis.costs.costPerUser);
console.log('Overage Charges:', costAnalysis.usage.overageCharges);
console.log('Next Month Projection:', costAnalysis.projections.nextMonthProjectedCost);
```

### Predictive Analytics

```typescript
const predictions = await analyticsService.generatePredictiveAnalytics('org-123');

console.log('User Growth Predictions:', predictions.predictions.userGrowth);
console.log('Storage Needs:', predictions.predictions.storageNeeds);
console.log('Capacity Planning:', predictions.capacityPlanning);
console.log('Risk Factors:', predictions.riskFactors);
```

### Event Tracking

```typescript
// Track analytics events for real-time insights
await analyticsService.trackAnalyticsEvent({
  organizationId: 'org-123',
  eventType: 'document_activity',
  eventData: {
    action: 'document_created',
    documentId: 'doc-456',
    documentType: 'contract',
  },
  userId: 'user-789',
  teamId: 'team-101',
  timestamp: new Date(),
});
```

## API Reference

### OrganizationAnalyticsService

#### Methods

- `generateAnalyticsDashboard(request: AnalyticsRequest): Promise<OrganizationAnalyticsDashboard>`
- `generateUsageAnalytics(organizationId: string, timeRange: TimeRange): Promise<UsageAnalytics>`
- `generateTeamPerformanceMetrics(organizationId: string, timeRange: TimeRange): Promise<TeamPerformanceMetrics>`
- `generateCollaborationInsights(organizationId: string, timeRange: TimeRange): Promise<CollaborationInsights>`
- `generateCostAnalysis(organizationId: string, timeRange: TimeRange): Promise<CostAnalysis>`
- `generatePredictiveAnalytics(organizationId: string): Promise<PredictiveAnalytics>`
- `trackAnalyticsEvent(event: AnalyticsEvent): Promise<void>`

### Types

#### AnalyticsRequest
```typescript
interface AnalyticsRequest {
  organizationId: string;
  timeRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeTeamMetrics?: boolean;
  includeCollaborationInsights?: boolean;
  includeCostAnalysis?: boolean;
  includePredictiveAnalytics?: boolean;
}
```

#### UsageAnalytics
```typescript
interface UsageAnalytics {
  organizationId: string;
  timeRange: { startDate: Date; endDate: Date };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalDocuments: number;
    documentsCreated: number;
    documentsCompleted: number;
    totalSigningRequests: number;
    signingRequestsCompleted: number;
    totalTemplates: number;
    templatesUsed: number;
    storageUsed: number;
    apiCalls: number;
    webhookDeliveries: number;
  };
  trends: {
    userGrowth: Array<{ date: string; totalUsers: number; activeUsers: number }>;
    documentActivity: Array<{ date: string; created: number; completed: number }>;
    signingActivity: Array<{ date: string; requested: number; completed: number }>;
  };
}
```

#### OptimizationRecommendation
```typescript
interface OptimizationRecommendation {
  id: string;
  type: 'cost' | 'performance' | 'usage' | 'collaboration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    metric: string;
    estimatedImprovement: string;
    potentialSavings?: number;
  };
  actionItems: string[];
  implementation: {
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
    resources: string[];
  };
  affectedTeams?: string[];
  affectedUsers?: string[];
}
```

## Key Benefits

### 📈 Data-Driven Decision Making
- Comprehensive metrics and KPIs
- Historical trend analysis
- Performance benchmarking
- Growth pattern identification

### 💡 Actionable Insights
- Automated optimization recommendations
- Performance bottleneck identification
- Cost optimization opportunities
- Collaboration improvement suggestions

### 🔍 Deep Visibility
- Organization-wide analytics
- Team-level performance metrics
- Individual contributor insights
- Cross-team collaboration patterns

### 🎯 Predictive Planning
- Capacity planning recommendations
- Growth projections
- Resource requirement forecasting
- Risk factor identification

### 💰 Cost Optimization
- Usage-based cost analysis
- Overage monitoring and alerts
- Budget planning and projections
- ROI measurement and tracking

## Integration

This package integrates with:
- `@signtusk/database` for data access
- `@signtusk/lib` for shared utilities
- Organization billing systems for cost analysis
- User activity tracking systems
- Document workflow engines

## Performance Considerations

- Analytics calculations are optimized for large datasets
- Caching strategies implemented for frequently accessed metrics
- Batch processing for historical data analysis
- Efficient database queries with proper indexing
- Configurable time ranges to balance accuracy and performance

## Security & Privacy

- All analytics data is organization-scoped
- User privacy protection in aggregated metrics
- Secure data access patterns
- Audit trail for analytics access
- Compliance with data protection regulations