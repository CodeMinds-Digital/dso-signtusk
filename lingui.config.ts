import { defineConfig } from '@lingui/cli';
import type { LinguiConfig } from '@lingui/conf';
import { formatter } from '@lingui/format-po';

// Inlined from @signtusk/lib/constants/i18n to avoid module resolution issues on Vercel
const SUPPORTED_LANGUAGE_CODES = ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl', 'pt-BR', 'ja', 'ko', 'zh'] as const;

const config: LinguiConfig = {
    sourceLocale: 'en',
    locales: SUPPORTED_LANGUAGE_CODES as unknown as string[],
    // Any changes to these catalogue paths should be reflected in crowdin.yml
    catalogs: [
        {
            path: '<rootDir>/packages/lib/translations/{locale}/web',
            include: ['apps/remix/app', 'packages/ui', 'packages/lib', 'packages/email'],
            exclude: ['**/node_modules/**'],
        },
    ],
    compileNamespace: 'es',
    format: formatter({ lineNumbers: false }),
};

export default config;