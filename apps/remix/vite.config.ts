import { lingui } from "@lingui/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import serverAdapter from "hono-react-router-adapter/vite";
import { createRequire } from "node:module";
import path from "node:path";
import tailwindcss from "tailwindcss";
import { defineConfig, normalizePath, type Plugin } from "vite";
import macrosPlugin from "vite-plugin-babel-macros";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";

const require = createRequire(import.meta.url);

const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
const cMapsDir = normalizePath(path.join(pdfjsDistPath, "cmaps"));

/**
 * Vite plugin that replaces @prisma/client imports with a browser-safe stub
 * ONLY for client-side builds. Server-side builds continue to use the real
 * @prisma/client.
 */
function prismaClientBrowserStub(): Plugin {
  const stubPath = path.resolve(__dirname, "./app/types/prisma-client-stub.ts");
  const emptyModulePath = path.resolve(
    __dirname,
    "./app/types/empty-module.ts"
  );

  return {
    name: "prisma-client-browser-stub",
    enforce: "pre",

    resolveId(source, _importer, options) {
      // Only apply to client builds (not SSR)
      if (options.ssr) {
        return null;
      }

      // Replace @prisma/client imports with our browser-safe stub
      if (source === "@prisma/client" || source.startsWith("@prisma/client/")) {
        return stubPath;
      }

      // Handle @signtusk/prisma and ALL its subpaths in client builds
      // This includes @signtusk/prisma/types/*, etc.
      if (
        source === "@signtusk/prisma" ||
        source.startsWith("@signtusk/prisma/")
      ) {
        return stubPath;
      }

      // Block pg and related packages from client builds
      if (
        source === "pg" ||
        source === "pg-native" ||
        source === "pg-pool" ||
        source.startsWith("pg/") ||
        source.startsWith("pg-native/") ||
        source.startsWith("pg-pool/")
      ) {
        return emptyModulePath;
      }

      // Redirect kysely to our stub which has Kysely exports
      if (
        source === "kysely" ||
        source.startsWith("kysely/") ||
        source === "prisma-extension-kysely"
      ) {
        return stubPath;
      }

      return null;
    },
  };
}

/**
 * Note: We load the env variables externally so we can have runtime enviroment variables
 * for docker.
 *
 * Do not configure any envs here.
 */
export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    strictPort: true,
  },
  define: {
    // Disable Sharp in browser environment
    "process.env.SHARP_IGNORE_GLOBAL_LIBVIPS": '"1"',
    // Provide process.env for browser compatibility
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production"
    ),
    // Define process for browser environments
    "process.browser": "true",
    "process.version": '""',
    // Define global process object for browser
    "global.process": JSON.stringify({
      env: { NODE_ENV: process.env.NODE_ENV || "production" },
      browser: true,
      version: "",
      versions: {},
      platform: "browser",
    }),
    // Define Buffer for browser environments
    "global.Buffer": "globalThis.Buffer",
    // Additional Node.js globals that might be needed
    global: "globalThis",
    // Ensure Buffer is available globally
    Buffer: "globalThis.Buffer",
  },
  plugins: [
    prismaClientBrowserStub(),
    viteStaticCopy({
      targets: [
        {
          src: cMapsDir,
          dest: "static",
        },
        {
          // Copy font files directly to /fonts/ (not fonts/fonts/)
          src: path.resolve(__dirname, "../../packages/assets/fonts/*"),
          dest: "fonts",
        },
        {
          src: path.resolve(
            __dirname,
            "../../packages/assets/site.webmanifest"
          ),
          dest: "",
        },
        {
          src: path.resolve(__dirname, "../../packages/assets/favicon-*.png"),
          dest: "",
        },
        {
          src: path.resolve(
            __dirname,
            "../../packages/assets/apple-touch-icon.png"
          ),
          dest: "",
        },
        {
          src: path.resolve(
            __dirname,
            "../../packages/assets/android-chrome-*.png"
          ),
          dest: "",
        },
      ],
    }),
    reactRouter(),
    macrosPlugin(),
    lingui(),
    tsconfigPaths(),
    serverAdapter({
      entry: "server/router.ts",
    }),
  ],
  ssr: {
    noExternal: ["react-dropzone", "plausible-tracker"],
    external: [
      "@napi-rs/canvas",
      "@prisma/client",
      "prisma",
      "kysely",
      "prisma-extension-kysely",
      "@signtusk/tailwind-config",
      "sharp",
      "@img/sharp-wasm32",
      "@img/sharp-libvips-dev",
      "node-gyp",
      "playwright",
      "playwright-core",
      "@playwright/browser-chromium",
      // PostgreSQL packages
      "pg",
      "pg-native",
      "pg-pool",
    ],
  },
  optimizeDeps: {
    entries: [
      "./app/**/*",
      "../../packages/ui/**/*",
      "../../packages/lib/**/*",
    ],
    include: [
      "prop-types",
      "file-selector",
      "attr-accept",
      "buffer",
      "process/browser",
      "util",
      "stream-browserify",
      "crypto-browserify",
    ],
    exclude: [
      "node_modules",
      "@napi-rs/canvas",
      "@signtusk/pdf-sign",
      "sharp",
      "@img/sharp-wasm32",
      "@img/sharp-libvips-dev",
      "node-gyp",
      "playwright",
      "playwright-core",
      "@playwright/browser-chromium",
    ],
    // Force pre-bundling of polyfills
    force: true,
  },
  resolve: {
    alias: {
      https: "node:https",
      canvas: path.resolve(__dirname, "./app/types/empty-module.ts"),
      // Redirect kysely to our stub for client builds
      kysely: path.resolve(__dirname, "./app/types/prisma-client-stub.ts"),
      // Redirect pg to empty module for client builds
      pg: path.resolve(__dirname, "./app/types/empty-module.ts"),
      "pg-native": path.resolve(__dirname, "./app/types/empty-module.ts"),
      "pg-pool": path.resolve(__dirname, "./app/types/empty-module.ts"),
      // Use the npm buffer package for browser environments
      // This provides a more complete Buffer implementation than our polyfill
      buffer: "buffer",
      process: "process/browser",
      util: "util",
      stream: "stream-browserify",
      crypto: "crypto-browserify",
    },
  },
  /**
   * Note: Re run rollup again to build the server afterwards.
   *
   * See rollup.config.mjs which is used for that.
   *
   * Note: @prisma/client is NOT in external here because we use the
   * prismaClientBrowserStub plugin to replace it with a browser-safe
   * stub for client builds. Server builds use ssr.external instead.
   *
   * IMPORTANT: Do NOT add pg, kysely, or @prisma/client to external here
   * as that would cause the browser to try to load them as ES modules.
   * Instead, they are stubbed by the prismaClientBrowserStub plugin.
   */
  build: {
    rollupOptions: {
      external: [
        "@napi-rs/canvas",
        "@signtusk/pdf-sign",
        "@aws-sdk/cloudfront-signer",
        "nodemailer",
        /playwright/,
        "@playwright/browser-chromium",
        "skia-canvas",
      ],
    },
  },
});
