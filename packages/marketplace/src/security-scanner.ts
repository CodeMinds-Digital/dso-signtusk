/**
 * Security Scanner
 * 
 * Performs comprehensive security scanning of marketplace apps
 * including static analysis, dependency scanning, and vulnerability detection.
 */

import { App } from './types';
import * as crypto from 'node:crypto';
import * as tar from 'tar';

export interface SecurityScanResult {
    passed: boolean;
    score: number; // 0-100
    issues: string[];
    vulnerabilities: SecurityVulnerability[];
    recommendations: string[];
}

export interface SecurityVulnerability {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    location?: string;
    cve?: string;
    fix?: string;
}

export class SecurityScanner {
    private readonly knownVulnerabilities: Map<string, SecurityVulnerability[]> = new Map();
    private readonly maliciousPatterns: RegExp[] = [
        /eval\s*\(/,
        /Function\s*\(/,
        /document\.write/,
        /innerHTML\s*=/,
        /outerHTML\s*=/,
        /execCommand/,
        /setTimeout\s*\(\s*['"`][^'"`]*['"`]/,
        /setInterval\s*\(\s*['"`][^'"`]*['"`]/,
        /new\s+Function/,
        /window\[['"`][^'"`]*['"`]\]/,
        /location\s*=\s*['"`]/,
        /document\.location/,
        /window\.location/
    ];

    constructor() {
        this.initializeVulnerabilityDatabase();
    }

    /**
     * Perform comprehensive security scan of an app
     */
    async scanApp(app: App): Promise<SecurityScanResult> {
        const issues: string[] = [];
        const vulnerabilities: SecurityVulnerability[] = [];
        const recommendations: string[] = [];

        try {
            // 1. Manifest security scan
            await this.scanManifest(app, issues, vulnerabilities, recommendations);

            // 2. Package security scan (if package URL is available)
            if (app.packageUrl) {
                await this.scanPackage(app.packageUrl, issues, vulnerabilities, recommendations);
            }

            // 3. Dependency vulnerability scan
            if (app.manifest.dependencies) {
                await this.scanDependencies(app.manifest.dependencies, vulnerabilities, recommendations);
            }

            // 4. Permission analysis
            await this.analyzePermissions(app.manifest.permissions, issues, recommendations);

            // 5. Sandbox configuration analysis
            await this.analyzeSandboxConfig(app.manifest.sandbox, issues, recommendations);

            // Calculate security score
            const score = this.calculateSecurityScore(issues, vulnerabilities);

            return {
                passed: score >= 70 && vulnerabilities.filter(v => v.severity === 'critical').length === 0,
                score,
                issues,
                vulnerabilities,
                recommendations
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown security scan error';
            issues.push(`Security scan failed: ${errorMessage}`);
            return {
                passed: false,
                score: 0,
                issues,
                vulnerabilities,
                recommendations
            };
        }
    }

    /**
     * Scan app manifest for security issues
     */
    private async scanManifest(
        app: App,
        issues: string[],
        vulnerabilities: SecurityVulnerability[],
        recommendations: string[]
    ): Promise<void> {
        const manifest = app.manifest;

        // Check for suspicious entry points
        if (manifest.entryPoint.includes('..')) {
            vulnerabilities.push({
                severity: 'high',
                type: 'path_traversal',
                description: 'Entry point contains path traversal sequences',
                location: 'manifest.entryPoint'
            });
        }

        // Check for overly permissive permissions
        const dangerousPermissions = [
            'system.admin',
            'file.write',
            'network.unrestricted',
            'database.admin',
            'user.impersonate'
        ];

        for (const permission of manifest.permissions) {
            if (dangerousPermissions.includes(permission)) {
                vulnerabilities.push({
                    severity: 'medium',
                    type: 'excessive_permissions',
                    description: `Dangerous permission requested: ${permission}`,
                    location: 'manifest.permissions'
                });
            }
        }

        // Check sandbox configuration
        if (manifest.sandbox.level === 'basic' && manifest.sandbox.resources.network) {
            issues.push('Network access enabled for basic sandbox level');
            recommendations.push('Consider using standard or strict sandbox level for network access');
        }

        // Check for suspicious URLs
        if (manifest.author.website && !this.isSecureUrl(manifest.author.website)) {
            issues.push('Author website uses insecure protocol');
            recommendations.push('Use HTTPS for all external URLs');
        }

        if (manifest.author.support && !this.isSecureUrl(manifest.author.support)) {
            issues.push('Support URL uses insecure protocol');
            recommendations.push('Use HTTPS for support URLs');
        }
    }

    /**
     * Scan app package for malicious code
     */
    private async scanPackage(
        packageUrl: string,
        issues: string[],
        vulnerabilities: SecurityVulnerability[],
        recommendations: string[]
    ): Promise<void> {
        try {
            // Download and extract package (in a real implementation, this would be done securely)
            const packageContent = await this.downloadPackage(packageUrl);
            const files = await this.extractPackage(packageContent);

            // Scan each file
            for (const [filename, content] of files) {
                await this.scanFileContent(filename, content, vulnerabilities, recommendations);
            }

            // Check package structure
            await this.validatePackageStructure(files, issues, recommendations);

            // Check for suspicious files
            await this.checkSuspiciousFiles(files, issues, vulnerabilities);

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown package scan error';
            issues.push(`Package scan failed: ${errorMessage}`);
        }
    }

    /**
     * Scan file content for security issues
     */
    private async scanFileContent(
        filename: string,
        content: string,
        vulnerabilities: SecurityVulnerability[],
        recommendations: string[]
    ): Promise<void> {
        // Check for malicious patterns
        for (const pattern of this.maliciousPatterns) {
            if (pattern.test(content)) {
                vulnerabilities.push({
                    severity: 'high',
                    type: 'malicious_code',
                    description: `Potentially malicious code pattern found: ${pattern.source}`,
                    location: filename
                });
            }
        }

        // Check for hardcoded secrets
        const secretPatterns = [
            /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`]+['"`]/i,
            /(?:api[_-]?key|apikey)\s*[:=]\s*['"`][^'"`]+['"`]/i,
            /(?:secret|token)\s*[:=]\s*['"`][^'"`]+['"`]/i,
            /(?:private[_-]?key|privatekey)\s*[:=]\s*['"`][^'"`]+['"`]/i
        ];

        for (const pattern of secretPatterns) {
            if (pattern.test(content)) {
                vulnerabilities.push({
                    severity: 'medium',
                    type: 'hardcoded_secret',
                    description: 'Potential hardcoded secret found',
                    location: filename,
                    fix: 'Use environment variables or secure configuration for secrets'
                });
            }
        }

        // Check for SQL injection patterns
        const sqlPatterns = [
            /['"`]\s*\+\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\+\s*['"`]/,
            /query\s*\(\s*['"`][^'"`]*['"`]\s*\+/,
            /execute\s*\(\s*['"`][^'"`]*['"`]\s*\+/
        ];

        for (const pattern of sqlPatterns) {
            if (pattern.test(content)) {
                vulnerabilities.push({
                    severity: 'high',
                    type: 'sql_injection',
                    description: 'Potential SQL injection vulnerability',
                    location: filename,
                    fix: 'Use parameterized queries or prepared statements'
                });
            }
        }

        // Check for XSS patterns
        const xssPatterns = [
            /innerHTML\s*=\s*[^'"`\s][^;]*/,
            /outerHTML\s*=\s*[^'"`\s][^;]*/,
            /document\.write\s*\(\s*[^'"`\s]/,
            /eval\s*\(\s*[^'"`\s]/
        ];

        for (const pattern of xssPatterns) {
            if (pattern.test(content)) {
                vulnerabilities.push({
                    severity: 'high',
                    type: 'xss_vulnerability',
                    description: 'Potential XSS vulnerability',
                    location: filename,
                    fix: 'Sanitize user input and use safe DOM manipulation methods'
                });
            }
        }
    }

    /**
     * Scan dependencies for known vulnerabilities
     */
    private async scanDependencies(
        dependencies: Record<string, string>,
        vulnerabilities: SecurityVulnerability[],
        recommendations: string[]
    ): Promise<void> {
        for (const [packageName, version] of Object.entries(dependencies)) {
            // Check against known vulnerability database
            const packageVulns = this.knownVulnerabilities.get(packageName);
            if (packageVulns) {
                for (const vuln of packageVulns) {
                    if (this.isVersionAffected(version, vuln)) {
                        vulnerabilities.push({
                            ...vuln,
                            location: `dependencies.${packageName}`
                        });
                    }
                }
            }

            // Check for outdated packages
            if (await this.isPackageOutdated(packageName, version)) {
                recommendations.push(`Update ${packageName} to the latest version`);
            }

            // Check for deprecated packages
            if (await this.isPackageDeprecated(packageName)) {
                vulnerabilities.push({
                    severity: 'medium',
                    type: 'deprecated_dependency',
                    description: `Package ${packageName} is deprecated`,
                    location: `dependencies.${packageName}`,
                    fix: 'Replace with a maintained alternative'
                });
            }
        }
    }

    /**
     * Analyze app permissions for security risks
     */
    private async analyzePermissions(
        permissions: string[],
        issues: string[],
        recommendations: string[]
    ): Promise<void> {
        const permissionRisks = {
            'system.admin': 'critical',
            'file.write': 'high',
            'network.unrestricted': 'high',
            'database.admin': 'high',
            'user.impersonate': 'critical',
            'organization.admin': 'high',
            'billing.manage': 'medium',
            'analytics.read': 'low'
        };

        for (const permission of permissions) {
            const risk = permissionRisks[permission as keyof typeof permissionRisks];
            if (risk === 'critical' || risk === 'high') {
                issues.push(`High-risk permission requested: ${permission}`);
                recommendations.push(`Justify the need for ${permission} permission in app documentation`);
            }
        }

        // Check for permission combinations that could be dangerous
        if (permissions.includes('file.write') && permissions.includes('network.unrestricted')) {
            issues.push('Dangerous permission combination: file write + unrestricted network access');
        }

        if (permissions.includes('user.impersonate') && permissions.includes('organization.admin')) {
            issues.push('Dangerous permission combination: user impersonation + organization admin');
        }
    }

    /**
     * Analyze sandbox configuration for security
     */
    private async analyzeSandboxConfig(
        sandbox: any,
        issues: string[],
        recommendations: string[]
    ): Promise<void> {
        // Check resource limits
        if (sandbox.resources.memory > 1024) {
            recommendations.push('Consider reducing memory allocation for better security isolation');
        }

        if (sandbox.resources.cpu > 1.0) {
            recommendations.push('Consider reducing CPU allocation to prevent resource exhaustion');
        }

        // Check timeout settings
        if (sandbox.timeouts.execution > 60000) {
            recommendations.push('Consider shorter execution timeouts to prevent long-running malicious code');
        }

        // Check security level appropriateness
        if (sandbox.level === 'basic' && sandbox.resources.network) {
            issues.push('Network access not recommended for basic sandbox level');
            recommendations.push('Use standard or strict sandbox level for network-enabled apps');
        }
    }

    // Helper methods

    private calculateSecurityScore(issues: string[], vulnerabilities: SecurityVulnerability[]): number {
        let score = 100;

        // Deduct points for issues
        score -= issues.length * 5;

        // Deduct points for vulnerabilities based on severity
        for (const vuln of vulnerabilities) {
            switch (vuln.severity) {
                case 'critical':
                    score -= 30;
                    break;
                case 'high':
                    score -= 20;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 5;
                    break;
            }
        }

        return Math.max(0, score);
    }

    private isSecureUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    private async downloadPackage(url: string): Promise<Buffer> {
        // In a real implementation, this would securely download the package
        // with proper validation, size limits, and virus scanning
        throw new Error('Package download not implemented in this example');
    }

    private async extractPackage(content: Buffer): Promise<Map<string, string>> {
        // In a real implementation, this would safely extract the package
        // with proper path validation and size limits
        const files = new Map<string, string>();

        // Mock implementation
        files.set('index.js', 'console.log("Hello World");');
        files.set('package.json', '{"name": "test", "version": "1.0.0"}');

        return files;
    }

    private async validatePackageStructure(
        files: Map<string, string>,
        issues: string[],
        recommendations: string[]
    ): Promise<void> {
        // Check for required files
        if (!files.has('package.json')) {
            issues.push('Missing package.json file');
        }

        // Check for suspicious file extensions
        const suspiciousExtensions = ['.exe', '.bat', '.sh', '.ps1', '.dll', '.so'];
        for (const filename of files.keys()) {
            for (const ext of suspiciousExtensions) {
                if (filename.endsWith(ext)) {
                    issues.push(`Suspicious file found: ${filename}`);
                }
            }
        }

        // Check for hidden files
        for (const filename of files.keys()) {
            if (filename.startsWith('.') && !filename.startsWith('./')) {
                recommendations.push(`Consider removing hidden file: ${filename}`);
            }
        }
    }

    private async checkSuspiciousFiles(
        files: Map<string, string>,
        issues: string[],
        vulnerabilities: SecurityVulnerability[]
    ): Promise<void> {
        const suspiciousFilenames = [
            'backdoor',
            'exploit',
            'payload',
            'shell',
            'reverse',
            'keylog',
            'trojan',
            'virus'
        ];

        for (const filename of files.keys()) {
            for (const suspicious of suspiciousFilenames) {
                if (filename.toLowerCase().includes(suspicious)) {
                    vulnerabilities.push({
                        severity: 'critical',
                        type: 'suspicious_file',
                        description: `Suspicious filename detected: ${filename}`,
                        location: filename
                    });
                }
            }
        }
    }

    private isVersionAffected(version: string, vulnerability: SecurityVulnerability): boolean {
        // In a real implementation, this would check if the version is affected
        // by comparing against vulnerability version ranges
        return false; // Mock implementation
    }

    private async isPackageOutdated(packageName: string, version: string): Promise<boolean> {
        // In a real implementation, this would check against npm registry
        return false; // Mock implementation
    }

    private async isPackageDeprecated(packageName: string): Promise<boolean> {
        // In a real implementation, this would check deprecation status
        return false; // Mock implementation
    }

    private initializeVulnerabilityDatabase(): void {
        // In a real implementation, this would load from a vulnerability database
        // like the National Vulnerability Database (NVD) or npm audit

        // Mock some common vulnerabilities
        this.knownVulnerabilities.set('lodash', [
            {
                severity: 'high',
                type: 'prototype_pollution',
                description: 'Prototype pollution vulnerability in lodash',
                cve: 'CVE-2019-10744',
                fix: 'Update to lodash version 4.17.12 or later'
            }
        ]);

        this.knownVulnerabilities.set('moment', [
            {
                severity: 'medium',
                type: 'regex_dos',
                description: 'Regular expression denial of service in moment.js',
                cve: 'CVE-2017-18214',
                fix: 'Update to moment version 2.19.3 or later'
            }
        ]);
    }
}