/**
 * Rebranding infrastructure - Main exports
 */

export * from './brand-mapping.js';
export * from './file-scanner.js';
export * from './text-replacer.js';

// Re-export main classes for convenience
export { FileScanner, createFileScanner } from './file-scanner.js';
export { TextReplacer, createTextReplacer } from './text-replacer.js';
export {
    BRAND_MAPPING,
    PACKAGE_SCOPE_MAPPING,
    FILE_TYPE_PATTERNS
} from './brand-mapping.js';