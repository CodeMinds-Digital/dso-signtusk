import { lingui } from "@lingui/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import serverAdapter from "hono-react-router-adapter/vite";
import { createRequire } from "node:module";
import path from "node:path";
import tailwindcss from "tailwindcss";
import { defineConfig, normalizePath } from "vite";
import macrosPlugin from "vite-plugin-babel-macros";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";

const require = createRequire(import.meta.url);

const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
const cMapsDir = normalizePath(path.join(pdfjsDistPath, "cmaps"));

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
    // Ensure JSX runtime is available and React DOM server uses correct build
    __DEV__: process.env.NODE_ENV === "development",
    // Force React DOM server to respect NODE_ENV for build selection
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
    jsxDev: process.env.NODE_ENV === "development",
    target: "es2022",
    keepNames: true,
    logOverride: {
      "this-is-undefined-in-esm": "silent",
    },
  },
  plugins: [
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
    noExternal: [
      "react-dropzone",
      "plausible-tracker",
      // Force React DOM server to be bundled so we can control which build is used
      "react-dom/server",
    ],
    external: [
      "@napi-rs/canvas",
      "@node-rs/bcrypt",
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
    target: "node",
    // Ensure JSX runtime is available in SSR context with proper React DOM server resolution
    resolve: {
      conditions:
        process.env.NODE_ENV === "development"
          ? ["node", "development", "import", "module", "default"]
          : ["node", "production", "import", "module", "default"],
      externalConditions: ["node"],
    },
  },
  optimizeDeps: {
    entries: [
      "./app/**/*",
      "../../packages/ui/**/*",
      "../../packages/lib/**/*",
    ],
    include: ["prop-types", "file-selector", "attr-accept", "@prisma/client"],
    exclude: [
      "node_modules",
      "@napi-rs/canvas",
      "@node-rs/bcrypt",
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
      // Force React DOM server to use the correct build for the environment
      "react-dom/server":
        process.env.NODE_ENV === "development"
          ? "react-dom/server.node.development.js"
          : "react-dom/server.node.production.min.js",
      // Redirect cmdk's old Radix UI dependencies to newer versions
      "cmdk/node_modules/@radix-ui/react-primitive":
        "@radix-ui/react-primitive",
      "cmdk/node_modules/@radix-ui/react-slot": "@radix-ui/react-slot",
      "cmdk/node_modules/@radix-ui/react-use-layout-effect":
        "@radix-ui/react-use-layout-effect",
    },
  },
  /**
   * Note: Re run rollup again to build the server afterwards.
   *
   * See rollup.config.mjs which is used for that.
   */
  build: {
    rollupOptions: {
      external: [
        "@napi-rs/canvas",
        "@node-rs/bcrypt",
        "@aws-sdk/cloudfront-signer",
        "nodemailer",
        /playwright/,
        "@playwright/browser-chromium",
        "skia-canvas",
      ],
    },
  },
});
