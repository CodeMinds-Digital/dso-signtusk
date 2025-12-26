import { AuthService, User, AuthResult } from './types';

/**
 * Simple authentication service implementation for infrastructure package
 * This is a basic implementation that can be replaced with a more sophisticated one
 */
export class SimpleAuthService implements AuthService {
    private users: Map<string, User> = new Map();
    private tokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
    private jwtSecret: string;

    constructor(jwtSecret: string) {
        this.jwtSecret = jwtSecret;
    }

    async register(data: { email: string; password: string; name: string }): Promise<User> {
        const user: User = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: data.email,
            name: data.name,
            createdAt: new Date(),
        };

        this.users.set(user.id, user);
        return user;
    }

    async authenticate(email: string, password: string): Promise<AuthResult> {
        // Find user by email
        const user = Array.from(this.users.values()).find(u => u.email === email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // In a real implementation, you would verify the password hash
        // For now, we'll just generate a token
        const token = await this.generateToken(user);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        return {
            user,
            token,
            expiresAt,
        };
    }

    async validateToken(token: string): Promise<User | null> {
        const tokenData = this.tokens.get(token);
        if (!tokenData || tokenData.expiresAt < new Date()) {
            return null;
        }

        return this.users.get(tokenData.userId) || null;
    }

    async generateToken(user: User): Promise<string> {
        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        this.tokens.set(token, {
            userId: user.id,
            expiresAt,
        });

        return token;
    }
}