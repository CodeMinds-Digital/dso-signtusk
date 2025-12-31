import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('PDF Sign Package - Incremental Rebuild Workflow', () => {
  const packagePath = join(process.cwd(), 'packages/pdf-sign');
  
  it('should have proper build configuration for incremental rebuilds', () => {
    // Verify package.json has build scripts
    const packageJsonPath = join(packagePath, 'package.json');
    expect(existsSync(packageJsonPath)).toBe(true);
    
    const packageJson = require(packageJsonPath);
    
    // Verify build scripts exist
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts['build:debug']).toBeDefined();
    
    // Verify NAPI configuration exists
    expect(packageJson.napi).toBeDefined();
    expect(packageJson.napi.name).toBe('pdf-sign');
  });
  
  it('should have Rust source files that can be modified', () => {
    // Verify main Rust files exist
    const libPath = join(packagePath, 'src/lib.rs');
    const cargoPath = join(packagePath, 'Cargo.toml');
    
    expect(existsSync(libPath)).toBe(true);
    expect(existsSync(cargoPath)).toBe(true);
  });
  
  it('should have platform-specific binary directories', () => {
    // Verify npm platform directories exist for binaries
    const npmPath = join(packagePath, 'npm');
    expect(existsSync(npmPath)).toBe(true);
    
    // Check for common platform directories
    const platforms = [
      'darwin-arm64',
      'darwin-x64', 
      'linux-x64-gnu',
      'win32-x64-msvc'
    ];
    
    platforms.forEach(platform => {
      const platformPath = join(npmPath, platform);
      expect(existsSync(platformPath)).toBe(true);
    });
  });
  
  it('should support TypeScript definitions for development workflow', () => {
    // Verify TypeScript configuration exists
    const tsConfigPath = join(packagePath, 'tsconfig.json');
    const indexDtsPath = join(packagePath, 'index.d.ts');
    
    expect(existsSync(tsConfigPath)).toBe(true);
    expect(existsSync(indexDtsPath)).toBe(true);
  });
});