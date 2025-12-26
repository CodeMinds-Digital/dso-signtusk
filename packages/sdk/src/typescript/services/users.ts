/**
 * User service for managing users
 */

import { BaseService } from './base';
import { User, PaginatedResponse, ListOptions } from '../types';

export class UserService extends BaseService {
    async getUser(userId?: string): Promise<User> {
        const endpoint = userId ? `/v1/users/${userId}` : '/v1/users/me';
        return this.get<User>(endpoint);
    }

    async updateUser(updates: Partial<User>): Promise<User> {
        return this.update<User>('/v1/users/me', updates);
    }

    async listUsers(options: ListOptions = {}): Promise<PaginatedResponse<User>> {
        return this.list<User>('/v1/users', options);
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        return this.create<void>('/v1/users/me/change-password', {
            currentPassword,
            newPassword
        });
    }

    async uploadAvatar(file: any): Promise<{ avatarUrl: string }> {
        return this.upload<{ avatarUrl: string }>('/v1/users/me/avatar', file);
    }

    async enableTwoFactor(): Promise<{ qrCode: string; backupCodes: string[] }> {
        return this.create<{ qrCode: string; backupCodes: string[] }>('/v1/users/me/2fa/enable', {});
    }

    async verifyTwoFactor(token: string): Promise<void> {
        return this.create<void>('/v1/users/me/2fa/verify', { token });
    }

    async disableTwoFactor(token: string): Promise<void> {
        return this.create<void>('/v1/users/me/2fa/disable', { token });
    }
}