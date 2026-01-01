#!/usr/bin/env node

/**
 * Fallback Build Script
 * Executes fallback strategies when the main build fails
 */

const { BuildErrorHandler } = require('../packages/lib/src/build-error-handler');
const { BuildFallbackManager } = require('../packages/lib/src/build-fallback-manager');

async function runFallbackBuild() {
  console.log('🔄 Starting fallback build process...\n');

  const errorHandler = new BuildErrorHandler('fallback-build');
  const fallbackManager = new BuildFallbackManager(errorHandler);
  
  // Connect the components
  errorHandler.setFallbackManager(fallbackManager);

  try {
    // Create a generic build error to trigger fallbacks
    const buildError = new Error('Primary build failed - executing fallback strategies');
    
    console.log('Available fallback strategies:');
    const strategies = fallbackManager.getAvailableStrategies();
    strategies.forEach((strategy, index) => {
      console.log(`${index + 1}. ${strategy.name}: ${strategy.description}`);
    });
    
    console.log('\n🔧 Executing fallback strategies...');
    const result = await fallbackManager.executeFallbacks(buildError);
    
    if (result.success) {
      console.log(`\n✅ Fallback build succeeded with strategy: ${result.strategyUsed}`);
      console.log(`Strategies attempted: ${result.fallbacksAttempted.join(', ')}`);
      
      // Try to run post-build validation
      try {
        console.log('\n🔍 Running post-build validation...');
        const { execSync } = require('child_process');
        execSync('node scripts/validate-build-env.js', { stdio: 'inherit' });
        console.log('✅ Post-build validation passed');
      } catch (validationError) {
        console.warn('⚠️  Post-build validation failed, but fallback build completed');
      }
      
      process.exit(0);
    } else {
      console.log(`\n❌ All fallback strategies failed`);
      console.log(`Strategies attempted: ${result.fallbacksAttempted.join(', ')}`);
      
      errorHandler.printSummary();
      errorHandler.saveReport();
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fallback build process crashed:', error.message);
    
    errorHandler.handleJavaScriptError(error, {
      operation: 'fallback build process',
      file: 'build-fallback.js'
    });
    
    errorHandler.printSummary();
    errorHandler.saveReport();
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runFallbackBuild();
}

module.exports = { runFallbackBuild };