import type {
    SSOConfiguration,
    SSOConfigCreationData,
    SSOConfigUpdateData,
    SSOAuthRequest,
    SSOAuthResult,
    SSODiscoveryResult,
    SSOValidationResult,
    SSOSession,
    SSOAuditEvent,
    SSOStatistics,
    SAML2Config,
    OIDCSSOConfig,
    JITProvisioning
} from '../types/sso-types';
import {
    SSOProvider,
    SSOConfigStatus,
    SSOErrorCode,
    SSOAuditEventType
} from '../types/sso-types';
import { SAML2Service } from './saml-service';
import { OIDCSSOService } from './oidc-sso-service';
import { prisma } from '@signtusk/prisma';
import { NEXT_PUBLIC_WEBAPP_URL } from '@signtusk/lib/constants/app';

// ============================================================================
// ENTERPRISE SSO SERVICE
// ============================================================================

/**
 * Enterprise SSO service that orchestrates SAML 2.0 and OIDC authentication
 * Provides configuration management, authentication flows, and JIT provisioning
 */

export class SSOService {
    private samlService: SAML2Service;
    private oidcService: OIDCSSOService;

    constructor() {
        this.samlService = new SAML2Service();
        this.oidcService = new OIDCSSOService();
    }

    // ========================================================================
    // CONFIGURATION MANAGEMENT
    // ========================================================================

    /**
     * Create SSO configuration
     */
    async createConfiguration(
        data: SSOConfigCreationData,
        createdBy: string
    ): Promise<SSOConfiguration> {
        // Validate organization exists
        const organisation = await prisma.organisation.findUnique({
            where: { id: data.organisationId }
        });

        if (!organisation) {
            throw new Error('Organization not found');
        }

        // Validate configuration based on provider
        const validationResult = await this.validateConfiguration(data.provider, data.config);
        if (!validationResult.isValid) {
            throw new Error(`Configuration validation failed: ${validationResult.errors.join(', ')}`);
        }

        // Check if domains are already configured for another SSO
        await this.validateDomainUniqueness(data.domains, data.organisationId);

        // If this is set as default, unset other defaults
        if (data.isDefault) {
            await this.unsetDefaultConfigurations(data.organisationId);
        }

        // Get the authentication portal for this organization
        const authPortal = await prisma.organisationAuthenticationPortal.findFirst({
            where: {
                organisation: {
                    id: data.organisationId
                }
            }
        });

        if (!authPortal) {
            throw new Error('Organization authentication portal not found');
        }

        const configuration = await prisma.sSOConfiguration.create({
            data: {
                organisationId: data.organisationId,
                name: data.name,
                description: data.description,
                provider: data.provider,
                domains: data.domains,
                isDefault: data.isDefault,
                status: SSOConfigStatus.DRAFT,
                config: data.config as any,
                createdBy,
                organisationAuthenticationPortalId: authPortal.id
            }
        });

        // Log audit event
        await this.logAuditEvent({
            organisationId: data.organisationId,
            ssoConfigId: configuration.id,
            userId: createdBy ? parseInt(createdBy) : undefined,
            event: SSOAuditEventType.CONFIG_CREATED,
            details: { name: data.name, provider: data.provider, domains: data.domains }
        });

        return configuration as SSOConfiguration;
    }

    /**
     * Update SSO configuration
     */
    async updateConfiguration(
        configId: string,
        data: SSOConfigUpdateData,
        updatedBy: string
    ): Promise<SSOConfiguration> {
        const config = await prisma.sSOConfiguration.findUnique({
            where: { id: configId }
        });

        if (!config) {
            throw new Error('SSO configuration not found');
        }

        // Validate updated configuration if config is provided
        if (data.config) {
            const existingConfig = config.config || {};
            const mergedConfig = { ...existingConfig, ...data.config };
            const validationResult = await this.validateConfiguration(config.provider as SSOProvider, mergedConfig);
            if (!validationResult.isValid) {
                throw new Error(`Configuration validation failed: ${validationResult.errors.join(', ')}`);
            }
        }

        // Check domain uniqueness if domains are being updated
        if (data.domains) {
            await this.validateDomainUniqueness(data.domains, config.organisationId, configId);
        }

        // Handle default configuration changes
        if (data.isDefault === true) {
            await this.unsetDefaultConfigurations(config.organisationId, configId);
        }

        const updatedConfig = await prisma.sSOConfiguration.update({
            where: { id: configId },
            data: {
                ...data,
                config: data.config ? { ...(config.config || {}), ...data.config } : config.config,
                updatedAt: new Date()
            }
        });

        // Log audit event
        await this.logAuditEvent({
            organisationId: config.organisationId,
            ssoConfigId: configId,
            userId: updatedBy ? parseInt(updatedBy) : undefined,
            event: SSOAuditEventType.CONFIG_UPDATED,
            details: data
        });

        return updatedConfig as SSOConfiguration;
    }

    /**
     * Delete SSO configuration
     */
    async deleteConfiguration(configId: string, deletedBy: string): Promise<void> {
        const config = await prisma.sSOConfiguration.findUnique({
            where: { id: configId }
        });

        if (!config) {
            throw new Error('SSO configuration not found');
        }

        // Check if configuration is in use
        const activeSessions = await prisma.sSOSession.findMany({
            where: { ssoConfigId: configId }
        });

        if (activeSessions.length > 0) {
            throw new Error('Cannot delete SSO configuration with active sessions');
        }

        await prisma.sSOConfiguration.delete({
            where: { id: configId }
        });

        // Log audit event
        await this.logAuditEvent({
            organisationId: config.organisationId,
            ssoConfigId: configId,
            userId: deletedBy ? parseInt(deletedBy) : undefined,
            event: SSOAuditEventType.CONFIG_DELETED,
            details: { name: config.name, provider: config.provider }
        });
    }

    /**
     * Get SSO configuration
     */
    async getConfiguration(configId: string): Promise<SSOConfiguration | null> {
        const config = await prisma.sSOConfiguration.findUnique({
            where: { id: configId }
        });

        return config as SSOConfiguration | null;
    }

    /**
     * List SSO configurations for organization
     */
    async listConfigurations(organisationId: string): Promise<SSOConfiguration[]> {
        const configs = await prisma.sSOConfiguration.findMany({
            where: { organisationId }
        });

        return configs as SSOConfiguration[];
    }

    /**
     * Activate SSO configuration
     */
    async activateConfiguration(configId: string, activatedBy: string): Promise<void> {
        const config = await prisma.sSOConfiguration.findUnique({
            where: { id: configId }
        });

        if (!config) {
            throw new Error('SSO configuration not found');
        }

        // Validate configuration before activation
        const validationResult = await this.validateConfiguration(config.provider as SSOProvider, config.config);
        if (!validationResult.isValid) {
            throw new Error(`Cannot activate invalid configuration: ${validationResult.errors.join(', ')}`);
        }

        await prisma.sSOConfiguration.update({
            where: { id: configId },
            data: {
                status: SSOConfigStatus.ACTIVE,
                updatedAt: new Date()
            }
        });

        // Log audit event
        await this.logAuditEvent({
            organisationId: config.organisationId,
            ssoConfigId: configId,
            userId: activatedBy ? parseInt(activatedBy) : undefined,
            event: SSOAuditEventType.CONFIG_ACTIVATED,
            details: {}
        });
    }

    /**
     * Deactivate SSO configuration
     */
    async deactivateConfiguration(configId: string, deactivatedBy: string): Promise<void> {
        const config = await prisma.sSOConfiguration.findUnique({
            where: { id: configId }
        });

        if (!config) {
            throw new Error('SSO configuration not found');
        }

        await prisma.sSOConfiguration.update({
            where: { id: configId },
            data: {
                status: SSOConfigStatus.INACTIVE,
                updatedAt: new Date()
            }
        });

        // Log audit event
        await this.logAuditEvent({
            organisationId: config.organisationId,
            ssoConfigId: configId,
            userId: deactivatedBy ? parseInt(deactivatedBy) : undefined,
            event: SSOAuditEventType.CONFIG_DEACTIVATED,
            details: {}
        });
    }

    // ========================================================================
    // AUTHENTICATION FLOWS
    // ========================================================================

    /**
     * Discover SSO configuration for email/domain
     */
    async discoverSSO(email: string, organisationId?: string): Promise<SSODiscoveryResult> {
        const domain = email.split('@')[1];

        const whereClause: any = {
            status: SSOConfigStatus.ACTIVE,
            domains: {
                has: domain
            }
        };

        if (organisationId) {
            whereClause.organisationId = organisationId;
        }

        const configs = await prisma.sSOConfiguration.findMany({
            where: whereClause
        });

        const ssoConfigs = configs.map(config => ({
            id: config.id,
            name: config.name,
            provider: config.provider as SSOProvider,
            loginUrl: this.generateLoginUrl(config.id)
        }));

        const defaultConfig = configs.find(config => config.isDefault);

        return {
            hasSSOConfig: configs.length > 0,
            ssoConfigs,
            defaultConfig: defaultConfig ? {
                id: defaultConfig.id,
                name: defaultConfig.name,
                provider: defaultConfig.provider as SSOProvider,
                loginUrl: this.generateLoginUrl(defaultConfig.id)
            } : undefined
        };
    }

    /**
     * Initiate SSO authentication
     */
    async initiateAuthentication(
        configId: string,
        request: SSOAuthRequest
    ): Promise<{ redirectUrl: string; state: string }> {
        const config = await prisma.sSOConfiguration.findUnique({
            where: { id: configId }
        });

        if (!config || config.status !== SSOConfigStatus.ACTIVE) {
            throw new Error('SSO configuration not found or inactive');
        }

        // Log audit event
        await this.logAuditEvent({
            organisationId: config.organisationId,
            ssoConfigId: configId,
            event: SSOAuditEventType.LOGIN_INITIATED,
            details: { email: request.email, domain: request.domain }
        });

        try {
            if (config.provider === SSOProvider.SAML2) {
                return await this.initiateSAMLAuth(config.config as SAML2Config, request);
            } else if (config.provider === SSOProvider.OIDC) {
                return await this.initiateOIDCAuth(config.config as OIDCSSOConfig, request);
            } else {
                throw new Error('Unsupported SSO provider');
            }
        } catch (error) {
            // Log failed initiation
            await this.logAuditEvent({
                organisationId: config.organisationId,
                ssoConfigId: configId,
                event: SSOAuditEventType.LOGIN_FAILED,
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
            throw error;
        }
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    private async initiateSAMLAuth(
        config: SAML2Config,
        request: SSOAuthRequest
    ): Promise<{ redirectUrl: string; state: string }> {
        const { requestId, samlRequest, relayState } = await this.samlService.generateAuthRequest(
            config,
            request.state
        );

        // Build redirect URL based on binding
        let redirectUrl: string;
        if (config.binding === 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST') {
            // For HTTP-POST binding, we need to render a form
            redirectUrl = `/sso/saml/post?SAMLRequest=${encodeURIComponent(samlRequest)}&RelayState=${encodeURIComponent(relayState || '')}`;
        } else {
            // HTTP-Redirect binding
            const params = new URLSearchParams({
                SAMLRequest: samlRequest
            });
            if (relayState) {
                params.set('RelayState', relayState);
            }
            redirectUrl = `${config.idpSSOUrl}?${params.toString()}`;
        }

        return { redirectUrl, state: requestId };
    }

    private async initiateOIDCAuth(
        config: OIDCSSOConfig,
        request: SSOAuthRequest
    ): Promise<{ redirectUrl: string; state: string }> {
        const redirectUri = `${NEXT_PUBLIC_WEBAPP_URL()}/api/auth/sso/callback/oidc`;

        const { url, state, codeVerifier, nonce } = await this.oidcService.generateAuthorizationUrl(
            config,
            redirectUri,
            request.state
        );

        // Store PKCE and nonce for later validation
        // In production, this should be stored in a secure session store
        if (codeVerifier) {
            // Store codeVerifier with state for later retrieval
        }

        return { redirectUrl: url, state };
    }

    private async validateConfiguration(
        provider: SSOProvider,
        config: any
    ): Promise<SSOValidationResult> {
        if (provider === SSOProvider.SAML2) {
            return this.samlService.validateConfiguration(config as SAML2Config);
        } else if (provider === SSOProvider.OIDC) {
            return this.oidcService.validateConfiguration(config as OIDCSSOConfig);
        } else {
            return {
                isValid: false,
                errors: ['Unsupported SSO provider'],
                warnings: []
            };
        }
    }

    private async validateDomainUniqueness(
        domains: string[],
        organisationId: string,
        excludeConfigId?: string
    ): Promise<void> {
        const whereClause: any = {
            organisationId,
            status: SSOConfigStatus.ACTIVE
        };

        if (excludeConfigId) {
            whereClause.id = { not: excludeConfigId };
        }

        const existingConfigs = await prisma.sSOConfiguration.findMany({
            where: whereClause
        });

        for (const domain of domains) {
            const conflictingConfig = existingConfigs.find(config =>
                config.domains.includes(domain)
            );

            if (conflictingConfig) {
                throw new Error(`Domain ${domain} is already configured for SSO in configuration: ${conflictingConfig.name}`);
            }
        }
    }

    private async unsetDefaultConfigurations(
        organisationId: string,
        excludeConfigId?: string
    ): Promise<void> {
        const whereClause: any = {
            organisationId,
            isDefault: true
        };

        if (excludeConfigId) {
            whereClause.id = { not: excludeConfigId };
        }

        await prisma.sSOConfiguration.updateMany({
            where: whereClause,
            data: {
                isDefault: false,
                updatedAt: new Date()
            }
        });
    }

    private generateLoginUrl(configId: string): string {
        return `${NEXT_PUBLIC_WEBAPP_URL()}/api/auth/sso/login/${configId}`;
    }

    private async logAuditEvent(event: Omit<SSOAuditEvent, 'id' | 'timestamp'>): Promise<void> {
        await prisma.sSOAuditEvent.create({
            data: {
                ...event,
                timestamp: new Date()
            }
        });
    }
}