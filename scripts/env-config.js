#!/usr/bin/env node

/**
 * Environment Configuration Management for Hybrid Architecture
 * Validates and manages environment variables across Next.js and Remix apps
 */

const fs = require('fs');
const path = require('path');

// Environment variable schemas
const SHARED_VARS = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'LOG_LEVEL'
];

const WEB_VARS = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_WEB_URL',
    'NEXT_TELEMETRY_DISABLED',
    'TURBOPACK'
];

const APP_VARS = [
    'SESSION_SECRET',
    'REMIX_DEV_SERVER_WS_PORT',
    'ENABLE_AI_FEATURES',
    'ENABLE_EXPERIMENTAL_FEATURES'
];

const DEPLOYMENT_VARS = {
    vercel: ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'],
    fly: ['FLY_API_TOKEN', 'FLY_APP_NAME', 'FLY_APP_NAME_STAGING'],
    railway: ['RAILWAY_TOKEN', 'RAILWAY_PROJECT_ID', 'RAILWAY_ENVIRONMENT_ID']
};

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};

    content.split('\n').forEach(line => {
        const match = line.match(/^([^#][^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });

    return env;
}

function validateEnvironment(env, requiredVars, context) {
    const missing = [];
    const invalid = [];

    requiredVars.forEach(varName => {
        if (!env[varName]) {
            missing.push(varName);
        } else if (varName.includes('SECRET') || varName.includes('KEY')) {
            if (env[varName].length < 32) {
                invalid.push(`${varName} (must be at least 32 characters)`);
            }
        }
    });

    if (missing.length > 0 || invalid.length > 0) {
        console.error(`❌ Environment validation failed for ${context}:`);
        if (missing.length > 0) {
            console.error('  Missing variables:', missing.join(', '));
        }
        if (invalid.length > 0) {
            console.error('  Invalid variables:', invalid.join(', '));
        }
        return false;
    }

    console.log(`✅ Environment validation passed for ${context}`);
    return true;
}

function generateEnvFile(template, output, overrides = {}) {
    const templateEnv = loadEnvFile(template);
    const outputEnv = { ...templateEnv, ...overrides };

    const content = Object.entries(outputEnv)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    fs.writeFileSync(output, content);
    console.log(`📝 Generated ${output}`);
}

function main() {
    const command = process.argv[2];
    const environment = process.argv[3] || 'development';

    switch (command) {
        case 'validate':
            console.log(`🔍 Validating environment configuration for ${environment}...`);

            // Load environment files
            const rootEnv = loadEnvFile('.env');
            const webEnv = loadEnvFile('apps/web/.env');
            const appEnv = loadEnvFile('apps/app/.env');

            // Validate shared variables
            const allEnv = { ...rootEnv, ...webEnv, ...appEnv };
            let valid = true;

            valid &= validateEnvironment(allEnv, SHARED_VARS, 'shared');
            valid &= validateEnvironment(allEnv, WEB_VARS, 'web app');
            valid &= validateEnvironment(allEnv, APP_VARS, 'remix app');

            if (environment === 'production') {
                valid &= validateEnvironment(allEnv, DEPLOYMENT_VARS.vercel, 'vercel deployment');
                valid &= validateEnvironment(allEnv, DEPLOYMENT_VARS.fly, 'fly.io deployment');
            }

            process.exit(valid ? 0 : 1);
            break;

        case 'generate':
            console.log(`📋 Generating environment files for ${environment}...`);

            const envOverrides = {
                development: {
                    NODE_ENV: 'development',
                    LOG_LEVEL: 'debug',
                    ENABLE_EXPERIMENTAL_FEATURES: 'true'
                },
                staging: {
                    NODE_ENV: 'staging',
                    LOG_LEVEL: 'info',
                    ENABLE_EXPERIMENTAL_FEATURES: 'true'
                },
                production: {
                    NODE_ENV: 'production',
                    LOG_LEVEL: 'warn',
                    ENABLE_EXPERIMENTAL_FEATURES: 'false'
                }
            };

            // Generate environment files
            generateEnvFile('.env.example', '.env', envOverrides[environment]);
            generateEnvFile('apps/web/.env.example', 'apps/web/.env', envOverrides[environment]);
            generateEnvFile('apps/app/.env.example', 'apps/app/.env', envOverrides[environment]);
            break;

        case 'sync':
            console.log('🔄 Syncing environment variables across apps...');

            const baseEnv = loadEnvFile('.env');

            // Sync shared variables to app-specific env files
            const webEnvPath = 'apps/web/.env';
            const appEnvPath = 'apps/app/.env';

            const currentWebEnv = loadEnvFile(webEnvPath);
            const currentAppEnv = loadEnvFile(appEnvPath);

            // Update with shared variables
            SHARED_VARS.forEach(varName => {
                if (baseEnv[varName]) {
                    currentWebEnv[varName] = baseEnv[varName];
                    currentAppEnv[varName] = baseEnv[varName];
                }
            });

            generateEnvFile(webEnvPath + '.example', webEnvPath, currentWebEnv);
            generateEnvFile(appEnvPath + '.example', appEnvPath, currentAppEnv);
            break;

        default:
            console.log('Usage: node scripts/env-config.js <command> [environment]');
            console.log('Commands:');
            console.log('  validate [development|staging|production] - Validate environment configuration');
            console.log('  generate [development|staging|production] - Generate environment files');
            console.log('  sync - Sync shared variables across apps');
            process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    loadEnvFile,
    validateEnvironment,
    generateEnvFile
};