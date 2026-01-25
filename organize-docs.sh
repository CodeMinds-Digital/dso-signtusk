#!/bin/bash

# Organize all .md files into docs folder with logical structure

set -e

echo "📚 Organizing Documentation Files"
echo "=================================="
echo ""

# Create docs structure
mkdir -p docs/{database,deployment,docker,environment,fixes,guides,troubleshooting}

echo "📁 Created folder structure:"
echo "  docs/"
echo "    ├── database/          (Database setup and configuration)"
echo "    ├── deployment/        (Deployment guides)"
echo "    ├── docker/            (Docker-related docs)"
echo "    ├── environment/       (Environment configuration)"
echo "    ├── fixes/             (Bug fixes and solutions)"
echo "    ├── guides/            (General guides)"
echo "    └── troubleshooting/   (Troubleshooting guides)"
echo ""

# Count files
TOTAL=$(find . -maxdepth 1 -name "*.md" -type f | wc -l)
echo "📊 Found $TOTAL markdown files to organize"
echo ""

# Database files
echo "Moving database documentation..."
mv DATABASE*.md docs/database/ 2>/dev/null || true
mv NEON*.md docs/database/ 2>/dev/null || true
mv SUPABASE*.md docs/database/ 2>/dev/null || true
mv DOKPLOY_POSTGRES*.md docs/database/ 2>/dev/null || true
mv SWITCH_TO_SUPABASE*.md docs/database/ 2>/dev/null || true

# Deployment files
echo "Moving deployment documentation..."
mv DEPLOYMENT*.md docs/deployment/ 2>/dev/null || true
mv DOKPLOY_DEPLOY*.md docs/deployment/ 2>/dev/null || true
mv DOKPLOY_READY*.md docs/deployment/ 2>/dev/null || true
mv DOKPLOY_QUICK*.md docs/deployment/ 2>/dev/null || true
mv DOKPLOY_COMPLETE*.md docs/deployment/ 2>/dev/null || true
mv DOKPLOY_PRODUCTION*.md docs/deployment/ 2>/dev/null || true
mv DOKPLOY_DEPLOYMENT*.md docs/deployment/ 2>/dev/null || true
mv VERCEL_DEPLOYMENT*.md docs/deployment/ 2>/dev/null || true
mv VERCEL_SETUP*.md docs/deployment/ 2>/dev/null || true
mv VERCEL_VS*.md docs/deployment/ 2>/dev/null || true
mv NIXPACKS*.md docs/deployment/ 2>/dev/null || true
mv RAILWAY*.md docs/deployment/ 2>/dev/null || true
mv DEPLOY*.md docs/deployment/ 2>/dev/null || true

# Docker files
echo "Moving Docker documentation..."
mv DOCKER*.md docs/docker/ 2>/dev/null || true
mv DOCKERFILE*.md docs/docker/ 2>/dev/null || true
mv TURBO_PRUNE*.md docs/docker/ 2>/dev/null || true

# Environment files
echo "Moving environment documentation..."
mv ENV*.md docs/environment/ 2>/dev/null || true
mv CERTIFICATE*.md docs/environment/ 2>/dev/null || true
mv ADD_CERT*.md docs/environment/ 2>/dev/null || true

# Fixes
echo "Moving fix documentation..."
mv *FIX*.md docs/fixes/ 2>/dev/null || true
mv *FIXED*.md docs/fixes/ 2>/dev/null || true
mv PHANTOM_FIELD*.md docs/fixes/ 2>/dev/null || true
mv COMPLETION*.md docs/fixes/ 2>/dev/null || true
mv SIGNING_ISSUE*.md docs/fixes/ 2>/dev/null || true
mv SERVERLESS*.md docs/fixes/ 2>/dev/null || true
mv NETWORK_ERROR*.md docs/fixes/ 2>/dev/null || true
mv REACT_ROUTER*.md docs/fixes/ 2>/dev/null || true
mv TYPECHECK*.md docs/fixes/ 2>/dev/null || true
mv BUFFER*.md docs/fixes/ 2>/dev/null || true
mv PRISMA*.md docs/fixes/ 2>/dev/null || true

# Troubleshooting
echo "Moving troubleshooting documentation..."
mv *502*.md docs/troubleshooting/ 2>/dev/null || true
mv WHY_*.md docs/troubleshooting/ 2>/dev/null || true
mv DOKPLOY_CONFIG*.md docs/troubleshooting/ 2>/dev/null || true
mv DOKPLOY_ENV*.md docs/troubleshooting/ 2>/dev/null || true
mv DOKPLOY_OFFICIAL*.md docs/troubleshooting/ 2>/dev/null || true
mv DOKPLOY_FINAL*.md docs/troubleshooting/ 2>/dev/null || true
mv CHECK_THIS*.md docs/troubleshooting/ 2>/dev/null || true
mv QUICK_DIAGNOSTIC*.md docs/troubleshooting/ 2>/dev/null || true

# Guides
echo "Moving general guides..."
mv QUICK*.md docs/guides/ 2>/dev/null || true
mv SIMPLE*.md docs/guides/ 2>/dev/null || true
mv START_HERE*.md docs/guides/ 2>/dev/null || true
mv INDEX.md docs/guides/ 2>/dev/null || true
mv COMPLETE_SOLUTION.md docs/guides/ 2>/dev/null || true
mv ARCHITECTURE*.md docs/guides/ 2>/dev/null || true
mv ALIGNMENT*.md docs/guides/ 2>/dev/null || true
mv BUILD*.md docs/guides/ 2>/dev/null || true
mv NODE_22*.md docs/guides/ 2>/dev/null || true
mv PATH_FIX*.md docs/guides/ 2>/dev/null || true
mv EXCLUDE*.md docs/guides/ 2>/dev/null || true
mv TSCONFIG*.md docs/guides/ 2>/dev/null || true
mv TESTING*.md docs/guides/ 2>/dev/null || true
mv SWITCH_TO*.md docs/guides/ 2>/dev/null || true
mv MOVE_REFERENCE*.md docs/guides/ 2>/dev/null || true
mv DOCUMENSO*.md docs/guides/ 2>/dev/null || true
mv GIT_MERGE*.md docs/guides/ 2>/dev/null || true
mv HEALTH*.md docs/guides/ 2>/dev/null || true
mv BAD_GATEWAY*.md docs/guides/ 2>/dev/null || true
mv FORCE*.md docs/guides/ 2>/dev/null || true
mv FINAL*.md docs/guides/ 2>/dev/null || true
mv ALL_*.md docs/guides/ 2>/dev/null || true
mv SIGNING_FIX*.md docs/guides/ 2>/dev/null || true
mv VERCEL_SIGNING*.md docs/guides/ 2>/dev/null || true
mv EMAIL_EVENTS*.md docs/guides/ 2>/dev/null || true
mv QR_CODE*.md docs/guides/ 2>/dev/null || true
mv VARIABLE_NAME*.md docs/guides/ 2>/dev/null || true
mv LICENSING*.md docs/guides/ 2>/dev/null || true
mv PACKAGE*.md docs/guides/ 2>/dev/null || true
mv CUSTOM_PACKAGE*.md docs/guides/ 2>/dev/null || true
mv MIGRATION*.md docs/guides/ 2>/dev/null || true
mv CONFLICT*.md docs/guides/ 2>/dev/null || true
mv OPERATIONAL*.md docs/guides/ 2>/dev/null || true
mv NEON_SETUP*.md docs/guides/ 2>/dev/null || true
mv STANDARDIZATION*.md docs/guides/ 2>/dev/null || true
mv CLEAN_ROOM*.md docs/guides/ 2>/dev/null || true
mv ARCHITECTURAL*.md docs/guides/ 2>/dev/null || true
mv MANIFEST.md docs/guides/ 2>/dev/null || true
mv AGENTS.md docs/guides/ 2>/dev/null || true
mv SIGNING.md docs/guides/ 2>/dev/null || true
mv DEVELOPMENT.md docs/guides/ 2>/dev/null || true
mv CONTRIBUTING.md docs/guides/ 2>/dev/null || true
mv CODE_STYLE.md docs/guides/ 2>/dev/null || true
mv CODE_OF_CONDUCT.md docs/guides/ 2>/dev/null || true
mv CLA.md docs/guides/ 2>/dev/null || true
mv REMIX*.md docs/guides/ 2>/dev/null || true
mv SIGNATURE_FIELD*.md docs/guides/ 2>/dev/null || true
mv DEMO*.md docs/guides/ 2>/dev/null || true

# Move remaining .md files to guides
echo "Moving remaining documentation..."
mv *.md docs/guides/ 2>/dev/null || true

# Count results
echo ""
echo "✅ Organization complete!"
echo ""
echo "📊 Results:"
echo "  Database:        $(find docs/database -name "*.md" 2>/dev/null | wc -l) files"
echo "  Deployment:      $(find docs/deployment -name "*.md" 2>/dev/null | wc -l) files"
echo "  Docker:          $(find docs/docker -name "*.md" 2>/dev/null | wc -l) files"
echo "  Environment:     $(find docs/environment -name "*.md" 2>/dev/null | wc -l) files"
echo "  Fixes:           $(find docs/fixes -name "*.md" 2>/dev/null | wc -l) files"
echo "  Guides:          $(find docs/guides -name "*.md" 2>/dev/null | wc -l) files"
echo "  Troubleshooting: $(find docs/troubleshooting -name "*.md" 2>/dev/null | wc -l) files"
echo ""
echo "📁 All documentation is now in: docs/"

