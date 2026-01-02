module.exports = {
  root: true,
  extends: ["@signtusk/eslint-config"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  overrides: [
    {
      // Handle JavaScript files in scripts directory
      files: ["scripts/**/*.js"],
      parser: "espree",
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        // Disable TypeScript-specific rules for JS files
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/promise-function-async": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/consistent-type-imports": "off",
        // Allow CommonJS require() in Node.js scripts
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-require-imports": "off",
        "no-undef": "off",
        // Allow unused variables in catch blocks
        "@typescript-eslint/no-unused-vars": "off",
        "unused-imports/no-unused-vars": "off",
        // Disable Next.js specific import rules
        "@next/next/no-server-import-in-page": "off",
        // Allow any import style in scripts
        "import/no-commonjs": "off",
        "import/prefer-default-export": "off",
      },
    },
    {
      // Handle TypeScript files not in main tsconfig.json
      files: ["packages/**/*.ts", "packages/**/*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: null, // Don't use project-based linting for these files
        ecmaVersion: 2022,
        sourceType: "module",
      },
      rules: {
        // Disable rules that require type information
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/require-await": "off",
      },
    },
    {
      // Handle server files in apps/remix/server and vite config
      files: ["apps/remix/server/**/*.ts", "apps/remix/vite.config.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: null, // Don't use project-based linting for these files
        ecmaVersion: 2022,
        sourceType: "module",
      },
      rules: {
        // Disable rules that require type information
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/require-await": "off",
      },
    },
  ],
};
