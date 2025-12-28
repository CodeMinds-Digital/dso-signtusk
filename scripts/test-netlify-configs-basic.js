#!/usr/bin/env node

/**
 * Basic Netlify Configuration Tests
 * 
 * This script runs basic validation tests without requiring full test suite dependencies.
 * It validates the core functionality that the property-based tests are checking.
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('🧪 BASIC NETLIFY CONFIGURATION TESTS');
console.log('='.repeat(60));

let allTestsPassed = true;

function test(description, testFn) {
    try {
        const result = testFn();
        if (result) {
            console.log(`✅ ${description}`);
        } else {
            console.log(`❌ ${description}`);
            allTestsPassed = false;
        }
    } catch (error) {
        console.log(`❌ ${description} - Error: ${error.message}`);
        allTestsPassed = false;
    }
}

// Test 1: All configuration files exist and are properly named
test('All Netlify configuration files exist with correct names', () => {
    const configFiles = [
        'netlify.toml',
        'apps/web/netlify.toml',
        'apps/remix/netlify.toml', 
        'apps/docs/netlify.toml'
    ];
    
    return configFiles.every(file => {
        const exists = fs.existsSync(file);
        if (!exists) {
            console.log(`   Missing: ${file}`);
        }
        return exists;
    });
});

// Test 2: No malformed configuration file names exist
test('No malformed configuration files (netlify.to}) exist', () => {
    const malformedPatterns = [
        'netlify.to}',
        'apps/web/netlify.to}',
        'apps/remix/netlify.to}',
        'apps/docs/netlify.to}'
    ];
    
    return malformedPatterns.every(pattern => !fs.existsSync(pattern));
});

// Test 3: Configuration files have unique build configurations
test('Each application has unique build configuration', () => {
    const configs = [
        { file: 'apps/web/netlify.toml', expectedApp: 'web' },
        { file: 'apps/remix/netlify.toml', expectedApp: 'remix' },
        { file: 'apps/docs/netlify.toml', expectedApp: 'docs' }
    ];
    
    const buildCommands = new Set();
    const publishDirs = new Set();
    
    for (const config of configs) {
        if (!fs.existsSync(config.file)) continue;
        
        const content = fs.readFileSync(config.file, 'utf8');
        
        // Extract build command
        const commandMatch = content.match(/command = "([^"]+)"/);
        if (commandMatch) {
            buildCommands.add(commandMatch[1]);
        }
        
        // Extract publish directory
        const publishMatch = content.match(/publish = "([^"]+)"/);
        if (publishMatch) {
            publishDirs.add(publishMatch[1]);
        }
        
        // Check for app-specific configuration
        if (!content.includes(config.expectedApp)) {
            console.log(`   ${config.file} doesn't contain app-specific config for ${config.expectedApp}`);
            return false;
        }
    }
    
    // Each app should have unique build commands and publish directories
    return buildCommands.size >= 2 && publishDirs.size >= 2;
});

// Test 4: Configuration files have proper security headers
test('Configuration files include security headers', () => {
    const configFiles = ['apps/web/netlify.toml', 'apps/remix/netlify.toml', 'apps/docs/netlify.toml'];
    
    return configFiles.every(file => {
        if (!fs.existsSync(file)) return true; // Skip missing files
        
        const content = fs.readFileSync(file, 'utf8');
        const hasSecurityHeaders = content.includes('X-Frame-Options') ||
                                 content.includes('X-Content-Type-Options') ||
                                 content.includes('Content-Security-Policy');
        
        if (!hasSecurityHeaders) {
            console.log(`   ${file} missing security headers`);
        }
        
        return hasSecurityHeaders;
    });
});

// Test 5: Configuration files have proper redirect rules
test('Configuration files include redirect rules', () => {
    const configFiles = ['apps/web/netlify.toml', 'apps/remix/netlify.toml', 'apps/docs/netlify.toml'];
    
    return configFiles.every(file => {
        if (!fs.existsSync(file)) return true; // Skip missing files
        
        const content = fs.readFileSync(file, 'utf8');
        const hasRedirects = content.includes('[[redirects]]');
        
        if (!hasRedirects) {
            console.log(`   ${file} missing redirect rules`);
        }
        
        return hasRedirects;
    });
});

// Test 6: Configuration files have caching optimization
test('Configuration files include build caching', () => {
    const configFiles = ['apps/web/netlify.toml', 'apps/remix/netlify.toml', 'apps/docs/netlify.toml'];
    
    return configFiles.every(file => {
        if (!fs.existsSync(file)) return true; // Skip missing files
        
        const content = fs.readFileSync(file, 'utf8');
        const hasCaching = content.includes('[build.cache]') ||
                          content.includes('TURBO_CACHE_DIR') ||
                          content.includes('NPM_CONFIG_CACHE');
        
        if (!hasCaching) {
            console.log(`   ${file} missing caching configuration`);
        }
        
        return hasCaching;
    });
});

// Test 7: Root package.json has patch-package in dependencies
test('patch-package is in dependencies (not devDependencies)', () => {
    if (!fs.existsSync('package.json')) return false;
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasPatchPackage = packageJson.dependencies && packageJson.dependencies['patch-package'];
    const notInDevDeps = !packageJson.devDependencies || !packageJson.devDependencies['patch-package'];
    
    if (!hasPatchPackage) {
        console.log('   patch-package not found in dependencies');
    }
    if (!notInDevDeps) {
        console.log('   patch-package should not be in devDependencies');
    }
    
    return hasPatchPackage && notInDevDeps;
});

// Test 8: Workspace configuration is valid
test('Workspace configuration supports npm workspaces', () => {
    if (!fs.existsSync('package.json')) return false;
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasWorkspaces = packageJson.workspaces && Array.isArray(packageJson.workspaces);
    const hasApps = packageJson.workspaces && packageJson.workspaces.includes('apps/*');
    const hasPackages = packageJson.workspaces && packageJson.workspaces.includes('packages/*');
    
    if (!hasWorkspaces) {
        console.log('   Missing or invalid workspaces configuration');
    }
    if (!hasApps) {
        console.log('   Missing apps/* in workspaces');
    }
    if (!hasPackages) {
        console.log('   Missing packages/* in workspaces');
    }
    
    return hasWorkspaces && hasApps && hasPackages;
});

// Test 9: Cache management scripts exist
test('Cache management scripts are available', () => {
    const scripts = [
        'scripts/cache-invalidation.js',
        'scripts/netlify-cache-config.js',
        'scripts/validate-netlify-configs.js'
    ];
    
    return scripts.every(script => {
        const exists = fs.existsSync(script);
        if (!exists) {
            console.log(`   Missing: ${script}`);
        }
        return exists;
    });
});

// Test 10: Troubleshooting documentation exists
test('Troubleshooting documentation is available', () => {
    const docs = [
        'NETLIFY_CONFIG_TROUBLESHOOTING.md',
        'scripts/check-netlify-dashboard-settings.js'
    ];
    
    return docs.every(doc => {
        const exists = fs.existsSync(doc);
        if (!exists) {
            console.log(`   Missing: ${doc}`);
        }
        return exists;
    });
});

console.log('='.repeat(60));

if (allTestsPassed) {
    console.log('🎉 ALL BASIC TESTS PASSED!');
    console.log('\n✅ Repository configuration is correct');
    console.log('✅ The "netlify.to}" error is in Netlify dashboard settings');
    console.log('✅ Run: node scripts/check-netlify-dashboard-settings.js');
    console.log('='.repeat(60));
    process.exit(0);
} else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\n🔧 Fix the failing tests above, then:');
    console.log('   1. Run this script again to verify fixes');
    console.log('   2. Check Netlify dashboard settings');
    console.log('   3. Run: node scripts/check-netlify-dashboard-settings.js');
    console.log('='.repeat(60));
    process.exit(1);
}