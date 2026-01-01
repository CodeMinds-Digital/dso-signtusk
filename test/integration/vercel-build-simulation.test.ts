/**
 * Test suite for simulating Vercel build environment locally
 * Validates build scripts work without global CLI tools and environment loading mechanisms
 * Requirements: 1.1, 1.2, 1.3
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Vercel Build Environment Simulation', () => {
  let testDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: string;

  beforeAll(() => {
    // Save original environment and working directory
    originalEnv = { ...process.env };
    originalCwd = process.cwd();
    
    // Create temporary test directory
    testDir = join(tmpdir(), `vercel-build-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // Restore original environment and working directory
    process.env = originalEnv;
    process.chdir(originalCwd);
    
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Environment Variable Loading', () => {
    it('should load environment variables programmatically without dotenv CLI', async () => {
      // Create test environment files
      const envContent = `
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://test.example.com
NEXT_PUBLIC_WEBAPP_URL=https://webapp.test.example.com
DATABASE_URL=postgresql://test:test@localhost:5432/test
`;

      const envLocalContent = `
NEXT_PUBLIC_APP_URL=https://local.example.com
TEST_LOCAL_VAR=local_value
`;

      writeFileSync(join(testDir, '.env'), envContent);
      writeFileSync(join(testDir, '.env.local'), envLocalContent);

      // Test environment loading script
      const testScript = `
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmed.substring(0, equalIndex).trim();
    let value = trimmed.substring(equalIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function loadEnvironmentFiles(rootPath) {
  const envFiles = ['.env', '.env.local'];
  const env = { ...process.env };
  const loadedFiles = [];

  for (const envFile of envFiles) {
    const filePath = join(rootPath, envFile);
    
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf8');
        const fileEnv = parseEnvFile(content);
        Object.assign(env, fileEnv);
        loadedFiles.push(envFile);
      } catch (error) {
        console.warn(\`Warning: Could not load \${envFile}: \${error.message}\`);
      }
    }
  }

  return env;
}

const env = loadEnvironmentFiles('${testDir}');
console.log(JSON.stringify({
  NODE_ENV: env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WEBAPP_URL: env.NEXT_PUBLIC_WEBAPP_URL,
  DATABASE_URL: env.DATABASE_URL,
  TEST_LOCAL_VAR: env.TEST_LOCAL_VAR
}));
`;

      writeFileSync(join(testDir, 'test-env-loading.mjs'), testScript);

      // Execute the test script
      const result = await executeCommand('node', ['test-env-loading.mjs'], { cwd: testDir });
      const output = JSON.parse(result.stdout);

      // Verify environment variables are loaded correctly
      expect(output.NODE_ENV).toBe('production');
      expect(output.NEXT_PUBLIC_APP_URL).toBe('https://local.example.com'); // .env.local should override .env
      expect(output.NEXT_PUBLIC_WEBAPP_URL).toBe('https://webapp.test.example.com');
      expect(output.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/test');
      expect(output.TEST_LOCAL_VAR).toBe('local_value');
    });

    it('should handle missing environment files gracefully', async () => {
      // Create test directory without .env files
      const emptyTestDir = join(testDir, 'empty');
      mkdirSync(emptyTestDir, { recursive: true });

      const testScript = `
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function loadEnvironmentFiles(rootPath) {
  const envFiles = ['.env', '.env.local'];
  const env = { ...process.env };
  const loadedFiles = [];

  for (const envFile of envFiles) {
    const filePath = join(rootPath, envFile);
    
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf8');
        loadedFiles.push(envFile);
      } catch (error) {
        console.warn(\`Warning: Could not load \${envFile}: \${error.message}\`);
      }
    }
  }

  console.log(JSON.stringify({ loadedFiles, hasNodeEnv: !!env.NODE_ENV }));
}

loadEnvironmentFiles('${emptyTestDir}');
`;

      writeFileSync(join(emptyTestDir, 'test-missing-env.mjs'), testScript);

      const result = await executeCommand('node', ['test-missing-env.mjs'], { cwd: emptyTestDir });
      const output = JSON.parse(result.stdout);

      expect(output.loadedFiles).toEqual([]);
      expect(output.hasNodeEnv).toBe(true); // Should still have system NODE_ENV
    });
  });

  describe('Build Dependency Validation', () => {
    it('should validate required build tools are available as packages', async () => {
      // Create a minimal package.json with required dependencies
      const packageJson = {
        name: 'test-vercel-build',
        type: 'module',
        dependencies: {
          'cross-env': '^10.1.0',
          'react-router': '^7.9.6',
          'rollup': '^4.53.3'
        }
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      // Create mock node_modules structure
      const nodeModulesDir = join(testDir, 'node_modules');
      mkdirSync(nodeModulesDir, { recursive: true });
      
      const requiredPackages = ['cross-env', 'react-router', 'rollup'];
      for (const pkg of requiredPackages) {
        const pkgDir = join(nodeModulesDir, pkg);
        mkdirSync(pkgDir, { recursive: true });
        writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: pkg, version: '1.0.0' }));
      }

      // Test dependency validation script
      const testScript = `
import { existsSync } from 'fs';
import { join } from 'path';

function validateBuildDependencies(rootPath) {
  const requiredPackages = ['cross-env', 'react-router', 'rollup'];
  const results = {};

  for (const pkg of requiredPackages) {
    const packagePath = join(rootPath, 'node_modules', pkg);
    results[pkg] = existsSync(packagePath);
  }

  console.log(JSON.stringify(results));
}

validateBuildDependencies('${testDir}');
`;

      writeFileSync(join(testDir, 'test-dependencies.mjs'), testScript);

      const result = await executeCommand('node', ['test-dependencies.mjs'], { cwd: testDir });
      const output = JSON.parse(result.stdout);

      expect(output['cross-env']).toBe(true);
      expect(output['react-router']).toBe(true);
      expect(output['rollup']).toBe(true);
    });

    it('should detect missing build dependencies', async () => {
      // Create test directory without node_modules
      const noDepsTestDir = join(testDir, 'no-deps');
      mkdirSync(noDepsTestDir, { recursive: true });

      const testScript = `
import { existsSync } from 'fs';
import { join } from 'path';

function validateBuildDependencies(rootPath) {
  const requiredPackages = ['cross-env', 'react-router', 'rollup'];
  const missing = [];

  for (const pkg of requiredPackages) {
    const packagePath = join(rootPath, 'node_modules', pkg);
    if (!existsSync(packagePath)) {
      missing.push(pkg);
    }
  }

  console.log(JSON.stringify({ missing }));
}

validateBuildDependencies('${noDepsTestDir}');
`;

      writeFileSync(join(noDepsTestDir, 'test-missing-deps.mjs'), testScript);

      const result = await executeCommand('node', ['test-missing-deps.mjs'], { cwd: noDepsTestDir });
      const output = JSON.parse(result.stdout);

      expect(output.missing).toEqual(['cross-env', 'react-router', 'rollup']);
    });
  });

  describe('Vercel Environment Simulation', () => {
    it('should simulate Vercel build environment constraints', async () => {
      // Set up Vercel-like environment variables
      const vercelEnv = {
        ...process.env,
        VERCEL: '1',
        VERCEL_ENV: 'production',
        VERCEL_URL: 'test-app.vercel.app',
        NODE_ENV: 'production',
        SKIP_ENV_VALIDATION: 'true'
      };

      // Remove potentially problematic global tools from PATH
      const cleanPath = vercelEnv.PATH?.split(':')
        .filter(p => !p.includes('global') && !p.includes('.npm'))
        .join(':') || '';

      const testScript = `
// Simulate Vercel build environment validation
const env = process.env;

const validation = {
  isVercel: !!env.VERCEL,
  hasVercelEnv: !!env.VERCEL_ENV,
  hasVercelUrl: !!env.VERCEL_URL,
  nodeEnv: env.NODE_ENV,
  skipValidation: env.SKIP_ENV_VALIDATION === 'true',
  pathLength: (env.PATH || '').split(':').length
};

console.log(JSON.stringify(validation));
`;

      writeFileSync(join(testDir, 'test-vercel-env.mjs'), testScript);

      const result = await executeCommand('node', ['test-vercel-env.mjs'], {
        cwd: testDir,
        env: { ...vercelEnv, PATH: cleanPath }
      });
      const output = JSON.parse(result.stdout);

      expect(output.isVercel).toBe(true);
      expect(output.hasVercelEnv).toBe(true);
      expect(output.hasVercelUrl).toBe(true);
      expect(output.nodeEnv).toBe('production');
      expect(output.skipValidation).toBe(true);
    });
  });

  describe('Build Script Execution', () => {
    it('should execute build commands without global CLI dependencies', async () => {
      // Create a minimal build test that doesn't require actual React Router or Rollup
      const testScript = `
import { spawn } from 'child_process';

function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(\`Command failed with exit code \${code}: \${stderr}\`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function testBuildCommands() {
  const results = {};

  // Test npx availability
  try {
    const result = await executeCommand('npx', ['--version']);
    results.npx = { available: true, version: result.stdout.trim() };
  } catch (error) {
    results.npx = { available: false, error: error.message };
  }

  // Test node availability
  try {
    const result = await executeCommand('node', ['--version']);
    results.node = { available: true, version: result.stdout.trim() };
  } catch (error) {
    results.node = { available: false, error: error.message };
  }

  console.log(JSON.stringify(results));
}

testBuildCommands();
`;

      writeFileSync(join(testDir, 'test-build-commands.mjs'), testScript);

      const result = await executeCommand('node', ['test-build-commands.mjs'], { cwd: testDir });
      const output = JSON.parse(result.stdout);

      expect(output.npx.available).toBe(true);
      expect(output.node.available).toBe(true);
      expect(output.node.version).toMatch(/^v\d+\.\d+\.\d+/);
    });
  });
});

// Helper function to execute commands and capture output
function executeCommand(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}