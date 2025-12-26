#!/usr/bin/env node

/**
 * CLI tool for rebranding operations
 */

import { createFileScanner, createTextReplacer } from './index.js';
import * as path from 'path';

interface CliOptions {
    command: 'scan' | 'preview' | 'apply' | 'restore';
    rootPath: string;
    dryRun: boolean;
    createBackups: boolean;
    outputFile?: string;
}

async function main() {
    const args = process.argv.slice(2);
    const options: CliOptions = {
        command: 'scan',
        rootPath: process.cwd(),
        dryRun: false,
        createBackups: true
    };

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case 'scan':
            case 'preview':
            case 'apply':
            case 'restore':
                options.command = arg;
                break;
            case '--root':
                options.rootPath = args[++i];
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--no-backups':
                options.createBackups = false;
                break;
            case '--output':
                options.outputFile = args[++i];
                break;
            case '--help':
                printHelp();
                process.exit(0);
                break;
        }
    }

    try {
        await executeCommand(options);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

async function executeCommand(options: CliOptions) {
    const scanner = createFileScanner(options.rootPath);

    switch (options.command) {
        case 'scan':
            await scanCommand(scanner, options);
            break;
        case 'preview':
            await previewCommand(scanner, options);
            break;
        case 'apply':
            await applyCommand(scanner, options);
            break;
        case 'restore':
            await restoreCommand(options);
            break;
    }
}

async function scanCommand(scanner: any, options: CliOptions) {
    console.log('Scanning for brand references...');
    const results = await scanner.scanForBrandReferences();

    console.log(`\nFound ${results.length} files with brand references:`);

    for (const result of results) {
        console.log(`\n${result.filePath} (${result.fileType}):`);
        console.log(`  Brand references: ${result.brandReferences.length}`);
        console.log(`  Package scope references: ${result.packageScopeReferences.length}`);

        if (result.brandReferences.length > 0) {
            console.log('  Brand references:');
            result.brandReferences.forEach(ref => {
                console.log(`    Line ${ref.line}: "${ref.text}"`);
            });
        }

        if (result.packageScopeReferences.length > 0) {
            console.log('  Package scope references:');
            result.packageScopeReferences.forEach(ref => {
                console.log(`    Line ${ref.line}: "${ref.text}"`);
            });
        }
    }

    if (options.outputFile) {
        const fs = await import('fs');
        await fs.promises.writeFile(
            options.outputFile,
            JSON.stringify(results, null, 2),
            'utf-8'
        );
        console.log(`\nResults saved to ${options.outputFile}`);
    }
}

async function previewCommand(scanner: any, options: CliOptions) {
    console.log('Generating replacement preview...');
    const scanResults = await scanner.scanForBrandReferences();
    const replacements = scanner.generateReplacementPlan(scanResults);

    const replacer = createTextReplacer({ dryRun: true });
    const previews = await replacer.previewReplacements(replacements);

    console.log('\nReplacement Preview:');
    console.log('===================');

    for (const preview of previews) {
        console.log(preview);
    }

    console.log(`\nTotal files to modify: ${replacements.length}`);
    console.log(`Total replacements: ${replacements.reduce((sum, r) => sum + r.replacements.length, 0)}`);
}

async function applyCommand(scanner: any, options: CliOptions) {
    console.log('Applying rebranding changes...');
    const scanResults = await scanner.scanForBrandReferences();
    const replacements = scanner.generateReplacementPlan(scanResults);

    const replacer = createTextReplacer({
        dryRun: options.dryRun,
        createBackups: options.createBackups
    });

    const results = await replacer.applyReplacements(replacements);

    console.log('\nRebranding Results:');
    console.log('==================');

    let successCount = 0;
    let errorCount = 0;

    for (const result of results) {
        if (result.success) {
            successCount++;
            console.log(`✓ ${result.filePath}: ${result.replacementCount} replacements`);
            if (result.backupPath) {
                console.log(`  Backup: ${result.backupPath}`);
            }
        } else {
            errorCount++;
            console.log(`✗ ${result.filePath}: ${result.error}`);
        }
    }

    console.log(`\nSummary: ${successCount} successful, ${errorCount} errors`);

    if (options.dryRun) {
        console.log('\nNote: This was a dry run. No files were actually modified.');
    }
}

async function restoreCommand(options: CliOptions) {
    console.log('Restore functionality not yet implemented');
    console.log('Please manually restore from .rebranding-backups directory');
}

function printHelp() {
    console.log(`
Rebranding CLI Tool

Usage: node cli.js <command> [options]

Commands:
  scan      Scan for brand references
  preview   Preview replacement changes
  apply     Apply rebranding changes
  restore   Restore from backups

Options:
  --root <path>     Root directory to scan (default: current directory)
  --dry-run         Preview changes without applying them
  --no-backups      Don't create backup files
  --output <file>   Save scan results to file
  --help            Show this help message

Examples:
  node cli.js scan --root ./src
  node cli.js preview --output scan-results.json
  node cli.js apply --dry-run
  node cli.js apply --no-backups
`);
}

if (require.main === module) {
    main();
}