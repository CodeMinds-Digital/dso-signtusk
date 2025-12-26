#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface PackageJson {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    [key: string]: any;
}

const OLD_SCOPE = '@signtusk';
const NEW_SCOPE = '@signtusk';

/**
 * Update package scope in a package.json object
 */
function updatePackageScope(packageJson: PackageJson): PackageJson {
    const updated = { ...packageJson };

    // Update package name
    if (updated.name && updated.name.startsWith(OLD_SCOPE)) {
        updated.name = updated.name.replace(OLD_SCOPE, NEW_SCOPE);
    }

    // Update dependencies
    if (updated.dependencies) {
        updated.dependencies = updateDependencyScope(updated.dependencies);
    }

    // Update devDependencies
    if (updated.devDependencies) {
        updated.devDependencies = updateDependencyScope(updated.devDependencies);
    }

    // Update peerDependencies
    if (updated.peerDependencies) {
        updated.peerDependencies = updateDependencyScope(updated.peerDependencies);
    }

    return updated;
}

/**
 * Update dependency scope in a dependencies object
 */
function updateDependencyScope(dependencies: Record<string, string>): Record<string, string> {
    const updated: Record<string, string> = {};

    for (const [depName, version] of Object.entries(dependencies)) {
        if (depName.startsWith(OLD_SCOPE)) {
            const newDepName = depName.replace(OLD_SCOPE, NEW_SCOPE);
            updated[newDepName] = version;
        } else {
            updated[depName] = version;
        }
    }

    return updated;
}

/**
 * Update a single package.json file
 */
async function updatePackageJsonFile(filePath: string): Promise<void> {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const packageJson: PackageJson = JSON.parse(content);

        // Check if this file needs updating
        const needsUpdate =
            (packageJson.name && packageJson.name.includes(OLD_SCOPE)) ||
            (packageJson.dependencies && Object.keys(packageJson.dependencies).some(dep => dep.startsWith(OLD_SCOPE))) ||
            (packageJson.devDependencies && Object.keys(packageJson.devDependencies).some(dep => dep.startsWith(OLD_SCOPE))) ||
            (packageJson.peerDependencies && Object.keys(packageJson.peerDependencies).some(dep => dep.startsWith(OLD_SCOPE)));

        if (!needsUpdate) {
            console.log(`✓ ${filePath} - No updates needed`);
            return;
        }

        const updatedPackageJson = updatePackageScope(packageJson);
        const updatedContent = JSON.stringify(updatedPackageJson, null, 2) + '\n';

        fs.writeFileSync(filePath, updatedContent, 'utf-8');
        console.log(`✓ ${filePath} - Updated successfully`);

        // Log changes
        if (packageJson.name !== updatedPackageJson.name) {
            console.log(`  - Name: ${packageJson.name} → ${updatedPackageJson.name}`);
        }

        const logDependencyChanges = (
            oldDeps: Record<string, string> | undefined,
            newDeps: Record<string, string> | undefined,
            type: string
        ) => {
            if (!oldDeps || !newDeps) return;

            const oldScopeDeps = Object.keys(oldDeps).filter(dep => dep.startsWith(OLD_SCOPE));
            const newScopeDeps = Object.keys(newDeps).filter(dep => dep.startsWith(NEW_SCOPE));

            if (oldScopeDeps.length > 0) {
                console.log(`  - ${type}: Updated ${oldScopeDeps.length} internal dependencies`);
            }
        };

        logDependencyChanges(packageJson.dependencies, updatedPackageJson.dependencies, 'Dependencies');
        logDependencyChanges(packageJson.devDependencies, updatedPackageJson.devDependencies, 'DevDependencies');
        logDependencyChanges(packageJson.peerDependencies, updatedPackageJson.peerDependencies, 'PeerDependencies');

    } catch (error) {
        console.error(`✗ ${filePath} - Error updating:`, error);
        throw error;
    }
}

/**
 * Find all package.json files in the project
 */
async function findPackageJsonFiles(): Promise<string[]> {
    const files = await glob('**/package.json', {
        cwd: process.cwd(),
        ignore: [
            'node_modules/**',
            '**/node_modules/**',
            '.turbo/**',
            '**/dist/**',
            '**/build/**'
        ]
    });

    return files;
}

/**
 * Main function to update all package.json files
 */
async function main(): Promise<void> {
    console.log('🔄 Starting package.json scope update...');
    console.log(`   ${OLD_SCOPE} → ${NEW_SCOPE}`);
    console.log('');

    try {
        const packageJsonFiles = await findPackageJsonFiles();
        console.log(`📦 Found ${packageJsonFiles.length} package.json files`);
        console.log('');

        let updatedCount = 0;
        let errorCount = 0;

        for (const file of packageJsonFiles) {
            try {
                await updatePackageJsonFile(file);
                updatedCount++;
            } catch (error) {
                errorCount++;
            }
        }

        console.log('');
        console.log('📊 Summary:');
        console.log(`   ✓ ${updatedCount} files processed`);
        console.log(`   ✗ ${errorCount} errors`);

        if (errorCount > 0) {
            process.exit(1);
        } else {
            console.log('');
            console.log('🎉 Package scope update completed successfully!');
        }

    } catch (error) {
        console.error('❌ Failed to update package scopes:', error);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    main().catch(console.error);
}

export { updatePackageScope, updateDependencyScope, updatePackageJsonFile };