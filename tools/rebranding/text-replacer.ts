/**
 * Safe text replacement functions for rebranding process
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileReplacement } from './brand-mapping.js';

export interface ReplacementResult {
    filePath: string;
    success: boolean;
    error?: string;
    replacementCount: number;
    backupPath?: string;
}

export interface ReplacementOptions {
    createBackups: boolean;
    dryRun: boolean;
    validateSyntax: boolean;
    backupDirectory?: string;
}

/**
 * Safe text replacement service with backup and validation
 */
export class TextReplacer {
    private options: ReplacementOptions;

    constructor(options: Partial<ReplacementOptions> = {}) {
        this.options = {
            createBackups: true,
            dryRun: false,
            validateSyntax: true,
            backupDirectory: '.rebranding-backups',
            ...options
        };
    }

    /**
     * Apply all file replacements
     */
    async applyReplacements(replacements: FileReplacement[]): Promise<ReplacementResult[]> {
        const results: ReplacementResult[] = [];

        // Create backup directory if needed
        if (this.options.createBackups && !this.options.dryRun) {
            await this.ensureBackupDirectory();
        }

        for (const replacement of replacements) {
            const result = await this.applyFileReplacement(replacement);
            results.push(result);
        }

        return results;
    }

    /**
     * Apply replacements to a single file
     */
    private async applyFileReplacement(replacement: FileReplacement): Promise<ReplacementResult> {
        try {
            const filePath = replacement.filePath;
            const fullPath = path.resolve(filePath);

            // Read original content
            const originalContent = await fs.promises.readFile(fullPath, 'utf-8');

            // Apply replacements
            let newContent = originalContent;
            let replacementCount = 0;

            // Sort replacements by line number (descending) to avoid offset issues
            const sortedReplacements = [...replacement.replacements].sort(
                (a, b) => b.lineNumber - a.lineNumber
            );

            for (const rep of sortedReplacements) {
                const beforeCount = (newContent.match(new RegExp(
                    rep.oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'
                )) || []).length;

                newContent = newContent.replace(
                    new RegExp(rep.oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                    rep.newText
                );

                const afterCount = (newContent.match(new RegExp(
                    rep.newText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'
                )) || []).length;

                replacementCount += beforeCount;
            }

            // Validate syntax if requested
            if (this.options.validateSyntax) {
                const validationError = await this.validateSyntax(filePath, newContent);
                if (validationError) {
                    return {
                        filePath,
                        success: false,
                        error: `Syntax validation failed: ${validationError}`,
                        replacementCount: 0
                    };
                }
            }

            // Create backup if requested
            let backupPath: string | undefined;
            if (this.options.createBackups && !this.options.dryRun) {
                backupPath = await this.createBackup(filePath, originalContent);
            }

            // Apply changes (unless dry run)
            if (!this.options.dryRun) {
                await fs.promises.writeFile(fullPath, newContent, 'utf-8');
            }

            return {
                filePath,
                success: true,
                replacementCount,
                backupPath
            };

        } catch (error) {
            return {
                filePath: replacement.filePath,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                replacementCount: 0
            };
        }
    }

    /**
     * Validate syntax for specific file types
     */
    private async validateSyntax(filePath: string, content: string): Promise<string | null> {
        const ext = path.extname(filePath).toLowerCase();

        try {
            switch (ext) {
                case '.json':
                    JSON.parse(content);
                    break;

                case '.ts':
                case '.tsx':
                    // Basic TypeScript syntax validation
                    if (!this.isValidTypeScriptSyntax(content)) {
                        return 'Invalid TypeScript syntax detected';
                    }
                    break;

                case '.js':
                case '.jsx':
                    // Basic JavaScript syntax validation
                    if (!this.isValidJavaScriptSyntax(content)) {
                        return 'Invalid JavaScript syntax detected';
                    }
                    break;

                case '.yml':
                case '.yaml':
                    // Basic YAML validation (check for proper indentation)
                    if (!this.isValidYamlSyntax(content)) {
                        return 'Invalid YAML syntax detected';
                    }
                    break;
            }

            return null;
        } catch (error) {
            return error instanceof Error ? error.message : String(error);
        }
    }

    /**
     * Basic TypeScript syntax validation
     */
    private isValidTypeScriptSyntax(content: string): boolean {
        // Check for balanced brackets
        const brackets = { '(': ')', '[': ']', '{': '}' };
        const stack: string[] = [];

        for (const char of content) {
            if (char in brackets) {
                stack.push(brackets[char as keyof typeof brackets]);
            } else if (Object.values(brackets).includes(char)) {
                if (stack.pop() !== char) {
                    return false;
                }
            }
        }

        return stack.length === 0;
    }

    /**
     * Basic JavaScript syntax validation
     */
    private isValidJavaScriptSyntax(content: string): boolean {
        return this.isValidTypeScriptSyntax(content);
    }

    /**
     * Basic YAML syntax validation
     */
    private isValidYamlSyntax(content: string): boolean {
        const lines = content.split('\n');

        for (const line of lines) {
            // Skip empty lines and comments
            if (line.trim() === '' || line.trim().startsWith('#')) {
                continue;
            }

            // Check for proper indentation (spaces only, consistent)
            const leadingSpaces = line.match(/^( *)/)?.[1].length || 0;
            if (line.includes('\t')) {
                return false; // No tabs allowed in YAML
            }

            // Check for proper key-value format
            if (line.includes(':') && !line.trim().startsWith('-')) {
                const colonIndex = line.indexOf(':');
                if (colonIndex === line.length - 1 || line[colonIndex + 1] === ' ') {
                    continue; // Valid key-value pair
                } else {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Create backup of original file
     */
    private async createBackup(filePath: string, content: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `${path.basename(filePath)}.${timestamp}.backup`;
        const backupPath = path.join(this.options.backupDirectory!, backupFileName);

        await fs.promises.writeFile(backupPath, content, 'utf-8');
        return backupPath;
    }

    /**
     * Ensure backup directory exists
     */
    private async ensureBackupDirectory(): Promise<void> {
        if (this.options.backupDirectory) {
            try {
                await fs.promises.mkdir(this.options.backupDirectory, { recursive: true });
            } catch (error) {
                // Directory might already exist, ignore error
            }
        }
    }

    /**
     * Restore files from backups
     */
    async restoreFromBackups(backupPaths: string[]): Promise<ReplacementResult[]> {
        const results: ReplacementResult[] = [];

        for (const backupPath of backupPaths) {
            try {
                const backupContent = await fs.promises.readFile(backupPath, 'utf-8');

                // Extract original file path from backup name
                const backupFileName = path.basename(backupPath);
                const originalFileName = backupFileName.split('.').slice(0, -2).join('.');
                const originalPath = path.join(path.dirname(backupPath), '..', originalFileName);

                await fs.promises.writeFile(originalPath, backupContent, 'utf-8');

                results.push({
                    filePath: originalPath,
                    success: true,
                    replacementCount: 0
                });
            } catch (error) {
                results.push({
                    filePath: backupPath,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    replacementCount: 0
                });
            }
        }

        return results;
    }

    /**
     * Preview replacements without applying them
     */
    async previewReplacements(replacements: FileReplacement[]): Promise<string[]> {
        const previews: string[] = [];

        for (const replacement of replacements) {
            const preview = [
                `File: ${replacement.filePath}`,
                `Replacements: ${replacement.replacements.length}`,
                ''
            ];

            for (const rep of replacement.replacements) {
                preview.push(
                    `  Line ${rep.lineNumber}: "${rep.oldText}" → "${rep.newText}"`,
                    `  Context: ${rep.context}`,
                    ''
                );
            }

            previews.push(preview.join('\n'));
        }

        return previews;
    }
}

/**
 * Utility function to create a text replacer with default options
 */
export function createTextReplacer(options?: Partial<ReplacementOptions>): TextReplacer {
    return new TextReplacer(options);
}