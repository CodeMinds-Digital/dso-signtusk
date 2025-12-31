module.exports = {
    extends: ['../../packages/eslint-config', 'next/core-web-vitals'],
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
}