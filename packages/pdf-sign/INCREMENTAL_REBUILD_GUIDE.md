# Incremental Rebuild Guide

## Overview

This guide documents the incremental rebuild workflow for the `@signtusk/pdf-sign` package, ensuring efficient development cycles when making changes to the Rust/NAPI codebase.

## Prerequisites

- Rust toolchain installed (`rustc`, `cargo`)
- Node.js and npm
- NAPI-RS CLI (`@napi-rs/cli`)

## Incremental Rebuild Process

### 1. Development Build

For faster development cycles, use the debug build:

```bash
npm run build:debug
```

This command:

- Compiles Rust code without optimizations
- Generates platform-specific binaries faster
- Preserves debug symbols for debugging

### 2. Making Changes

When modifying Rust source files in `src/`:

- `src/lib.rs` - Main library functions
- `src/errors.rs` - Error handling
- `src/gcloud_signer.rs` - Google Cloud signing implementation

### 3. Incremental Rebuild

After making changes:

```bash
# Quick debug build for testing
npm run build:debug

# Or full optimized build for production
npm run build
```

### 4. Verification

Test that changes work correctly:

```bash
# Run package tests
npm test

# Or test from consuming packages
cd ../../packages/signing
npm test
```

## Build Optimization

### Cargo Build Cache

Cargo automatically caches:

- Compiled dependencies
- Incremental compilation artifacts
- Target-specific builds

### NAPI-RS Optimizations

The NAPI-RS CLI provides:

- Platform-specific builds
- Automatic TypeScript definition generation
- Binary artifact management

## Troubleshooting

### Clean Rebuild

If incremental builds fail:

```bash
# Clean Cargo cache
cargo clean

# Clean npm artifacts
rm -rf npm/*/
rm -f index.js index.d.ts

# Full rebuild
npm run build
```

### Platform Issues

For platform-specific problems:

```bash
# Build for specific platform
napi build --platform --target <target-triple>

# Available targets in package.json napi.triples.additional
```

## Development Workflow

1. Make changes to Rust source files
2. Run `npm run build:debug` for quick testing
3. Test functionality with consuming packages
4. Run `npm run build` for production-ready artifacts
5. Commit changes with both source and generated files

## Performance Notes

- Debug builds are ~10x faster than release builds
- Incremental compilation reduces rebuild time by 50-80%
- Platform-specific builds can be parallelized
- TypeScript definitions are regenerated on each build
