/**
 * Template service for managing document templates
 */

import { BaseService } from './base';
import { Template, PaginatedResponse, ListOptions } from '../types';

export class TemplateService extends BaseService {
    async createTemplate(data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
        return super.create<Template>('/v1/templates', data);
    }

    async getTemplate(templateId: string): Promise<Template> {
        return this.get<Template>(`/v1/templates/${templateId}`);
    }

    async listTemplates(options: ListOptions = {}): Promise<PaginatedResponse<Template>> {
        return this.list<Template>('/v1/templates', options);
    }

    async updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template> {
        return this.update<Template>(`/v1/templates/${templateId}`, updates);
    }

    async deleteTemplate(templateId: string): Promise<void> {
        return this.delete(`/v1/templates/${templateId}`);
    }

    async duplicate(templateId: string, name: string): Promise<Template> {
        return this.create<Template>(`/v1/templates/${templateId}/duplicate`, { name });
    }

    async share(templateId: string, permissions: any): Promise<void> {
        return this.create<void>(`/v1/templates/${templateId}/share`, permissions);
    }
}