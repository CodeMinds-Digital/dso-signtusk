/**
 * Marketplace Package - Main Export
 * 
 * Extension marketplace platform with developer portal, third-party app integration,
 * sandboxing, and revenue sharing system.
 */

// Core types
export * from './types';

// Main service
export { MarketplaceServiceImpl } from './marketplace-service';

// Supporting services
export { SandboxManager } from './sandbox-manager';
export { RevenueManager } from './revenue-manager';
export type { MarketplaceDatabase, Logger } from './revenue-manager';
export { AppValidator } from './app-validator';
export { SecurityScanner } from './security-scanner';

// Developer portal
export { DeveloperPortal } from './developer-portal';

// API routes
export { createMarketplaceRoutes } from './api-routes';

// Utilities
export { MarketplaceUtils } from './utils';

// Default export for convenience
export { MarketplaceServiceImpl as MarketplaceService } from './marketplace-service';