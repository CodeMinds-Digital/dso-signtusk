/**
 * Base service class for all SDK services
 */

import { DocuSignAlternativeSDK } from '../client';
import { APIResponse, PaginatedResponse, ListOptions } from '../types';

export abstract class BaseService {
    protected client: DocuSignAlternativeSDK;

    constructor(client: DocuSignAlternativeSDK) {
        this.client = client;
    }

    /**
     * Build query string from parameters
     */
    protected buildQueryString(params: Record<string, any>): string {
        const searchParams = new URLSearchParams();

        Object.keys(params).forEach(key => {
            const value = params[key];
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(key, String(item)));
                } else if (typeof value === 'object') {
                    searchParams.append(key, JSON.stringify(value));
                } else {
                    searchParams.append(key, String(value));
                }
            }
        });

        const queryString = searchParams.toString();
        return queryString ? `?${queryString}` : '';
    }

    /**
     * Handle paginated list requests
     */
    protected async list<T>(
        endpoint: string,
        options: ListOptions = {}
    ): Promise<PaginatedResponse<T>> {
        const queryString = this.buildQueryString(options);
        const response = await this.client.get<PaginatedResponse<T>>(`${endpoint}${queryString}`);
        return response.data;
    }

    /**
     * Handle single resource retrieval
     */
    protected async get<T>(endpoint: string): Promise<T> {
        const response = await this.client.get<T>(endpoint);
        return response.data;
    }

    /**
     * Handle resource creation
     */
    protected async create<T>(endpoint: string, data: any): Promise<T> {
        const response = await this.client.post<T>(endpoint, data);
        return response.data;
    }

    /**
     * Handle resource updates
     */
    protected async update<T>(endpoint: string, data: any): Promise<T> {
        const response = await this.client.put<T>(endpoint, data);
        return response.data;
    }

    /**
     * Handle partial resource updates
     */
    protected async patch<T>(endpoint: string, data: any): Promise<T> {
        const response = await this.client.patch<T>(endpoint, data);
        return response.data;
    }

    /**
     * Handle resource deletion
     */
    protected async delete(endpoint: string): Promise<void> {
        await this.client.delete(endpoint);
    }

    /**
     * Handle file uploads
     */
    protected async upload<T>(
        endpoint: string,
        file: any,
        additionalData?: Record<string, any>,
        onProgress?: (progress: number) => void
    ): Promise<T> {
        const response = await this.client.uploadFile<T>(endpoint, file, additionalData, onProgress);
        return response.data;
    }
}