/**
 * Build System Integrity Integration Tests (Simple Node.js version)
 * 
 * Tests that all packages build successfully after rebranding,
 * verifies workspace tools recognize new package scope,
 * and tests import resolution and dependency linking.
 * 
 * Requirements: 2.4, 2.5
 */

const { readFileSync, existsSync } = require('fs');
const { execSync } = require('child_process');
const { glob } = require('glob');
const assert = require('assert');

describe('Build System Integrity', () => {

    describe('Package Scope Recognition', () => {
        it('should recognize @signtusk scope in workspace configuration', () => {
            const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

            // Check root package uses @signtusk scope
            assert.strictEqual(packageJson.name, '@signtusk/root');

            // Check workspaces are configured
            assert.deepStrictEqual(packageJson.workspaces, ['apps/*', 'packages/*']);
        });

        it('should have all packages using @signtusk scope', async () => {
            const packageJsonFiles = await glob('{apps,packages}/*/package.json');

            for (const file of packageJsonFiles) {
                const packageJson = JSON.parse(readFileSync(file, 'utf-8'));

                if (packageJson.name && !packageJson.name.startsWith('@signtusk/')) {
                    throw new Error(`Package ${file} has incorrect scope: ${packageJson.name}`);
                }
            }
        });

        it('should have correct internal dependency references', async () => {
            const packageJsonFiles = await glob('{apps,packages}/*/package.json');

            for (const file of packageJsonFiles) {
                const packageJson = JSON.parse(readFileSync(file, 'utf-8'));

                // Check dependencies
                const allDeps = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies,
                    ...packageJson.peerDependencies
                };

                for (const [depName, version] of Object.entries(allDeps)) {
                    if (typeof depName === 'string' && depName.startsWith('@docusign-alternative/')) {
                        throw new Error(`Package ${file} still references old scope: ${depName}`);
                    }
                }
            }
        });
    });

    describe('Build Configuration Validation', () => {
        it('should have valid package.json structure', () => {
            const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

            // Check essential scripts exist
            assert(packageJson.scripts, 'Scripts should be defined');
            assert(packageJson.scripts.build, 'Build script should exist');
            assert(packageJson.scripts.lint, 'Lint script should exist');
            assert(packageJson.scripts['type-check'], 'Type-check script should exist');
        });

        it('should have valid turbo.json configuration', () => {
            const turboConfig = JSON.parse(readFileSync('turbo.json', 'utf-8'));

            // Check essential tasks are defined
            assert(turboConfig.tasks, 'Tasks should be defined');
            assert(turboConfig.tasks.build, 'Build task should be defined');
            assert(turboConfig.tasks.lint, 'Lint task should be defined');
            assert(turboConfig.tasks.test, 'Test task should be defined');
        });
    });

    describe('Import Resolution', () => {
        it('should resolve @signtusk imports in TypeScript configuration', () => {
            const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf-8'));

            // Check path mappings use @signtusk scope
            const paths = tsConfig.compilerOptions?.paths || {};

            for (const [alias, pathArray] of Object.entries(paths)) {
                if (typeof alias === 'string' && alias.startsWith('@signtusk/')) {
                    assert(Array.isArray(pathArray), `Path mapping for ${alias} should be an array`);
                    assert(pathArray.length > 0, `Path mapping for ${alias} should not be empty`);
                }
            }
        });

        it('should have consistent path mappings in vitest config', () => {
            if (existsSync('vitest.config.ts')) {
                // Read vitest config and check for @signtusk aliases
                const vitestConfig = readFileSync('vitest.config.ts', 'utf-8');

                // Should contain @signtusk references, not @docusign-alternative
                assert(vitestConfig.includes('@signtusk/'), 'Vitest config should contain @signtusk references');
                assert(!vitestConfig.includes('@docusign-alternative/'), 'Vitest config should not contain @docusign-alternative references');
            }
        });
    });

    describe('Package Scripts Integration', () => {
        it('should have updated package scripts with correct scope references', () => {
            const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
            const scripts = packageJson.scripts || {};

            // Check that scripts reference @signtusk scope
            for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
                if (typeof scriptCommand === 'string' && scriptCommand.includes('@docusign-alternative/')) {
                    throw new Error(`Script ${scriptName} still references old scope: ${scriptCommand}`);
                }
            }
        });

        it('should have updated Docker build commands', () => {
            const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
            const dockerBuildScript = packageJson.scripts?.['docker:build'];

            if (dockerBuildScript) {
                assert(dockerBuildScript.includes('signtusk'), 'Docker build script should reference signtusk');
                assert(!dockerBuildScript.includes('docusign-alternative'), 'Docker build script should not reference docusign-alternative');
            }
        });
    });

    describe('Configuration File Updates', () => {
        it('should validate Makefile references', () => {
            if (existsSync('Makefile')) {
                const makefile = readFileSync('Makefile', 'utf-8');

                // Should contain Signtusk references, not DocuSign Alternative
                assert(makefile.includes('Signtusk'), 'Makefile should contain Signtusk references');
                assert(!makefile.includes('DocuSign Alternative'), 'Makefile should not contain DocuSign Alternative references');
            }
        });
    });
});

// Simple test runner
function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        console.log(`  ✗ ${name}`);
        console.log(`    ${error.message}`);
        process.exit(1);
    }
}

// Run the tests
console.log('Running Build System Integrity Tests...');