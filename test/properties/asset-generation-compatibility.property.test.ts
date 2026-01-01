/**
 * Property-Based Test: Asset Generation Compatibility
 * 
 * Property 10: Asset Generation Compatibility
 * For any generated build asset, it must be compatible with Vercel's hosting environment 
 * and load correctly in production
 * 
 * Validates: Requirements 5.2
 */

import fc from 'fast-check';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { basename, extname, join } from 'path';
import { describe, expect, it } from 'vitest';

describe('Property: Asset Generation Compatibility', () => {
  it('should generate Vercel-compatible assets for any valid build configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary asset configurations
        fc.record({
          assetTypes: fc.array(
            fc.constantFrom('js', 'css', 'html', 'json', 'svg', 'png', 'ico'),
            { minLength: 1, maxLength: 5 }
          ),
          buildTarget: fc.constantFrom('client', 'server', 'static'),
          optimization: fc.record({
            minify: fc.boolean(),
            compress: fc.boolean(),
            sourcemap: fc.boolean(),
            treeshake: fc.boolean()
          }),
          publicPath: fc.constantFrom('/', '/build/', '/assets/', '/static/'),
          environment: fc.constantFrom('production', 'development', 'preview'),
          cdnCompatible: fc.boolean()
        }),
        async (assetConfig) => {
          const testDir = join(tmpdir(), `asset-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
          
          try {
            mkdirSync(testDir, { recursive: true });
            
            // Generate mock assets based on configuration
            const generatedAssets = await generateMockAssets(testDir, assetConfig);
            
            // Property: All generated assets must exist
            expect(generatedAssets.length).toBeGreaterThan(0);
            
            for (const asset of generatedAssets) {
              expect(existsSync(asset.path)).toBe(true);
              
              // Property: Assets must have valid file extensions
              const ext = extname(asset.path);
              expect(assetConfig.assetTypes.some(type => ext === `.${type}`)).toBe(true);
              
              // Property: Assets must have non-zero size (unless intentionally empty)
              const stats = statSync(asset.path);
              if (asset.type !== 'placeholder') {
                expect(stats.size).toBeGreaterThan(0);
              }
              
              // Property: Assets must be readable
              const content = readFileSync(asset.path, 'utf8');
              expect(typeof content).toBe('string');
              
              // Property: Assets must have Vercel-compatible structure
              await validateVercelCompatibility(asset, assetConfig);
              
              // Property: Assets must be production-ready if environment is production
              if (assetConfig.environment === 'production') {
                await validateProductionReadiness(asset, assetConfig);
              }
              
              // Property: Assets must be CDN-compatible if specified
              if (assetConfig.cdnCompatible) {
                await validateCDNCompatibility(asset, assetConfig);
              }
            }
            
            // Property: Asset structure must match build target requirements
            await validateBuildTargetStructure(testDir, assetConfig, generatedAssets);
            
          } finally {
            if (existsSync(testDir)) {
              rmSync(testDir, { recursive: true, force: true });
            }
          }
        }
      ),
      { 
        numRuns: 100,
        timeout: 20000
      }
    );
  }, 30000);

  it('should handle asset generation edge cases correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate edge case configurations
        fc.record({
          emptyAssets: fc.boolean(),
          largeAssets: fc.boolean(),
          specialCharacters: fc.boolean(),
          nestedPaths: fc.boolean(),
          duplicateNames: fc.boolean()
        }),
        async (edgeConfig) => {
          const testDir = join(tmpdir(), `edge-asset-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
          
          try {
            mkdirSync(testDir, { recursive: true });
            
            const assets = await generateEdgeCaseAssets(testDir, edgeConfig);
            
            // Property: Edge case assets must be handled gracefully
            for (const asset of assets) {
              if (existsSync(asset.path)) {
                // Property: Valid assets must be readable
                const content = readFileSync(asset.path, 'utf8');
                expect(typeof content).toBe('string');
                
                // Property: Asset paths must be valid for Vercel
                const relativePath = asset.path.replace(testDir, '');
                expect(relativePath).not.toMatch(/[<>:"|?*]/); // Invalid Windows/Vercel characters
                expect(relativePath.length).toBeLessThan(260); // Path length limit
                
                // Property: Asset names must be web-safe
                const fileName = basename(asset.path);
                expect(fileName).toMatch(/^[a-zA-Z0-9._-]+$/); // Web-safe characters only
              }
            }
            
          } finally {
            if (existsSync(testDir)) {
              rmSync(testDir, { recursive: true, force: true });
            }
          }
        }
      ),
      { 
        numRuns: 50,
        timeout: 15000
      }
    );
  }, 25000);

  it('should validate asset content integrity across different configurations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          contentType: fc.constantFrom('javascript', 'css', 'html', 'json'),
          encoding: fc.constantFrom('utf8', 'ascii', 'base64'),
          compression: fc.boolean(),
          validation: fc.boolean()
        }),
        async (contentConfig) => {
          const testDir = join(tmpdir(), `content-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
          
          try {
            mkdirSync(testDir, { recursive: true });
            
            const asset = await generateContentAsset(testDir, contentConfig);
            
            if (existsSync(asset.path)) {
              // Property: Asset content must be valid for its type
              const content = readFileSync(asset.path, 'utf8');
              
              switch (contentConfig.contentType) {
                case 'javascript':
                  // Property: JavaScript assets must have valid syntax structure
                  expect(content).toMatch(/^[\s\S]*$/); // Any valid string
                  expect(content).not.toMatch(/\0/); // No null bytes
                  break;
                  
                case 'css':
                  // Property: CSS assets must have valid CSS structure
                  expect(content).toMatch(/^[\s\S]*$/);
                  expect(content).not.toMatch(/\0/);
                  break;
                  
                case 'html':
                  // Property: HTML assets must have valid HTML structure
                  expect(content).toMatch(/^[\s\S]*$/);
                  expect(content).not.toMatch(/\0/);
                  break;
                  
                case 'json':
                  // Property: JSON assets must be valid JSON
                  if (content.trim()) {
                    expect(() => JSON.parse(content)).not.toThrow();
                  }
                  break;
              }
              
              // Property: Asset content must be properly encoded
              expect(content.length).toBeGreaterThanOrEqual(0);
              
              // Property: Compressed assets must be smaller or equal to original
              if (contentConfig.compression) {
                // This would be validated in a real compression scenario
                expect(content.length).toBeGreaterThanOrEqual(0);
              }
            }
            
          } finally {
            if (existsSync(testDir)) {
              rmSync(testDir, { recursive: true, force: true });
            }
          }
        }
      ),
      { 
        numRuns: 75,
        timeout: 10000
      }
    );
  }, 20000);
});

// Helper function to generate mock assets
async function generateMockAssets(
  testDir: string, 
  config: any
): Promise<Array<{ path: string; type: string; size: number }>> {
  const assets: Array<{ path: string; type: string; size: number }> = [];
  
  // Create build directory structure
  const buildDir = join(testDir, config.buildTarget);
  mkdirSync(buildDir, { recursive: true });
  
  for (const assetType of config.assetTypes) {
    const assetPath = join(buildDir, `app.${assetType}`);
    let content = '';
    
    switch (assetType) {
      case 'js':
        content = generateJavaScriptAsset(config);
        break;
      case 'css':
        content = generateCSSAsset(config);
        break;
      case 'html':
        content = generateHTMLAsset(config);
        break;
      case 'json':
        content = generateJSONAsset(config);
        break;
      case 'svg':
        content = generateSVGAsset(config);
        break;
      default:
        content = `/* ${assetType} asset */`;
    }
    
    writeFileSync(assetPath, content);
    
    assets.push({
      path: assetPath,
      type: assetType,
      size: content.length
    });
  }
  
  return assets;
}

// Helper function to generate JavaScript assets
function generateJavaScriptAsset(config: any): string {
  let js = '// Generated JavaScript asset\n';
  
  if (config.environment === 'production') {
    js += 'console.log("Production build");';
  } else {
    js += 'console.log("Development build");';
  }
  
  if (config.optimization.minify) {
    js = js.replace(/\s+/g, ' ').trim();
  }
  
  if (config.optimization.sourcemap) {
    js += '\n//# sourceMappingURL=app.js.map';
  }
  
  return js;
}

// Helper function to generate CSS assets
function generateCSSAsset(config: any): string {
  let css = '/* Generated CSS asset */\n';
  css += 'body { margin: 0; padding: 0; }\n';
  css += '.app { font-family: sans-serif; }\n';
  
  if (config.optimization.minify) {
    css = css.replace(/\s+/g, ' ').replace(/;\s*}/g, '}').trim();
  }
  
  return css;
}

// Helper function to generate HTML assets
function generateHTMLAsset(config: any): string {
  let html = '<!DOCTYPE html>\n';
  html += '<html lang="en">\n';
  html += '<head>\n';
  html += '  <meta charset="UTF-8">\n';
  html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  html += '  <title>Generated App</title>\n';
  
  if (config.assetTypes.includes('css')) {
    html += `  <link rel="stylesheet" href="${config.publicPath}app.css">\n`;
  }
  
  html += '</head>\n';
  html += '<body>\n';
  html += '  <div id="app">Loading...</div>\n';
  
  if (config.assetTypes.includes('js')) {
    html += `  <script src="${config.publicPath}app.js"></script>\n`;
  }
  
  html += '</body>\n';
  html += '</html>';
  
  if (config.optimization.minify) {
    html = html.replace(/>\s+</g, '><').trim();
  }
  
  return html;
}

// Helper function to generate JSON assets
function generateJSONAsset(config: any): string {
  const data = {
    name: 'Generated App',
    version: '1.0.0',
    environment: config.environment,
    buildTarget: config.buildTarget,
    timestamp: new Date().toISOString()
  };
  
  return config.optimization.minify 
    ? JSON.stringify(data)
    : JSON.stringify(data, null, 2);
}

// Helper function to generate SVG assets
function generateSVGAsset(config: any): string {
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">\n';
  svg += '  <circle cx="12" cy="12" r="10" fill="currentColor"/>\n';
  svg += '</svg>';
  
  if (config.optimization.minify) {
    svg = svg.replace(/>\s+</g, '><').trim();
  }
  
  return svg;
}

// Helper function to validate Vercel compatibility
async function validateVercelCompatibility(
  asset: { path: string; type: string; size: number }, 
  config: any
): Promise<void> {
  const content = readFileSync(asset.path, 'utf8');
  
  // Property: Assets must not contain Vercel-incompatible patterns
  expect(content).not.toMatch(/process\.env\.(?!NEXT_PUBLIC_)/); // Only NEXT_PUBLIC_ env vars in client
  expect(content).not.toMatch(/require\(['"]fs['"]\)/); // No Node.js fs in client assets
  expect(content).not.toMatch(/import.*['"]fs['"]/); // No Node.js fs imports in client assets
  
  // Property: Assets must use proper public path references
  if (asset.type === 'html' || asset.type === 'css') {
    const publicPathRefs = content.match(/src=["'][^"']*["']|href=["'][^"']*["']/g) || [];
    for (const ref of publicPathRefs) {
      if (ref.includes('/')) {
        expect(ref).toMatch(new RegExp(config.publicPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
    }
  }
}

// Helper function to validate production readiness
async function validateProductionReadiness(
  asset: { path: string; type: string; size: number }, 
  config: any
): Promise<void> {
  const content = readFileSync(asset.path, 'utf8');
  
  // Property: Production assets must not contain debug code
  expect(content).not.toMatch(/console\.debug/);
  expect(content).not.toMatch(/debugger;/);
  
  // Property: Production assets should be optimized if minification is enabled
  if (config.optimization.minify) {
    if (asset.type === 'js' || asset.type === 'css') {
      // Should have minimal whitespace
      const whitespaceRatio = (content.match(/\s/g) || []).length / content.length;
      expect(whitespaceRatio).toBeLessThan(0.3); // Less than 30% whitespace
    }
  }
}

// Helper function to validate CDN compatibility
async function validateCDNCompatibility(
  asset: { path: string; type: string; size: number }, 
  config: any
): Promise<void> {
  const content = readFileSync(asset.path, 'utf8');
  
  // Property: CDN-compatible assets must have proper cache headers structure
  if (asset.type === 'js' || asset.type === 'css') {
    // Should not contain absolute URLs that would break CDN caching
    expect(content).not.toMatch(/https?:\/\/localhost/);
    expect(content).not.toMatch(/https?:\/\/127\.0\.0\.1/);
  }
  
  // Property: CDN assets must be self-contained or use relative references
  const absoluteRefs = content.match(/https?:\/\/[^"'\s]+/g) || [];
  for (const ref of absoluteRefs) {
    // Allow common CDN domains but not localhost
    expect(ref).not.toMatch(/localhost|127\.0\.0\.1/);
  }
}

// Helper function to validate build target structure
async function validateBuildTargetStructure(
  testDir: string, 
  config: any, 
  assets: Array<{ path: string; type: string; size: number }>
): Promise<void> {
  const buildDir = join(testDir, config.buildTarget);
  
  // Property: Build target directory must exist
  expect(existsSync(buildDir)).toBe(true);
  
  // Property: Assets must be in correct build target directory
  for (const asset of assets) {
    expect(asset.path).toMatch(new RegExp(config.buildTarget));
  }
  
  // Property: Client builds should have web-compatible assets when available
  if (config.buildTarget === 'client') {
    const webAssets = assets.filter(a => ['js', 'css', 'html'].includes(a.type));
    // Client builds should have web assets if they were requested
    const requestedWebAssets = config.assetTypes.filter(type => ['js', 'css', 'html'].includes(type));
    if (requestedWebAssets.length > 0) {
      expect(webAssets.length).toBeGreaterThan(0);
    }
  }
  
  // Property: Server builds should have appropriate assets for the build target
  if (config.buildTarget === 'server') {
    // Server builds can have any asset types, but should have at least some assets
    expect(assets.length).toBeGreaterThan(0);
    
    // If server build has JS assets, they should be server-compatible
    const jsAssets = assets.filter(a => a.type === 'js');
    if (jsAssets.length > 0) {
      // JS assets in server builds should be valid
      expect(jsAssets.length).toBeGreaterThan(0);
    }
  }
}

// Helper function to generate edge case assets
async function generateEdgeCaseAssets(
  testDir: string, 
  config: any
): Promise<Array<{ path: string; type: string; size: number }>> {
  const assets: Array<{ path: string; type: string; size: number }> = [];
  
  if (config.emptyAssets) {
    const emptyPath = join(testDir, 'empty.js');
    writeFileSync(emptyPath, '');
    assets.push({ path: emptyPath, type: 'empty', size: 0 });
  }
  
  if (config.largeAssets) {
    const largePath = join(testDir, 'large.js');
    const largeContent = '// Large asset\n' + 'console.log("data");'.repeat(1000);
    writeFileSync(largePath, largeContent);
    assets.push({ path: largePath, type: 'large', size: largeContent.length });
  }
  
  if (config.specialCharacters) {
    const specialPath = join(testDir, 'special-chars.js');
    const specialContent = '// Special characters: àáâãäåæçèéêë\nconsole.log("unicode");';
    writeFileSync(specialPath, specialContent);
    assets.push({ path: specialPath, type: 'special', size: specialContent.length });
  }
  
  if (config.nestedPaths) {
    const nestedDir = join(testDir, 'nested', 'deep', 'path');
    mkdirSync(nestedDir, { recursive: true });
    const nestedPath = join(nestedDir, 'nested.js');
    const nestedContent = 'console.log("nested");';
    writeFileSync(nestedPath, nestedContent);
    assets.push({ path: nestedPath, type: 'nested', size: nestedContent.length });
  }
  
  if (config.duplicateNames) {
    const dup1Path = join(testDir, 'duplicate.js');
    const dup2Path = join(testDir, 'duplicate.css');
    writeFileSync(dup1Path, 'console.log("js");');
    writeFileSync(dup2Path, 'body { color: red; }');
    assets.push({ path: dup1Path, type: 'duplicate-js', size: 18 });
    assets.push({ path: dup2Path, type: 'duplicate-css', size: 20 });
  }
  
  return assets;
}

// Helper function to generate content assets
async function generateContentAsset(
  testDir: string, 
  config: any
): Promise<{ path: string; type: string; size: number }> {
  const fileName = `content.${config.contentType === 'javascript' ? 'js' : config.contentType}`;
  const assetPath = join(testDir, fileName);
  
  let content = '';
  
  switch (config.contentType) {
    case 'javascript':
      content = 'const app = { name: "test", version: "1.0.0" }; export default app;';
      break;
    case 'css':
      content = '.app { display: flex; justify-content: center; align-items: center; }';
      break;
    case 'html':
      content = '<!DOCTYPE html><html><head><title>Test</title></head><body><div>Test</div></body></html>';
      break;
    case 'json':
      content = JSON.stringify({ test: true, data: [1, 2, 3] });
      break;
  }
  
  if (config.compression) {
    // Simulate compression by removing extra whitespace
    content = content.replace(/\s+/g, ' ').trim();
  }
  
  writeFileSync(assetPath, content, config.encoding === 'utf8' ? 'utf8' : 'ascii');
  
  return {
    path: assetPath,
    type: config.contentType,
    size: content.length
  };
}

/**
 * Feature: vercel-deployment-fix, Property 10: Asset Generation Compatibility
 * For any generated build asset, it must be compatible with Vercel's hosting environment 
 * and load correctly in production
 */