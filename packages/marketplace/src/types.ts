/**
 * Marketplace Platform Types
 * 
 * Defines types for the extension marketplace platform with developer portal,
 * third-party app integration, sandboxing, and revenue sharing system.
 */

import { z } from 'zod';

// App Categories
export enum AppCategory {
    PRODUCTIVITY = 'productivity',
    INTEGRATION = 'integration',
    ANALYTICS = 'analytics',
    SECURITY = 'security',
    WORKFLOW = 'workflow',
    COMMUNICATION = 'communication',
    STORAGE = 'storage',
    AI_ML = 'ai_ml',
    COMPLIANCE = 'compliance',
    CUSTOM = 'custom'
}

// App Status
export enum AppStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PUBLISHED = 'published',
    SUSPENDED = 'suspended',
    DEPRECATED = 'deprecated'
}

// Revenue Models
export enum RevenueModel {
    FREE = 'free',
    ONE_TIME = 'one_time',
    SUBSCRIPTION = 'subscription',
    USAGE_BASED = 'usage_based',
    FREEMIUM = 'freemium',
    REVENUE_SHARE = 'revenue_share'
}

// Sandbox Security Levels
export enum SandboxLevel {
    BASIC = 'basic',
    STANDARD = 'standard',
    STRICT = 'strict',
    ISOLATED = 'isolated'
}

// App Permissions
export interface AppPermission {
    id: string;
    name: string;
    description: string;
    category: 'read' | 'write' | 'admin' | 'system';
    required: boolean;
}

// App Manifest Schema
export const AppManifestSchema = z.object({
    name: z.string().min(1).max(100),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    description: z.string().min(10).max(500),
    category: z.nativeEnum(AppCategory),
    author: z.object({
        name: z.string(),
        email: z.string().email(),
        website: z.string().url().optional(),
        support: z.string().url().optional()
    }),
    permissions: z.array(z.string()),
    entryPoint: z.string(),
    assets: z.array(z.string()).optional(),
    dependencies: z.record(z.string()).optional(),
    minPlatformVersion: z.string(),
    maxPlatformVersion: z.string().optional(),
    pricing: z.object({
        model: z.nativeEnum(RevenueModel),
        price: z.number().min(0).optional(),
        currency: z.string().length(3).optional(),
        billingCycle: z.enum(['monthly', 'yearly', 'usage']).optional(),
        trialDays: z.number().min(0).optional()
    }),
    sandbox: z.object({
        level: z.nativeEnum(SandboxLevel),
        resources: z.object({
            memory: z.number().min(64).max(2048), // MB
            cpu: z.number().min(0.1).max(2.0), // CPU cores
            storage: z.number().min(10).max(1000), // MB
            network: z.boolean().default(false)
        }),
        timeouts: z.object({
            execution: z.number().min(1000).max(300000), // ms
            idle: z.number().min(5000).max(600000) // ms
        })
    })
});

export type AppManifest = z.infer<typeof AppManifestSchema>;

// App Entity
export interface App {
    id: string;
    developerId: string;
    organizationId?: string;
    manifest: AppManifest;
    status: AppStatus;
    packageUrl?: string;
    iconUrl?: string;
    screenshots: string[];
    documentation?: string;
    changelog?: string;
    tags: string[];

    // Metrics
    downloads: number;
    activeInstalls: number;
    rating: number;
    reviewCount: number;

    // Revenue
    totalRevenue: number;
    monthlyRevenue: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    lastReviewedAt?: Date;
}

// App Installation
export interface AppInstallation {
    id: string;
    appId: string;
    organizationId: string;
    userId: string;
    version: string;
    status: 'installing' | 'active' | 'suspended' | 'uninstalling';
    configuration: Record<string, any>;

    // Usage tracking
    lastUsed?: Date;
    usageCount: number;

    // Billing
    subscriptionId?: string;
    billingStatus: 'active' | 'past_due' | 'canceled' | 'trial';
    trialEndsAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

// Developer Profile
export interface Developer {
    id: string;
    userId: string;
    companyName?: string;
    website?: string;
    supportEmail: string;

    // Verification
    verified: boolean;
    verificationDocuments: string[];

    // Revenue sharing
    payoutMethod: 'stripe' | 'paypal' | 'bank_transfer';
    payoutDetails: Record<string, any>;
    revenueShare: number; // Percentage (0-100)

    // Statistics
    totalApps: number;
    totalDownloads: number;
    totalRevenue: number;

    createdAt: Date;
    updatedAt: Date;
}

// App Review
export interface AppReview {
    id: string;
    appId: string;
    reviewerId: string;
    version: string;
    status: 'pending' | 'approved' | 'rejected';

    // Review criteria
    securityCheck: boolean;
    performanceCheck: boolean;
    functionalityCheck: boolean;
    complianceCheck: boolean;

    // Feedback
    comments?: string;
    recommendations?: string[];

    createdAt: Date;
    completedAt?: Date;
}

// Revenue Transaction
export interface RevenueTransaction {
    id: string;
    appId: string;
    developerId: string;
    organizationId: string;
    installationId: string;

    type: 'purchase' | 'subscription' | 'usage' | 'refund';
    amount: number;
    currency: string;

    // Revenue split
    platformFee: number;
    developerShare: number;

    // Payment details
    paymentMethod: string;
    paymentId: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';

    createdAt: Date;
    processedAt?: Date;
}

// Sandbox Environment
export interface SandboxEnvironment {
    id: string;
    appId: string;
    installationId: string;

    // Container details
    containerId?: string;
    imageId: string;
    status: 'creating' | 'running' | 'stopped' | 'error';

    // Resource allocation
    allocatedMemory: number;
    allocatedCpu: number;
    allocatedStorage: number;

    // Security
    securityLevel: SandboxLevel;
    allowedDomains: string[];
    blockedDomains: string[];

    // Monitoring
    cpuUsage: number;
    memoryUsage: number;
    networkUsage: number;

    createdAt: Date;
    lastActivity?: Date;
}

// Marketplace Analytics
export interface MarketplaceAnalytics {
    totalApps: number;
    totalDevelopers: number;
    totalInstallations: number;
    totalRevenue: number;

    // Trending
    trendingApps: App[];
    topCategories: { category: AppCategory; count: number }[];

    // Performance
    averageRating: number;
    averageDownloads: number;

    // Time-based metrics
    dailyInstalls: { date: string; count: number }[];
    monthlyRevenue: { month: string; amount: number }[];
}

// API Interfaces
export interface MarketplaceService {
    // App management
    createApp(developerId: string, manifest: AppManifest): Promise<App>;
    updateApp(appId: string, updates: Partial<AppManifest>): Promise<App>;
    submitForReview(appId: string): Promise<void>;
    publishApp(appId: string): Promise<void>;

    // Installation management
    installApp(appId: string, organizationId: string, userId: string): Promise<AppInstallation>;
    uninstallApp(installationId: string): Promise<void>;
    configureApp(installationId: string, config: Record<string, any>): Promise<void>;

    // Sandbox management
    createSandbox(installationId: string): Promise<SandboxEnvironment>;
    executeSandboxCode(sandboxId: string, code: string, context: any): Promise<any>;
    destroySandbox(sandboxId: string): Promise<void>;

    // Revenue management
    processPayment(installationId: string, amount: number): Promise<RevenueTransaction>;
    calculateRevenueSplit(amount: number, appId: string): Promise<{ platformFee: number; developerShare: number }>;

    // Analytics
    getMarketplaceAnalytics(): Promise<MarketplaceAnalytics>;
    getAppAnalytics(appId: string): Promise<any>;
    getDeveloperAnalytics(developerId: string): Promise<any>;
}

// Events
export interface MarketplaceEvent {
    type: 'app.created' | 'app.published' | 'app.installed' | 'app.uninstalled' | 'revenue.generated';
    appId: string;
    organizationId?: string;
    developerId?: string;
    data: Record<string, any>;
    timestamp: Date;
}