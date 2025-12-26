/**
 * Organization service for managing organizations
 */

import { BaseService } from './base';
import { Organization, PaginatedResponse, ListOptions } from '../types';

export class OrganizationService extends BaseService {
    async getOrganization(organizationId?: string): Promise<Organization> {
        const endpoint = organizationId ? `/v1/organizations/${organizationId}` : '/v1/organizations/current';
        return this.get<Organization>(endpoint);
    }

    async updateOrganization(updates: Partial<Organization>): Promise<Organization> {
        return this.update<Organization>('/v1/organizations/current', updates);
    }

    async getMembers(options: ListOptions = {}): Promise<PaginatedResponse<any>> {
        return this.list<any>('/v1/organizations/current/members', options);
    }

    async inviteMember(email: string, roles: string[]): Promise<void> {
        return this.create<void>('/v1/organizations/current/members/invite', { email, roles });
    }

    async removeMember(userId: string): Promise<void> {
        return this.delete(`/v1/organizations/current/members/${userId}`);
    }

    async updateMemberRoles(userId: string, roles: string[]): Promise<void> {
        return this.patch<void>(`/v1/organizations/current/members/${userId}`, { roles });
    }

    async getUsage(): Promise<any> {
        return this.get<any>('/v1/organizations/current/usage');
    }

    async getBilling(): Promise<any> {
        return this.get<any>('/v1/organizations/current/billing');
    }
}