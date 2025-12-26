/**
 * Analytics service for retrieving analytics data
 */

import { BaseService } from './base';
import { AnalyticsData, AnalyticsQuery } from '../types';

export class AnalyticsService extends BaseService {
    async query(query: AnalyticsQuery): Promise<AnalyticsData[]> {
        return this.create<AnalyticsData[]>('/v1/analytics/query', query);
    }

    async getDashboard(): Promise<any> {
        return this.get<any>('/v1/analytics/dashboard');
    }

    async getDocumentMetrics(documentId: string): Promise<any> {
        return this.get<any>(`/v1/analytics/documents/${documentId}`);
    }

    async getSigningMetrics(requestId: string): Promise<any> {
        return this.get<any>(`/v1/analytics/signing/${requestId}`);
    }

    async getUsageReport(startDate: string, endDate: string): Promise<any> {
        const queryString = this.buildQueryString({ startDate, endDate });
        return this.get<any>(`/v1/analytics/usage${queryString}`);
    }
}