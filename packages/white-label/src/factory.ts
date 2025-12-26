import { BrandingService, BrandingServiceOptions } from './branding-service';
import { DomainService, DomainServiceOptions } from './domain-service';
import { DeploymentService, DeploymentServiceOptions } from './deployment-service';
import { AssetService, AssetServiceOptions } from './asset-service';

export interface WhiteLabelFactoryOptions {
    databaseService: any;
    storageService: any;
    branding?: Partial<BrandingServiceOptions>;
    domain?: Partial<DomainServiceOptions>;
    deployment?: Partial<DeploymentServiceOptions>;
    asset?: Partial<AssetServiceOptions>;
}

export class WhiteLabelFactory {
    private databaseService: any;
    private storageService: any;
    private options: WhiteLabelFactoryOptions;

    constructor(options: WhiteLabelFactoryOptions) {
        this.databaseService = options.databaseService;
        this.storageService = options.storageService;
        this.options = options;
    }

    createBrandingService(): BrandingService {
        const defaultOptions: BrandingServiceOptions = {
            storageService: this.storageService,
            databaseService: this.databaseService,
            previewBaseUrl: 'https://preview.docusign-alternative.com',
        };

        const options = { ...defaultOptions, ...this.options.branding };
        return new BrandingService(options);
    }

    createDomainService(): DomainService {
        const defaultOptions: DomainServiceOptions = {
            databaseService: this.databaseService,
            dnsProvider: 'cloudflare' as const,
            sslProvider: 'letsencrypt' as const,
            apiKeys: {},
        };

        const options = { ...defaultOptions, ...this.options.domain };
        return new DomainService(options);
    }

    createDeploymentService(): DeploymentService {
        const defaultOptions: DeploymentServiceOptions = {
            databaseService: this.databaseService,
            containerRegistry: 'registry.docusign-alternative.com',
            orchestrator: 'kubernetes' as const,
            cloudProvider: 'aws' as const,
            apiKeys: {},
        };

        const options = { ...defaultOptions, ...this.options.deployment };
        return new DeploymentService(options);
    }

    createAssetService(): AssetService {
        const defaultOptions: AssetServiceOptions = {
            storageService: this.storageService,
            databaseService: this.databaseService,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedMimeTypes: [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'image/svg+xml',
                'font/woff',
                'font/woff2',
                'application/font-woff',
                'application/font-woff2',
            ],
            thumbnailSizes: [
                { width: 150, height: 150 },
                { width: 300, height: 300 },
                { width: 600, height: 600 },
            ],
            cdnBaseUrl: 'https://cdn.docusign-alternative.com',
        };

        const options = { ...defaultOptions, ...this.options.asset };
        return new AssetService(options);
    }

    // Convenience method to create all services
    createAllServices() {
        return {
            branding: this.createBrandingService(),
            domain: this.createDomainService(),
            deployment: this.createDeploymentService(),
            asset: this.createAssetService(),
        };
    }
}

// Default factory instance
export function createWhiteLabelServices(options: WhiteLabelFactoryOptions) {
    const factory = new WhiteLabelFactory(options);
    return factory.createAllServices();
}