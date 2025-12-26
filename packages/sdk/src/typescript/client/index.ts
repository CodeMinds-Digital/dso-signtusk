/**
 * Main SDK client for Signtusk
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { SDKConfiguration, APIResponse } from '../types';
import {
    createErrorFromResponse,
    isRetryableError,
    ConfigurationError,
    NetworkError,
    TimeoutError
} from '../errors';
import { retry, deepMerge } from '../utils';

// Import services
import { DocumentService } from '../services/documents';
import { TemplateService } from '../services/templates';
import { SigningService } from '../services/signing';
import { OrganizationService } from '../services/organizations';
import { UserService } from '../services/users';
import { WebhookService } from '../services/webhooks';
import { AnalyticsService } from '../services/analytics';
import { AuthService } from '../services/auth';
import { EventService } from '../services/events';

export class DocuSignAlternativeSDK {
    private httpClient: AxiosInstance;
    private config: Required<SDKConfiguration>;

    // Service instances
    public readonly documents: DocumentService;
    public readonly templates: TemplateService;
    public readonly signing: SigningService;
    public readonly organizations: OrganizationService;
    public readonly users: UserService;
    public readonly webhooks: WebhookService;
    public readonly analytics: AnalyticsService;
    public readonly auth: AuthService;
    public readonly events: EventService;

    constructor(config: SDKConfiguration) {
        this.config = this.validateAndNormalizeConfig(config);
        this.httpClient = this.createHttpClient();

        // Initialize services
        this.documents = new DocumentService(this);
        this.templates = new TemplateService(this);
        this.signing = new SigningService(this);
        this.organizations = new OrganizationService(this);
        this.users = new UserService(this);
        this.webhooks = new WebhookService(this);
        this.analytics = new AnalyticsService(this);
        this.auth = new AuthService(this);
        this.events = new EventService(this);
    }

    /**
     * Validate and normalize configuration
     */
    private validateAndNormalizeConfig(config: SDKConfiguration): Required<SDKConfiguration> {
        if (!config.apiKey && !config.oauth && !config.jwt) {
            throw new ConfigurationError('API key, OAuth configuration, or JWT token is required');
        }

        const baseURLs = {
            development: 'https://api-dev.docusign-alternative.com',
            staging: 'https://api-staging.docusign-alternative.com',
            production: 'https://api.docusign-alternative.com'
        };

        const environment = config.environment || 'production';
        const baseURL = config.baseURL || baseURLs[environment];

        return {
            apiKey: config.apiKey || '',
            baseURL,
            environment,
            timeout: config.timeout !== undefined && config.timeout !== null ? config.timeout : 30000,
            retries: config.retries !== undefined && config.retries !== null ? config.retries : 3,
            retryDelay: config.retryDelay !== undefined && config.retryDelay !== null ? config.retryDelay : 1000,
            oauth: config.oauth || { clientId: '', clientSecret: '', redirectUri: '' },
            jwt: config.jwt || { token: '' },
            httpClient: config.httpClient
        };
    }

    /**
     * Create and configure HTTP client
     */
    private createHttpClient(): AxiosInstance {
        if (this.config.httpClient) {
            return this.config.httpClient;
        }

        const client = axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'DocuSignAlternative-SDK/1.0.0',
                'Accept': 'application/json'
            }
        });

        // Add authentication interceptor
        client.interceptors.request.use((config) => {
            if (this.config.apiKey) {
                config.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
            } else if (this.config.jwt.token) {
                config.headers['Authorization'] = `Bearer ${this.config.jwt.token}`;
            }

            return config;
        });

        // Add response interceptor for error handling
        client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    // Server responded with error status
                    const requestId = error.response.headers['x-request-id'];
                    throw createErrorFromResponse(
                        error.response.status,
                        error.response.data,
                        requestId
                    );
                } else if (error.request) {
                    // Network error
                    throw new NetworkError('Network error occurred', error);
                } else if (error.code === 'ECONNABORTED') {
                    // Timeout error
                    throw new TimeoutError('Request timeout');
                } else {
                    // Other error
                    throw new NetworkError(error.message, error);
                }
            }
        );

        return client;
    }

    /**
     * Make HTTP request with retry logic
     */
    public async request<T = any>(
        method: string,
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<APIResponse<T>> {
        const requestConfig: AxiosRequestConfig = {
            method: method.toUpperCase() as any,
            url,
            data,
            ...config
        };

        const makeRequest = async (): Promise<AxiosResponse<T>> => {
            return this.httpClient.request<T>(requestConfig);
        };

        try {
            const response = await retry(
                makeRequest,
                this.config.retries,
                this.config.retryDelay
            );

            return {
                data: response.data,
                status: response.status,
                headers: response.headers as Record<string, string>,
                requestId: response.headers['x-request-id'] || ''
            };
        } catch (error) {
            if (isRetryableError(error)) {
                throw error;
            }
            throw error;
        }
    }

    /**
     * GET request
     */
    public async get<T = any>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<APIResponse<T>> {
        return this.request<T>('GET', url, undefined, config);
    }

    /**
     * POST request
     */
    public async post<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<APIResponse<T>> {
        return this.request<T>('POST', url, data, config);
    }

    /**
     * PUT request
     */
    public async put<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<APIResponse<T>> {
        return this.request<T>('PUT', url, data, config);
    }

    /**
     * PATCH request
     */
    public async patch<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<APIResponse<T>> {
        return this.request<T>('PATCH', url, data, config);
    }

    /**
     * DELETE request
     */
    public async delete<T = any>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<APIResponse<T>> {
        return this.request<T>('DELETE', url, undefined, config);
    }

    /**
     * Upload file with progress tracking
     */
    public async uploadFile<T = any>(
        url: string,
        file: any,
        additionalData?: Record<string, any>,
        onProgress?: (progress: number) => void
    ): Promise<APIResponse<T>> {
        const FormData = require('form-data');
        const formData = new FormData();

        formData.append('file', file);

        if (additionalData) {
            Object.keys(additionalData).forEach(key => {
                const value = additionalData[key];
                // Skip function values as they cannot be serialized in FormData
                if (typeof value === 'function') {
                    return;
                }
                // Convert objects to JSON strings
                if (typeof value === 'object' && value !== null) {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            });
        }

        const config: AxiosRequestConfig = {
            headers: {
                ...formData.getHeaders?.() || {},
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress ? (progressEvent) => {
                const progress = Math.round(
                    (progressEvent.loaded * 100) / (progressEvent.total || 1)
                );
                onProgress(progress);
            } : undefined
        };

        return this.post<T>(url, formData, config);
    }

    /**
     * Get current configuration
     */
    public getConfig(): Readonly<Required<SDKConfiguration>> {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<SDKConfiguration>): void {
        // Safely merge configurations with proper type handling
        const mergedConfig = deepMerge(this.config, newConfig);

        // Validate that required properties are still present after merge
        if (!mergedConfig.apiKey && !mergedConfig.oauth && !mergedConfig.jwt) {
            throw new ConfigurationError('API key, OAuth configuration, or JWT token is required');
        }

        this.config = mergedConfig as Required<SDKConfiguration>;

        // Recreate HTTP client if necessary
        if (newConfig.baseURL || newConfig.timeout || newConfig.httpClient) {
            this.httpClient = this.createHttpClient();
        }
    }

    /**
     * Set authentication token
     */
    public setAuthToken(token: string): void {
        this.config.apiKey = token;
        this.httpClient.defaults.headers['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Clear authentication
     */
    public clearAuth(): void {
        this.config.apiKey = '';
        delete this.httpClient.defaults.headers['Authorization'];
    }

    /**
     * Get HTTP client instance (for advanced usage)
     */
    public getHttpClient(): AxiosInstance {
        return this.httpClient;
    }
}