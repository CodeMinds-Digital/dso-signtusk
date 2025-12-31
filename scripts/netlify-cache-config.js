#!/usr/bin/env node

/**
 * Netlify Cache Configuration Script
 * 
 * This script provides utilities for managing build caching strategies
 * across different Netlify sites in the monorepo.
 */

const fs = require('fs');
const path = require('path');

/**
 * Cache configuration templates for different application types
 */
const CACHE_CONFIGS = {
  // Next.js applications (web, docs)
  nextjs: {
    // Cache node_modules for dependency caching
    nodeModulesCache: {
      paths: ['node_modules', 'apps/*/node_modules', 'packages/*/node_modules'],
      key: 'node-modules-{{ checksum "package-lock.json" }}-{{ checksum "apps/*/package.json" }}-{{ checksum "packages/*/package.json" }}'
    },
    // Cache Next.js build cache
    nextCache: {
      paths: ['.next/cache'],
      key: 'next-cache-{{ checksum "package.json" }}-{{ checksum "next.config.js" }}-{{ epoch }}'
    },
    // Cache Turbo build artifacts
    turboCache: {
      paths: ['.turbo', 'node_modules/.cache/turbo'],
      key: 'turbo-cache-{{ checksum "turbo.json" }}-{{ checksum "package.json" }}-{{ epoch }}'
    }
  },
  
  // Remix applications
  remix: {
    // Cache node_modules for dependency caching
    nodeModulesCache: {
      paths: ['node_modules', 'apps/*/node_modules', 'packages/*/node_modules'],
      key: 'node-modules-{{ checksum "package-lock.json" }}-{{ checksum "apps/*/package.json" }}-{{ checksum "packages/*/package.json" }}'
    },
    // Cache Remix build artifacts
    remixCache: {
      paths: ['build/.cache', 'apps/remix/.cache'],
      key: 'remix-cache-{{ checksum "package.json" }}-{{ checksum "remix.config.js" }}-{{ epoch }}'
    },
    // Cache Turbo build artifacts
    turboCache: {
      paths: ['.turbo', 'node_modules/.cache/turbo'],
      key: 'turbo-cache-{{ checksum "turbo.json" }}-{{ checksum "package.json" }}-{{ epoch }}'
    },
    // Cache Vite build artifacts
    viteCache: {
      paths: ['node_modules/.vite'],
      key: 'vite-cache-{{ checksum "vite.config.ts" }}-{{ checksum "package.json" }}-{{ epoch }}'
    }
  }
};

/**
 * Cache invalidation strategies
 */
const CACHE_INVALIDATION = {
  // Invalidate on dependency changes
  dependencies: [
    'package.json',
    'package-lock.json',
    'apps/*/package.json',
    'packages/*/package.json'
  ],
  
  // Invalidate on configuration changes
  configuration: [
    'turbo.json',
    'next.config.js',
    'remix.config.js',
    'vite.config.ts',
    'tsconfig.json'
  ],
  
  // Invalidate on source code changes (for selective builds)
  sourceCode: {
    web: ['apps/web/**/*', 'packages/**/*'],
    remix: ['apps/remix/**/*', 'packages/**/*'],
    docs: ['apps/docs/**/*', 'packages/**/*']
  }
};

class NetlifyCacheManager {
  constructor() {
    this.repositoryRoot = this.findRepositoryRoot();
  }

  /**
   * Find repository root
   */
  findRepositoryRoot() {
    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.workspaces) {
            return currentDir;
          }
        } catch (error) {
          // Continue searching
        }
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    throw new Error('Could not find repository root');
  }

  /**
   * Generate cache configuration for a specific app type
   */
  generateCacheConfig(appType) {
    const config = CACHE_CONFIGS[appType];
    if (!config) {
      throw new Error(`Unknown app type: ${appType}`);
    }

    return {
      cache: {
        enabled: true,
        strategies: config
      },
      invalidation: {
        dependencies: CACHE_INVALIDATION.dependencies,
        configuration: CACHE_INVALIDATION.configuration
      }
    };
  }

  /**
   * Update Netlify TOML file with caching configuration
   */
  updateNetlifyToml(tomlPath, appType) {
    if (!fs.existsSync(tomlPath)) {
      throw new Error(`Netlify TOML file not found: ${tomlPath}`);
    }

    const cacheConfig = this.generateCacheConfig(appType);
    
    // Read existing TOML content
    let tomlContent = fs.readFileSync(tomlPath, 'utf8');
    
    // Add cache configuration section
    const cacheSection = this.generateCacheTomlSection(cacheConfig);
    
    // Append cache configuration if not already present
    if (!tomlContent.includes('[build.cache]')) {
      tomlContent += '\n' + cacheSection;
    }
    
    // Update build commands to use optimized script
    tomlContent = this.updateBuildCommands(tomlContent, appType);
    
    fs.writeFileSync(tomlPath, tomlContent);
    console.log(`✅ Updated cache configuration in ${tomlPath}`);
  }

  /**
   * Generate TOML section for cache configuration
   */
  generateCacheTomlSection(cacheConfig) {
    return `
# Build caching configuration
[build.cache]
  # Enable build caching
  enabled = true

# Cache node_modules for faster dependency installation
[[build.cache.paths]]
  from = "node_modules"
  to = "node_modules"

[[build.cache.paths]]
  from = "apps/*/node_modules"
  to = "apps/*/node_modules"

[[build.cache.paths]]
  from = "packages/*/node_modules"
  to = "packages/*/node_modules"

# Cache Turbo build artifacts
[[build.cache.paths]]
  from = ".turbo"
  to = ".turbo"

[[build.cache.paths]]
  from = "node_modules/.cache/turbo"
  to = "node_modules/.cache/turbo"

# Cache Next.js build artifacts (for Next.js apps)
[[build.cache.paths]]
  from = ".next/cache"
  to = ".next/cache"

# Cache Vite build artifacts (for Remix apps)
[[build.cache.paths]]
  from = "node_modules/.vite"
  to = "node_modules/.vite"

# Cache Remix build artifacts
[[build.cache.paths]]
  from = "build/.cache"
  to = "build/.cache"

# Build environment optimizations
[build.environment]
  # Turbo cache configuration
  TURBO_CACHE_DIR = ".turbo"
  TURBO_TELEMETRY_DISABLED = "1"
  
  # NPM cache configuration
  NPM_CONFIG_CACHE = "node_modules/.cache/npm"
  NPM_CONFIG_FUND = "false"
  NPM_CONFIG_AUDIT = "false"
  
  # Node.js optimizations
  NODE_OPTIONS = "--max-old-space-size=4096"
`;
  }

  /**
   * Update build commands to use the optimized build script
   */
  updateBuildCommands(tomlContent, appType) {
    const appMap = {
      nextjs: 'web',
      remix: 'remix'
    };
    
    const appName = appMap[appType] || appType;
    const optimizedCommand = `cd ../.. && NETLIFY_APP_NAME=${appName} node scripts/netlify-build.js`;
    
    // Replace build commands with optimized version
    tomlContent = tomlContent.replace(
      /command = "cd \.\.\/\.\. && npm ci && npm run build --workspace=@signtusk\/\w+"/g,
      `command = "${optimizedCommand}"`
    );
    
    return tomlContent;
  }

  /**
   * Update all Netlify configurations with caching
   */
  updateAllConfigurations() {
    const configurations = [
      { path: 'apps/web/netlify.toml', type: 'nextjs' },
      { path: 'apps/remix/netlify.toml', type: 'remix' },
      { path: 'apps/docs/netlify.toml', type: 'nextjs' }
    ];

    configurations.forEach(config => {
      const fullPath = path.join(this.repositoryRoot, config.path);
      try {
        this.updateNetlifyToml(fullPath, config.type);
      } catch (error) {
        console.error(`❌ Failed to update ${config.path}:`, error.message);
      }
    });
  }

  /**
   * Generate cache invalidation rules
   */
  generateInvalidationRules(appName) {
    const sourcePatterns = CACHE_INVALIDATION.sourceCode[appName] || [];
    const configPatterns = CACHE_INVALIDATION.configuration;
    const depPatterns = CACHE_INVALIDATION.dependencies;
    
    return {
      invalidateOn: [
        ...sourcePatterns,
        ...configPatterns,
        ...depPatterns
      ]
    };
  }

  /**
   * Print cache configuration summary
   */
  printCacheSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CACHE CONFIGURATION SUMMARY');
    console.log('='.repeat(60));
    console.log('Cache Strategies:');
    console.log('  ✅ Node.js modules caching');
    console.log('  ✅ Turbo build artifact caching');
    console.log('  ✅ Next.js build cache (for web/docs)');
    console.log('  ✅ Vite build cache (for Remix)');
    console.log('  ✅ Remix build artifact caching');
    console.log('\nInvalidation Triggers:');
    console.log('  📦 Package.json changes');
    console.log('  ⚙️  Configuration file changes');
    console.log('  📝 Source code changes (selective)');
    console.log('\nOptimizations:');
    console.log('  🚀 Turbo telemetry disabled');
    console.log('  💾 Increased Node.js memory limit');
    console.log('  📦 NPM audit/fund disabled');
    console.log('='.repeat(60));
  }
}

// Export for testing
module.exports = { NetlifyCacheManager, CACHE_CONFIGS, CACHE_INVALIDATION };

// Run if called directly
if (require.main === module) {
  const cacheManager = new NetlifyCacheManager();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'update':
      cacheManager.updateAllConfigurations();
      cacheManager.printCacheSummary();
      break;
    case 'summary':
      cacheManager.printCacheSummary();
      break;
    default:
      console.log('Usage: node netlify-cache-config.js [update|summary]');
      console.log('  update  - Update all Netlify configurations with caching');
      console.log('  summary - Print cache configuration summary');
  }
}