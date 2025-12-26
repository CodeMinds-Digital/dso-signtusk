import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: false, // Disable DTS generation for now due to monorepo path issues
    clean: true,
    external: [
        '@signtusk/database',
        '@signtusk/lib',
        '@signtusk/jobs',
    ],
});