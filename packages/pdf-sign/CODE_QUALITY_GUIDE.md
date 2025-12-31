# Code Quality Standards Guide

## Overview

This guide documents the code quality standards and tools configured for the `@signtusk/pdf-sign` package to ensure consistency with monorepo standards.

## Linting and Formatting Tools

### ESLint Configuration

The package uses ESLint with TypeScript support:

```bash
# Run ESLint with auto-fix
npm run format:eslint
```

**Key Rules Enforced:**
- TypeScript strict type checking
- Promise safety rules (no floating promises)
- Consistent type imports
- No unused variables
- Multi-space formatting rules

### Prettier Configuration

Prettier handles code formatting:

```bash
# Format all files
npm run format:prettier
```

**Settings:**
- Print width: 100 characters
- Single quotes: enabled
- Semicolons: required
- Tab width: 2 spaces
- Trailing commas: all

### Rust Formatting

Rust code uses `rustfmt`:

```bash
# Format Rust code
npm run format:rs
```

**Settings:**
- Tab spaces: 2
- Edition: 2021
- Standard Rust formatting conventions

## TypeScript Configuration

### Compiler Options

The `tsconfig.json` enforces:
- Strict mode enabled
- Modern ES target
- Node.js module resolution
- Declaration file generation

### Type Safety

- All functions must have proper type annotations
- No `any` types allowed without justification
- Consistent import/export patterns
- Proper error handling types

## Quality Assurance Workflow

### Pre-commit Checks

Run all formatting tools:

```bash
# Format all code types
npm run format
```

This runs:
1. ESLint with auto-fix
2. Prettier formatting
3. Rust formatting

### Development Workflow

1. **Write Code**: Follow TypeScript and Rust best practices
2. **Format**: Run `npm run format` before committing
3. **Type Check**: Ensure TypeScript compilation passes
4. **Test**: Run tests to verify functionality
5. **Commit**: Use conventional commit messages

## File Organization

### Source Files

- `src/lib.rs` - Main Rust library
- `src/errors.rs` - Error type definitions
- `src/gcloud_signer.rs` - Google Cloud integration
- `index.js` - JavaScript entry point
- `index.d.ts` - TypeScript definitions

### Configuration Files

- `.eslintrc.cjs` - ESLint configuration
- `prettier.config.cjs` - Prettier settings
- `rustfmt.toml` - Rust formatting
- `tsconfig.json` - TypeScript compiler options

### Ignore Files

- `.eslintignore` - Files to skip linting
- `.prettierignore` - Files to skip formatting
- `.gitignore` - Version control exclusions

## Monorepo Integration

### Consistency Standards

The package follows monorepo conventions:
- Consistent naming patterns
- Shared formatting rules
- Common TypeScript configuration
- Unified build processes

### Quality Gates

Before merging:
1. All linting rules must pass
2. Code must be properly formatted
3. TypeScript compilation must succeed
4. Tests must pass
5. Documentation must be updated

## Troubleshooting

### ESLint Issues

If ESLint fails:
1. Check for syntax errors
2. Verify TypeScript compilation
3. Update type definitions if needed
4. Run with `--fix` flag for auto-corrections

### Formatting Conflicts

If formatting tools conflict:
1. Prettier takes precedence for JavaScript/TypeScript
2. rustfmt handles Rust code
3. Use `.prettierignore` for exceptions
4. Configure ESLint to work with Prettier

### Build Integration

Quality checks integrate with:
- Pre-commit hooks
- CI/CD pipelines
- Development workflows
- Release processes