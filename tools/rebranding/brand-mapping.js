/**
 * Brand mapping configuration for rebranding DocuSign Alternative to Signtusk
 */
/**
 * Main brand mapping configuration
 */
export const BRAND_MAPPING = {
    oldBrand: 'DocuSign Alternative',
    newBrand: 'Signtusk',
    variants: {
        camelCase: {
            old: 'docuSignAlternative',
            new: 'signtusk'
        },
        kebabCase: {
            old: 'docusign-alternative',
            new: 'signtusk'
        },
        pascalCase: {
            old: 'DocuSignAlternative',
            new: 'Signtusk'
        },
        lowercase: {
            old: 'docusign alternative',
            new: 'signtusk'
        },
        uppercase: {
            old: 'DOCUSIGN ALTERNATIVE',
            new: 'SIGNTUSK'
        },
        snakeCase: {
            old: 'docusign_alternative',
            new: 'signtusk'
        }
    }
};
/**
 * Package scope mapping configuration
 */
export const PACKAGE_SCOPE_MAPPING = {
    oldScope: '@signtusk',
    newScope: '@signtusk',
    packageNames: [
        'root',
        'ai',
        'analytics',
        'api',
        'assets',
        'auth',
        'billing',
        'blockchain',
        'cache',
        'compliance',
        'database',
        'ee',
        'email',
        'eslint-config',
        'file-processing',
        'i18n',
        'infrastructure',
        'integrations',
        'jobs',
        'lib',
        'marketplace',
        'notifications',
        'pdf',
        'pdf-processing',
        'pdf-sign',
        'performance',
        'prettier-config',
        'prisma',
        'realtime',
        'remix',
        'sdk',
        'search',
        'security',
        'signing',
        'storage',
        'tailwind-config',
        'templates',
        'trpc',
        'tsconfig',
        'ui',
        'web',
        'webhooks',
        'white-label'
    ]
};
/**
 * File type patterns for different replacement strategies
 */
export const FILE_TYPE_PATTERNS = {
    packageJson: /package\.json$/,
    typescript: /\.(ts|tsx)$/,
    javascript: /\.(js|jsx|mjs|cjs)$/,
    markdown: /\.md$/,
    yaml: /\.(yml|yaml)$/,
    json: /\.json$/,
    config: /\.(config|conf)\.(js|ts|json)$/,
    env: /\.env(\.|$)/,
    shell: /\.(sh|bash)$/
};
/**
 * Directories to exclude from scanning
 */
export const EXCLUDED_DIRECTORIES = [
    'node_modules',
    '.git',
    '.turbo',
    'dist',
    'build',
    'coverage',
    '.next',
    'backups',
    'reports'
];
/**
 * Files to exclude from scanning
 */
export const EXCLUDED_FILES = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
    'tsconfig.tsbuildinfo'
];
