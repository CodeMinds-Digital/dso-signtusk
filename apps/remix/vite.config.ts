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

  return {
    name: "prisma-client-browser-stub",
    enforce: "pre",

    resolveId(source, _importer, options) {
      // Only apply to client builds (not SSR)
      if (options.ssr) {
        return null;
      }

      // Replace @prisma/client imports with our browser-safe stub
      if (source === "@prisma/client") {
        return stubPath;
      }

      // Also handle @signtusk/prisma imports in client builds
      // since it re-exports from @prisma/client
      if (source === "@signtusk/prisma") {
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
  },
  plugins: [
    prismaClientBrowserStub(),
    viteStaticCopy({
      targets: [
        {
          src: cMapsDir,
          dest: "static",
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
    ],
  },
  optimizeDeps: {
    entries: [
      "./app/**/*",
      "../../packages/ui/**/*",
      "../../packages/lib/**/*",
    ],
    include: ["prop-types", "file-selector", "attr-accept"],
    exclude: [
      "node_modules",
      "@napi-rs/canvas",
      "@prisma/client",
      "@signtusk/pdf-sign",
      "@signtusk/prisma",
      "prisma",
      "kysely",
      "prisma-extension-kysely",
      "sharp",
      "@img/sharp-wasm32",
      "@img/sharp-libvips-dev",
      "node-gyp",
      "playwright",
      "playwright-core",
      "@playwright/browser-chromium",
    ],
  },
  resolve: {
    alias: {
      https: "node:https",
      canvas: path.resolve(__dirname, "./app/types/empty-module.ts"),
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
