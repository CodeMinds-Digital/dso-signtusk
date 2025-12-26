/**
 * File scanning utilities for rebranding process
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    BRAND_MAPPING,
    PACKAGE_SCOPE_MAPPING,
    FILE_TYPE_PATTERNS,
    EXCLUDED_DIRECTORIES,
    EXCLUDED_FILES,
    FileReplacement
} from './brand-mapping.js';

export interface ScanResult {
    filePath: string;
    fileType: string;
    brandReferences: Array<{
        line: number;
        column: number;
        text: string;
        context: string;
    }>;
    packageScopeReferences: Array<{
        line: number;
        column: number;
        text: string;
        context: string;
    }>;
}

export interface ScanOptions {
    rootPath: string;
    includePatterns?: RegExp[];
    excludePatterns?: RegExp[];
    maxDepth?: number;
}

/**
 * Recursively scans directory for files containing brand references
 */
export class FileScanner {
    private options: ScanOptions;

    constructor(options: ScanOptions) {
        this.options = {
            maxDepth: 10,
            ...options
        };
    }

    /**
     * Scan all files in the project for brand references
     */
    async scanForBrandReferences(): Promise<ScanResult[]> {
        const results: ScanResult[] = [];
        await this.scanDirectory(this.options.rootPath, results, 0);
        return results;
    }

    /**
     * Recursively scan directory
     */
    private async scanDirectory(
        dirPath: string,
        results: ScanResult[],
        depth: number
    ): Promise<void> {
        if (depth > (this.options.maxDepth || 10)) {
            return;
        }

        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(this.options.rootPath, fullPath);

                if (entry.isDirectory()) {
                    if (!this.shouldExcludeDirectory(entry.name)) {
                        await this.scanDirectory(fullPath, results, depth + 1);
                    }
                } else if (entry.isFile()) {
                    if (!this.shouldExcludeFile(entry.name)) {
                        const scanResult = await this.scanFile(fullPath, relativePath);
                        if (scanResult && (
                            scanResult.brandReferences.length > 0 ||
                            scanResult.packageScopeReferences.length > 0
                        )) {
                            results.push(scanResult);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not scan directory ${dirPath}:`, error);
        }
    }

    /**
     * Scan individual file for brand references
     */
    private async scanFile(filePath: string, relativePath: string): Promise<ScanResult | null> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            const brandReferences: ScanResult['brandReferences'] = [];
            const packageScopeReferences: ScanResult['packageScopeReferences'] = [];

            // Scan each line for brand references
            lines.forEach((line, lineIndex) => {
                // Check for brand name variants
                this.findBrandReferences(line, lineIndex, brandReferences);

                // Check for package scope references
                this.findPackageScopeReferences(line, lineIndex, packageScopeReferences);
            });

            return {
                filePath: relativePath,
                fileType: this.getFileType(filePath),
                brandReferences,
                packageScopeReferences
            };
        } catch (error) {
            console.warn(`Warning: Could not read file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Find brand references in a line of text
     */
    private findBrandReferences(
        line: string,
        lineIndex: number,
        references: ScanResult['brandReferences']
    ): void {
        const variants = BRAND_MAPPING.variants;
        const brandNames = [
            BRAND_MAPPING.oldBrand,
            variants.camelCase.old,
            variants.kebabCase.old,
            variants.pascalCase.old,
            variants.lowercase.old,
            variants.uppercase.old,
            variants.snakeCase.old
        ];

        brandNames.forEach(brandName => {
            const regex = new RegExp(brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            let match;

            while ((match = regex.exec(line)) !== null) {
                references.push({
                    line: lineIndex + 1,
                    column: match.index + 1,
                    text: match[0],
                    context: this.getContext(line, match.index, match[0].length)
                });
            }
        });
    }

    /**
     * Find package scope references in a line of text
     */
    private findPackageScopeReferences(
        line: string,
        lineIndex: number,
        references: ScanResult['packageScopeReferences']
    ): void {
        const oldScope = PACKAGE_SCOPE_MAPPING.oldScope;
        const regex = new RegExp(oldScope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        let match;

        while ((match = regex.exec(line)) !== null) {
            references.push({
                line: lineIndex + 1,
                column: match.index + 1,
                text: match[0],
                context: this.getContext(line, match.index, match[0].length)
            });
        }
    }

    /**
     * Get context around a match
     */
    private getContext(line: string, startIndex: number, length: number): string {
        const contextRadius = 20;
        const start = Math.max(0, startIndex - contextRadius);
        const end = Math.min(line.length, startIndex + length + contextRadius);

        let context = line.substring(start, end);
        if (start > 0) context = '...' + context;
        if (end < line.length) context = context + '...';

        return context;
    }

    /**
     * Determine file type based on extension
     */
    private getFileType(filePath: string): string {
        for (const [type, pattern] of Object.entries(FILE_TYPE_PATTERNS)) {
            if (pattern.test(filePath)) {
                return type;
            }
        }
        return 'other';
    }

    /**
     * Check if directory should be excluded
     */
    private shouldExcludeDirectory(dirName: string): boolean {
        return EXCLUDED_DIRECTORIES.includes(dirName) || dirName.startsWith('.');
    }

    /**
     * Check if file should be excluded
     */
    private shouldExcludeFile(fileName: string): boolean {
        return EXCLUDED_FILES.includes(fileName) ||
            fileName.startsWith('.') ||
            fileName.endsWith('.log') ||
            fileName.endsWith('.tmp');
    }

    /**
     * Generate replacement plan from scan results
     */
    generateReplacementPlan(scanResults: ScanResult[]): FileReplacement[] {
        return scanResults.map(result => ({
            filePath: result.filePath,
            replacements: [
                ...result.brandReferences.map(ref => ({
                    oldText: ref.text,
                    newText: this.getBrandReplacement(ref.text),
                    lineNumber: ref.line,
                    context: ref.context
                })),
                ...result.packageScopeReferences.map(ref => ({
                    oldText: ref.text,
                    newText: PACKAGE_SCOPE_MAPPING.newScope,
                    lineNumber: ref.line,
                    context: ref.context
                }))
            ]
        })).filter(replacement => replacement.replacements.length > 0);
    }

    /**
     * Get appropriate brand replacement based on the original text
     */
    private getBrandReplacement(originalText: string): string {
        const variants = BRAND_MAPPING.variants;

        if (originalText === BRAND_MAPPING.oldBrand) {
            return BRAND_MAPPING.newBrand;
        }

        for (const [variantType, variant] of Object.entries(variants)) {
            if (originalText === variant.old) {
                return variant.new;
            }
        }

        // Fallback: try to match case pattern
        if (originalText === originalText.toLowerCase()) {
            return variants.lowercase.new;
        } else if (originalText === originalText.toUpperCase()) {
            return variants.uppercase.new;
        }

        return BRAND_MAPPING.newBrand;
    }
}

/**
 * Utility function to create a file scanner with default options
 */
export function createFileScanner(rootPath: string): FileScanner {
    return new FileScanner({ rootPath });
}