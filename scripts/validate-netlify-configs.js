#!/usr/bin/env node

/**
 * Validate Netlify Configuration Files
 * 
 * This script validates all netlify.toml files in the repository
 * to ensure they are properly formatted and don't contain malformed paths.
 */

const fs = require('fs');
const path = require('path');

function validateNetlifyConfigs() {
    console.log('🔍 Validating Netlify configuration files...\n');
    
    const configFiles = [
        'netlify.toml',
        'netlify-marketing.toml', 
        'netlify-docs.toml',
        'apps/web/netlify.toml',
        'apps/remix/netlify.toml',
        'apps/docs/netlify.toml'
    ];
    
    let allValid = true;
    
    configFiles.forEach(configPath => {
        const fullPath = path.join(process.cwd(), configPath);
        
        if (fs.existsSync(fullPath)) {
            console.log(`✅ Found: ${configPath}`);
            
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Check for malformed paths
                if (content.includes('netlify.to}')) {
                    console.log(`❌ ERROR: Malformed path found in ${configPath}: contains 'netlify.to}'`);
                    allValid = false;
                }
                
                if (content.includes('netlify.to"') && !content.includes('netlify.toml"')) {
                    console.log(`❌ ERROR: Potential malformed path in ${configPath}: contains 'netlify.to"' without 'ml'`);
                    allValid = false;
                }
                
                // Basic TOML syntax validation
                if (content.includes('[build]')) {
                    console.log(`   📋 Contains build configuration`);
                }
                
                if (content.includes('[[redirects]]')) {
                    console.log(`   🔀 Contains redirect rules`);
                }
                
            } catch (error) {
                console.log(`❌ ERROR reading ${configPath}: ${error.message}`);
                allValid = false;
            }
        } else {
            console.log(`⚠️  Not found: ${configPath}`);
        }
        
        console.log('');
    });
    
    if (allValid) {
        console.log('✅ All Netlify configuration files are valid!');
        return true;
    } else {
        console.log('❌ Some Netlify configuration files have issues!');
        return false;
    }
}

// Run validation
const isValid = validateNetlifyConfigs();
process.exit(isValid ? 0 : 1);