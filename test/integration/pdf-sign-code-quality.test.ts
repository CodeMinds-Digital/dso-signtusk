import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('PDF Sign Package - Code Quality Standards', () => {
  const packagePath = join(process.cwd(), 'packages/pdf-sign');
  
  it('should have ESLint configuration following monorepo standards', () => {
    const eslintConfigPath = join(packagePath, '.eslintrc.cjs');
    expect(existsSync(eslintConfigPath)).toBe(true);
    
    const eslintConfig = readFileSync(eslintConfigPath, 'utf-8');
    
    // Verify key ESLint rules are configured
    expect(eslintConfig).toContain('@typescript-eslint/recommended');
    expect(eslintConfig).toContain('prettier');
    expect(eslintConfig).toContain('@typescript-eslint/no-floating-promises');
    expect(eslintConfig).toContain('@typescript-eslint/consistent-type-imports');
  });
  
  it('should have Prettier configuration matching monorepo standards', () => {
    const prettierConfigPath = join(packagePath, 'prettier.config.cjs');
    expect(existsSync(prettierConfigPath)).toBe(true);
    
    const prettierConfig = require(prettierConfigPath);
    
    // Verify standard Prettier settings
    expect(prettierConfig.printWidth).toBe(100);
    expect(prettierConfig.semi).toBe(true);
    expect(prettierConfig.singleQuote).toBe(true);
    expect(prettierConfig.tabWidth).toBe(2);
    expect(prettierConfig.trailingComma).toBe('all');
  });
  
  it('should have Rust formatting configuration', () => {
    const rustfmtPath = join(packagePath, 'rustfmt.toml');
    expect(existsSync(rustfmtPath)).toBe(true);
    
    const rustfmtConfig = readFileSync(rustfmtPath, 'utf-8');
    
    // Verify Rust formatting settings
    expect(rustfmtConfig).toContain('tab_spaces = 2');
    expect(rustfmtConfig).toContain('edition = "2021"');
  });
  
  it('should have TypeScript configuration for type checking', () => {
    const tsConfigPath = join(packagePath, 'tsconfig.json');
    expect(existsSync(tsConfigPath)).toBe(true);
    
    const tsConfig = JSON.parse(readFileSync(tsConfigPath, 'utf-8'));
    
    // Verify TypeScript compiler options
    expect(tsConfig.compilerOptions).toBeDefined();
    expect(tsConfig.compilerOptions.strict).toBe(true);
    expect(tsConfig.compilerOptions.target).toBeDefined();
  });
  
  it('should have proper ignore files for linting and formatting', () => {
    const eslintIgnorePath = join(packagePath, '.eslintignore');
    const prettierIgnorePath = join(packagePath, '.prettierignore');
    
    expect(existsSync(eslintIgnorePath)).toBe(true);
    expect(existsSync(prettierIgnorePath)).toBe(true);
  });
  
  it('should have format scripts in package.json', () => {
    const packageJsonPath = join(packagePath, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    // Verify formatting scripts exist
    expect(packageJson.scripts.format).toBeDefined();
    expect(packageJson.scripts['format:prettier']).toBeDefined();
    expect(packageJson.scripts['format:eslint']).toBeDefined();
    expect(packageJson.scripts['format:rs']).toBeDefined();
  });
});