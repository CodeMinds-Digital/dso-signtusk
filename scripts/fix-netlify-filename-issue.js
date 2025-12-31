#!/usr/bin/env node

/**
 * Fix Netlify Filename Issue
 * 
 * This script fixes the "netlify.to" vs "netlify.toml" filename issue
 * by ensuring correct files exist and removing any misnamed files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n' + '='.repeat(70));
console.log('🔧 FIXING NETLIFY FILENAME ISSUE');
console.log('='.repeat(70));

console.log('\n🔍 DIAGNOSING THE ISSUE:');
console.log('   Netlify error: apps/remix/netlify.to (missing "ml")');
console.log('   Expected file: apps/remix/netlify.toml');

// Check current state
const correctFiles = [
    'apps/remix/netlify.toml',
    'apps/web/netlify.toml', 
    'apps/docs/netlify.toml',
    'netlify.toml'
];

const incorrectFiles = [
    'apps/remix/netlify.to',
    'apps/web/netlify.to',
    'apps/docs/netlify.to',
    'netlify.to'
];

console.log('\n📋 CHECKING CURRENT STATE:');

// Check for correct files
correctFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file}`);
});

// Check for incorrect files
let foundIncorrectFiles = false;
incorrectFiles.forEach(file => {
    const exists = fs.existsSync(file);
    if (exists) {
        console.log(`   ❌ FOUND INCORRECT FILE: ${file}`);
        foundIncorrectFiles = true;
    }
});

if (!foundIncorrectFiles) {
    console.log('   ✅ No incorrect files found locally');
}

console.log('\n🔧 APPLYING FIXES:');

// Step 1: Remove any incorrect files
incorrectFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   🗑️  Removing incorrect file: ${file}`);
        fs.unlinkSync(file);
    }
});

// Step 2: Ensure correct files exist with proper content
if (!fs.existsSync('apps/remix/netlify.toml')) {
    console.log('   ❌ apps/remix/netlify.toml is missing!');
    console.log('   📝 This should not happen - the file should exist');
    process.exit(1);
} else {
    console.log('   ✅ apps/remix/netlify.toml exists');
}

// Step 3: Check git status for any incorrect files
console.log('\n🔍 CHECKING GIT STATUS:');
try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    const lines = gitStatus.split('\n').filter(line => line.trim());
    
    const incorrectGitFiles = lines.filter(line => 
        line.includes('netlify.to') && !line.includes('netlify.toml')
    );
    
    if (incorrectGitFiles.length > 0) {
        console.log('   ❌ Found incorrect files in git:');
        incorrectGitFiles.forEach(line => console.log(`      ${line}`));
    } else {
        console.log('   ✅ No incorrect files in git status');
    }
} catch (error) {
    console.log('   ⚠️  Could not check git status');
}

// Step 4: Check git ls-files for any tracked incorrect files
console.log('\n🔍 CHECKING TRACKED FILES:');
try {
    const trackedFiles = execSync('git ls-files', { encoding: 'utf8' });
    const incorrectTracked = trackedFiles.split('\n').filter(line => 
        line.includes('netlify.to') && !line.includes('netlify.toml')
    );
    
    if (incorrectTracked.length > 0) {
        console.log('   ❌ Found incorrect files tracked in git:');
        incorrectTracked.forEach(file => {
            console.log(`      ${file}`);
            console.log(`   🗑️  Removing from git: ${file}`);
            try {
                execSync(`git rm "${file}"`, { stdio: 'pipe' });
            } catch (e) {
                console.log(`      ⚠️  Could not remove ${file}: ${e.message}`);
            }
        });
    } else {
        console.log('   ✅ No incorrect files tracked in git');
    }
} catch (error) {
    console.log('   ⚠️  Could not check tracked files');
}

// Step 5: Validate the correct file content
console.log('\n🔍 VALIDATING FILE CONTENT:');
const remixConfig = 'apps/remix/netlify.toml';
if (fs.existsSync(remixConfig)) {
    const content = fs.readFileSync(remixConfig, 'utf8');
    
    // Check for essential sections
    const hasBase = content.includes('base = "apps/remix"');
    const hasCommand = content.includes('command =');
    const hasPublish = content.includes('publish =');
    
    if (hasBase && hasCommand && hasPublish) {
        console.log('   ✅ apps/remix/netlify.toml has valid content');
    } else {
        console.log('   ⚠️  apps/remix/netlify.toml might have invalid content');
        console.log(`      Base config: ${hasBase ? '✅' : '❌'}`);
        console.log(`      Command: ${hasCommand ? '✅' : '❌'}`);
        console.log(`      Publish: ${hasPublish ? '✅' : '❌'}`);
    }
} else {
    console.log('   ❌ apps/remix/netlify.toml does not exist!');
}

console.log('\n🚀 NEXT STEPS:');
console.log('   1. Commit any changes made by this script');
console.log('   2. Push to the testdeploy branch');
console.log('   3. Trigger a new Netlify deployment');

console.log('\n📝 COMMANDS TO RUN:');
console.log('   git add -A');
console.log('   git commit -m "Fix netlify filename issue - ensure .toml extension"');
console.log('   git push origin testdeploy');

console.log('\n' + '='.repeat(70));
console.log('✅ FILENAME ISSUE FIX COMPLETE');
console.log('='.repeat(70) + '\n');