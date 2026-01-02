/**
 * JSX Runtime Configuration Property-Based Tests
 *
 * **Feature: jsx-runtime-fix, Property 2: Build System JSX Configuration Alignment**
 * **Validates: Requirements 1.2, 1.3, 2.1, 2.4, 5.4**
 *
 * Tests that Vite, TypeScript, and React Router JSX configurations are aligned
 * and use automatic JSX runtime consistently across all build environments.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Helper function to read and parse configuration files
function readConfigFile(filePath: string): any {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, "utf-8");

    // Handle TypeScript config files (may have comments)
    if (filePath.endsWith(".ts") || filePath.endsWith(".js")) {
      // For Vite config, we need to extract the configuration object
      // This is a simplified approach - in practice, you might want to use a proper parser
      return { content, type: "module" };
    }

    // Handle JSON files
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to read config file ${filePath}:`, error);
    return null;
  }
}

// Helper function to extract JSX configuration from Vite config content
function extractViteJSXConfig(viteConfigContent: string): any {
  const jsxMatch = viteConfigContent.match(/jsx:\s*["']([^"']+)["']/);
  const jsxImportSourceMatch = viteConfigContent.match(
    /jsxImportSource:\s*["']([^"']+)["']/
  );
  const jsxDevMatch = viteConfigContent.match(/jsxDev:\s*([^,\n}]+)/);

  return {
    jsx: jsxMatch ? jsxMatch[1] : null,
    jsxImportSource: jsxImportSourceMatch ? jsxImportSourceMatch[1] : null,
    jsxDev: jsxDevMatch ? jsxDevMatch[1].trim() : null,
  };
}

// Helper function to check if React Router is configured for SSR
function checkReactRouterSSRConfig(viteConfigContent: string): boolean {
  return (
    viteConfigContent.includes("reactRouter") &&
    viteConfigContent.includes("ssr: true")
  );
}

describe("JSX Runtime Configuration Alignment", () => {
  const remixAppPath = resolve(__dirname, "../../apps/remix");
  const viteConfigPath = resolve(remixAppPath, "vite.config.ts");
  const tsConfigPath = resolve(remixAppPath, "tsconfig.json");
  const packageJsonPath = resolve(remixAppPath, "package.json");

  /**
   * Property 2: Build System JSX Configuration Alignment
   * For any build configuration, the Build System SHALL ensure that Vite, TypeScript,
   * and React Router JSX configurations are aligned and use automatic JSX runtime consistently
   */
  describe("Property 2: Build System JSX Configuration Alignment", () => {
    it("should have consistent JSX runtime configuration between Vite and TypeScript", () => {
      const viteConfig = readConfigFile(viteConfigPath);
      const tsConfig = readConfigFile(tsConfigPath);

      fc.assert(
        fc.property(
          fc.constantFrom("development", "production"),
          (environment) => {
            // Vite configuration should exist and be valid
            expect(viteConfig).toBeTruthy();
            expect(viteConfig.content).toBeTruthy();

            // TypeScript configuration should exist and be valid
            expect(tsConfig).toBeTruthy();
            expect(tsConfig.compilerOptions).toBeTruthy();

            // Extract JSX configuration from Vite config
            const viteJSXConfig = extractViteJSXConfig(viteConfig.content);

            // Vite should use automatic JSX runtime
            expect(viteJSXConfig.jsx).toBe("automatic");
            expect(viteJSXConfig.jsxImportSource).toBe("react");

            // TypeScript should use react-jsx for automatic runtime
            expect(tsConfig.compilerOptions.jsx).toBe("react-jsx");
            expect(tsConfig.compilerOptions.jsxImportSource).toBe("react");

            // JSX runtime should be environment-aware in Vite
            if (environment === "development") {
              // Development should have jsxDev configured
              expect(viteJSXConfig.jsxDev).toContain("development");
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it("should have proper React Router SSR configuration with JSX runtime", () => {
      const viteConfig = readConfigFile(viteConfigPath);
      const packageJson = readConfigFile(packageJsonPath);

      fc.assert(
        fc.property(fc.constantFrom("client", "server"), (buildTarget) => {
          expect(viteConfig).toBeTruthy();
          expect(packageJson).toBeTruthy();

          // React Router should be configured for SSR
          expect(checkReactRouterSSRConfig(viteConfig.content)).toBe(true);

          // React version should support automatic JSX runtime (18+)
          const reactVersion =
            packageJson.dependencies?.react ||
            packageJson.devDependencies?.react;
          expect(reactVersion).toBeTruthy();
          expect(reactVersion).toMatch(/^\^?18/);

          // Vite config should have SSR configuration
          expect(viteConfig.content).toContain("ssr:");

          // JSX configuration should be consistent for both client and server builds
          const jsxConfig = extractViteJSXConfig(viteConfig.content);
          expect(jsxConfig.jsx).toBe("automatic");
          expect(jsxConfig.jsxImportSource).toBe("react");
        }),
        { numRuns: 10 }
      );
    });

    it("should not have conflicting JSX configuration between build tools", () => {
      const viteConfig = readConfigFile(viteConfigPath);
      const tsConfig = readConfigFile(tsConfigPath);

      fc.assert(
        fc.property(
          fc.constantFrom("esbuild", "typescript", "babel"),
          (buildTool) => {
            expect(viteConfig).toBeTruthy();
            expect(tsConfig).toBeTruthy();

            const viteJSXConfig = extractViteJSXConfig(viteConfig.content);

            // No conflicting JSX pragma configurations
            expect(viteConfig.content).not.toContain("pragma:");
            expect(viteConfig.content).not.toContain("pragmaFrag:");

            // TypeScript should not have classic JSX configuration
            expect(tsConfig.compilerOptions.jsx).not.toBe("react");
            expect(tsConfig.compilerOptions.jsx).not.toBe("preserve");

            // Vite should not use classic JSX transform
            expect(viteJSXConfig.jsx).not.toBe("transform");
            expect(viteJSXConfig.jsx).not.toBe("preserve");

            // Should use consistent import source
            expect(viteJSXConfig.jsxImportSource).toBe(
              tsConfig.compilerOptions.jsxImportSource
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it("should have proper JSX runtime module resolution configuration", () => {
      const viteConfig = readConfigFile(viteConfigPath);
      const tsConfig = readConfigFile(tsConfigPath);

      fc.assert(
        fc.property(fc.constantFrom("node", "bundler"), (moduleResolution) => {
          expect(viteConfig).toBeTruthy();
          expect(tsConfig).toBeTruthy();

          // TypeScript module resolution should support JSX runtime
          const tsModuleResolution = tsConfig.compilerOptions.moduleResolution;
          expect(["bundler", "node", "node16", "nodenext"]).toContain(
            tsModuleResolution
          );

          // Vite should have proper SSR resolve configuration
          expect(viteConfig.content).toContain("ssr:");

          // Should not externalize React in SSR context for JSX runtime
          if (viteConfig.content.includes("external:")) {
            expect(viteConfig.content).not.toMatch(
              /external:\s*\[[\s\S]*["']react["'][\s\S]*\]/
            );
          }

          // JSX import source should be resolvable
          const jsxConfig = extractViteJSXConfig(viteConfig.content);
          expect(jsxConfig.jsxImportSource).toBe("react");
        }),
        { numRuns: 10 }
      );
    });

    it("should have environment-specific JSX runtime selection", () => {
      const viteConfig = readConfigFile(viteConfigPath);

      fc.assert(
        fc.property(
          fc.record({
            nodeEnv: fc.constantFrom("development", "production", "test"),
            buildMode: fc.constantFrom("dev", "build", "preview"),
          }),
          ({ nodeEnv, buildMode }) => {
            expect(viteConfig).toBeTruthy();

            const jsxConfig = extractViteJSXConfig(viteConfig.content);

            // Should use automatic JSX runtime regardless of environment
            expect(jsxConfig.jsx).toBe("automatic");

            // JSX development mode should be environment-aware
            if (nodeEnv === "development" || buildMode === "dev") {
              // Development should enable JSX development features
              expect(jsxConfig.jsxDev).toBeTruthy();
            }

            // Should not force specific NODE_ENV in define
            expect(viteConfig.content).not.toContain(
              '"process.env.NODE_ENV": \'"development"\''
            );
            expect(viteConfig.content).not.toContain(
              '"process.env.NODE_ENV": \'"production"\''
            );
          }
        ),
        { numRuns: 15 }
      );
    });

    it("should have proper JSX runtime availability in SSR context", () => {
      const viteConfig = readConfigFile(viteConfigPath);

      fc.assert(
        fc.property(
          fc.constantFrom(
            "renderToPipeableStream",
            "renderToString",
            "renderToStaticMarkup"
          ),
          (ssrMethod) => {
            expect(viteConfig).toBeTruthy();

            // SSR configuration should exist
            expect(viteConfig.content).toContain("ssr:");

            // Should have proper resolve conditions for SSR
            if (viteConfig.content.includes("resolve:")) {
              expect(viteConfig.content).toMatch(
                /conditions:\s*\[[\s\S]*["']node["'][\s\S]*\]/
              );
            }

            // JSX runtime should be available in SSR
            const jsxConfig = extractViteJSXConfig(viteConfig.content);
            expect(jsxConfig.jsx).toBe("automatic");
            expect(jsxConfig.jsxImportSource).toBe("react");

            // Should not externalize JSX runtime dependencies
            expect(viteConfig.content).not.toMatch(
              /external:\s*\[[\s\S]*["']react\/jsx-runtime["'][\s\S]*\]/
            );
            expect(viteConfig.content).not.toMatch(
              /external:\s*\[[\s\S]*["']react\/jsx-dev-runtime["'][\s\S]*\]/
            );
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
