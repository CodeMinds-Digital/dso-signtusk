/**
 * App Validator
 * 
 * Validates app manifests, configurations, and ensures compliance
 * with marketplace standards and security requirements.
 */

import { AppManifest, AppManifestSchema } from './types';
import semver from 'semver';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export class AppValidator {
    private readonly maxManifestSize = 1024 * 1024; // 1MB
    private readonly allowedFileExtensions = ['.js', '.ts', '.json', '.md', '.txt', '.html', '.css'];
    private readonly blockedKeywords = [
        'eval',
        'Function',
        'setTimeout',
        'setInterval',
        'XMLHttpRequest',
        'fetch',
        'require',
        'import',
        'process',
        '__dirname',
        '__filename'
    ];

    /**
     * Validate app manifest
     */
    async validateManifest(manifest: AppManifest): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Schema validation
            const schemaResult = AppManifestSchema.safeParse(manifest);
            if (!schemaResult.success) {
                errors.push(...schemaResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
            }

            // Additional business logic validation
            await this.validateBusinessRules(manifest, errors, warnings);

            // Security validation
            await this.validateSecurity(manifest, errors, warnings);

            // Performance validation
            await this.validatePerformance(manifest, errors, warnings);

            return {
                valid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
            errors.push(`Validation error: ${errorMessage}`);
            return { valid: false, errors, warnings };
        }
    }

    /**
     * Validate app configuration
     */
    async validateConfiguration(manifest: AppManifest, config: Record<string, any>): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Validate configuration against manifest requirements
            if (manifest.permissions) {
                for (const permission of manifest.permissions) {
                    if (permission.startsWith('config.') && !config[permission.replace('config.', '')]) {
                        errors.push(`Required configuration missing: ${permission}`);
                    }
                }
            }

            // Validate configuration values
            for (const [key, value] of Object.entries(config)) {
                if (typeof value === 'string' && value.length > 10000) {
                    errors.push(`Configuration value too long: ${key}`);
                }

                if (typeof value === 'object' && JSON.stringify(value).length > 50000) {
                    errors.push(`Configuration object too large: ${key}`);
                }

                // Check for potentially dangerous values
                if (typeof value === 'string' && this.containsDangerousContent(value)) {
                    errors.push(`Configuration contains potentially dangerous content: ${key}`);
                }
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown configuration validation error';
            errors.push(`Configuration validation error: ${errorMessage}`);
            return { valid: false, errors, warnings };
        }
    }

    /**
     * Validate app code for security issues
     */
    async validateCode(code: string): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Check for blocked keywords
            for (const keyword of this.blockedKeywords) {
                if (code.includes(keyword)) {
                    errors.push(`Blocked keyword found: ${keyword}`);
                }
            }

            // Check for suspicious patterns
            const suspiciousPatterns = [
                /require\s*\(\s*['"`]child_process['"`]\s*\)/,
                /require\s*\(\s*['"`]fs['"`]\s*\)/,
                /require\s*\(\s*['"`]os['"`]\s*\)/,
                /require\s*\(\s*['"`]path['"`]\s*\)/,
                /process\.env/,
                /process\.exit/,
                /process\.kill/,
                /Buffer\.from/,
                /new\s+Function/,
                /eval\s*\(/,
                /setTimeout\s*\(/,
                /setInterval\s*\(/
            ];

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(code)) {
                    errors.push(`Suspicious code pattern detected: ${pattern.source}`);
                }
            }

            // Check code complexity
            const lines = code.split('\n');
            if (lines.length > 10000) {
                warnings.push('Code is very long, consider breaking into smaller modules');
            }

            // Check for excessive nesting
            let maxNesting = 0;
            let currentNesting = 0;
            for (const line of lines) {
                const openBraces = (line.match(/{/g) || []).length;
                const closeBraces = (line.match(/}/g) || []).length;
                currentNesting += openBraces - closeBraces;
                maxNesting = Math.max(maxNesting, currentNesting);
            }

            if (maxNesting > 10) {
                warnings.push('Code has excessive nesting, consider refactoring');
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown code validation error';
            errors.push(`Code validation error: ${errorMessage}`);
            return { valid: false, errors, warnings };
        }
    }

    // Private validation methods

    private async validateBusinessRules(manifest: AppManifest, errors: string[], warnings: string[]): Promise<void> {
        // Name validation with improved edge case handling
        const trimmedName = manifest.name.trim();
        if (trimmedName.length < 3) {
            errors.push('App name must be at least 3 characters long (excluding whitespace)');
        }

        if (manifest.name.length > 50) {
            errors.push('App name must be less than 50 characters');
        }

        if (!/^[a-zA-Z0-9\s\-_]+$/.test(manifest.name)) {
            errors.push('App name contains invalid characters');
        }

        // Check for whitespace-only names
        if (trimmedName.length === 0) {
            errors.push('App name cannot be empty or contain only whitespace');
        }

        // Version validation
        if (!semver.valid(manifest.version)) {
            errors.push('Invalid semantic version format');
        }

        // Description validation with improved handling
        const trimmedDescription = manifest.description.trim();
        if (trimmedDescription.length < 10) {
            errors.push('App description must be at least 10 characters long (excluding whitespace)');
        }

        if (manifest.description.length > 1000) {
            errors.push('App description is too long (max 1000 characters)');
        }

        // Author validation
        if (!manifest.author.email.includes('@')) {
            errors.push('Invalid author email format');
        }

        if (manifest.author.website && !this.isValidUrl(manifest.author.website)) {
            errors.push('Invalid author website URL');
        }

        // Pricing validation with better edge case handling
        if (manifest.pricing.model !== 'free' && !manifest.pricing.price) {
            errors.push('Price is required for paid apps');
        }

        if (manifest.pricing.price !== undefined && manifest.pricing.price < 0) {
            errors.push('Price cannot be negative');
        }

        if (manifest.pricing.price && manifest.pricing.price > 10000) {
            warnings.push('Price is quite high, this may limit adoption');
        }

        // Platform version validation
        if (!semver.valid(manifest.minPlatformVersion)) {
            errors.push('Invalid minimum platform version format');
        }

        if (manifest.maxPlatformVersion && !semver.valid(manifest.maxPlatformVersion)) {
            errors.push('Invalid maximum platform version format');
        }
    }

    private async validateSecurity(manifest: AppManifest, errors: string[], warnings: string[]): Promise<void> {
        // Permission validation
        const dangerousPermissions = [
            'system.admin',
            'file.write',
            'network.unrestricted',
            'database.admin'
        ];

        for (const permission of manifest.permissions) {
            if (dangerousPermissions.includes(permission)) {
                warnings.push(`Dangerous permission requested: ${permission}`);
            }
        }

        // Sandbox validation
        if (manifest.sandbox.resources.memory > 2048) {
            errors.push('Memory allocation too high (max 2048MB)');
        }

        if (manifest.sandbox.resources.cpu > 2.0) {
            errors.push('CPU allocation too high (max 2.0 cores)');
        }

        if (manifest.sandbox.resources.storage > 1000) {
            errors.push('Storage allocation too high (max 1000MB)');
        }

        if (manifest.sandbox.resources.network && manifest.sandbox.level === 'basic') {
            warnings.push('Network access not recommended for basic sandbox level');
        }

        // Timeout validation
        if (manifest.sandbox.timeouts.execution > 300000) {
            errors.push('Execution timeout too high (max 5 minutes)');
        }

        if (manifest.sandbox.timeouts.idle > 600000) {
            errors.push('Idle timeout too high (max 10 minutes)');
        }
    }

    private async validatePerformance(manifest: AppManifest, errors: string[], warnings: string[]): Promise<void> {
        // Asset validation
        if (manifest.assets && manifest.assets.length > 100) {
            warnings.push('Large number of assets may impact loading performance');
        }

        // Dependencies validation
        if (manifest.dependencies) {
            const depCount = Object.keys(manifest.dependencies).length;
            if (depCount > 50) {
                warnings.push('Large number of dependencies may impact performance');
            }

            // Check for known problematic dependencies
            const problematicDeps = ['lodash', 'moment', 'jquery'];
            for (const dep of problematicDeps) {
                if (manifest.dependencies[dep]) {
                    warnings.push(`Consider using lighter alternatives to ${dep}`);
                }
            }
        }

        // Entry point validation
        if (!manifest.entryPoint.endsWith('.js') && !manifest.entryPoint.endsWith('.ts')) {
            errors.push('Entry point must be a JavaScript or TypeScript file');
        }
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    private containsDangerousContent(content: string): boolean {
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /data:text\/html/i,
            /vbscript:/i,
            /onload=/i,
            /onerror=/i,
            /onclick=/i
        ];

        return dangerousPatterns.some(pattern => pattern.test(content));
    }
}