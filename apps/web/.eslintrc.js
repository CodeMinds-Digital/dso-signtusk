module.exports = {
    extends: ['next/core-web-vitals', '../../packages/eslint-config'],
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
}