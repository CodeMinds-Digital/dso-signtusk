#!/bin/bash

# Organize all root .md files into docs/ folder by category
# This script moves documentation files to appropriate subdirectories

set -e

echo "=================================================="
echo "Documentation Organization Script"
echo "=================================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create backup
BACKUP_DIR="docs_backup_$(date +%Y%m%d_%H%M%S)"
echo -e "${BLUE}Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"
find . -maxdepth 1 -name "*.md" -type f -exec cp {} "$BACKUP_DIR/" \;
echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
echo ""

# Ensure all docs subdirectories exist
echo -e "${BLUE}Creating docs subdirectories...${NC}"
mkdir -p docs/fonts
mkdir -p docs/deployment
mkdir -p docs/docker
mkdir -p docs/fixes
mkdir -p docs/troubleshooting
mkdir -p docs/database
mkdir -p docs/guides
mkdir -p docs/environment
mkdir -p docs/certificates
mkdir -p docs/native-modules
mkdir -p docs/email
mkdir -p docs/pdf
mkdir -p docs/assets
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Counter
MOVED=0

echo -e "${BLUE}Organizing documentation files...${NC}"
echo ""

# FONTS CATEGORY
echo -e "${YELLOW}[FONTS]${NC}"
for file in \
    FONT_ALTERNATIVES_GUIDE.md \
    FONT_REPLACEMENT_MAPPING.md \
    FONT_REPLACEMENT_COMPLETE_SUMMARY.md \
    FINAL_FONT_MAPPING_COMPLETE.md \
    COMPLETE_FONT_REPLACEMENT_GUIDE.md \
    PROFESSIONAL_FONT_ALTERNATIVES.md \
    FONTS_FIX_FINAL.md \
    FONTS_LOCATION_FIX.md \
    FONT_FILES_FIX.md \
    FONT_FIX_DEPLOYMENT.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/fonts/
        echo "  ✓ $file → docs/fonts/"
        ((MOVED++))
    fi
done
echo ""

# DEPLOYMENT CATEGORY
echo -e "${YELLOW}[DEPLOYMENT]${NC}"
for file in \
    DEPLOYMENT_CHECKLIST.md \
    DEPLOYMENT_READY.md \
    DEPLOYMENT_VERIFICATION_CHECKLIST.md \
    DEPLOY_ALL_FIXES.md \
    DEPLOY_CERTIFICATE_FIX.md \
    DEPLOY_FIXED_BUILD.md \
    DEPLOY_FIXES_NOW.md \
    DEPLOY_NATIVE_MODULE_FIX.md \
    DEPLOY_NOW.md \
    DEPLOY_RESEND_FIX_NOW.md \
    DEPLOY_WITH_NATIVE_MODULE_BUILD.md \
    DEPLOY_WITH_NATIVE_MODULE_FIX.md \
    FINAL_DEPLOYMENT_GUIDE.md \
    QUICK_START_DEPLOY_NOW.md \
    READY_TO_DEPLOY.md \
    READY_TO_DEPLOY_CERTIFICATE_FIX.md \
    READY_TO_DEPLOY_NOW.md \
    DOKPLOY_CLEAR_CACHE_GUIDE.md \
    FORCE_REBUILD_DOKPLOY.md \
    HOW_TO_CLEAR_CACHE_DOKPLOY.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/deployment/
        echo "  ✓ $file → docs/deployment/"
        ((MOVED++))
    fi
done
echo ""

# DOCKER CATEGORY
echo -e "${YELLOW}[DOCKER]${NC}"
for file in \
    ALL_DOCKER_FIXES_SUMMARY.md \
    DOCKERFILE_COMPARISON.md \
    DOCKERFILE_FIX_APPLIED.md \
    DOCKERFILE_RUNTIME_FIX.md \
    DOCKER_BUILD_SHELL_FIX.md \
    DOCKER_BUILD_WARNINGS_FIXED.md \
    CACHE_BUILD_FIX.md \
    PYTHON_BUILD_FIX.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/docker/
        echo "  ✓ $file → docs/docker/"
        ((MOVED++))
    fi
done
echo ""

# FIXES CATEGORY
echo -e "${YELLOW}[FIXES]${NC}"
for file in \
    ALL_FIXES_COMPLETE.md \
    COMPLETE_DIAGNOSIS_AND_FIX.md \
    COMPLETE_FIX_DEPLOYMENT.md \
    COMPLETE_FIX_SUMMARY.md \
    CRITICAL_FIX_CREATEELEMENT.md \
    CRITICAL_ISSUE_FOUND.md \
    FINAL_COMPLETE_FIX.md \
    FINAL_FIX_COMMIT_NOW.md \
    FINAL_ROOT_CAUSE_AND_FIX.md \
    FIXES_APPLIED.md \
    ISSUE_RESOLVED.md \
    PATH_FIX_APPLIED.md \
    TYPESCRIPT_PATH_FIX.md \
    DOCUMENT_COMPLETION_FIX.md \
    DOCUMENT_DELETE_FIX.md \
    PROCESSING_STATE_ISSUE.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/fixes/
        echo "  ✓ $file → docs/fixes/"
        ((MOVED++))
    fi
done
echo ""

# TROUBLESHOOTING CATEGORY
echo -e "${YELLOW}[TROUBLESHOOTING]${NC}"
for file in \
    BACKGROUND_JOB_NOT_RUNNING.md \
    ROOT_CAUSE_ANALYSIS.md \
    HONEST_ASSESSMENT.md \
    VISUAL_STATUS_SUMMARY.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/troubleshooting/
        echo "  ✓ $file → docs/troubleshooting/"
        ((MOVED++))
    fi
done
echo ""

# CERTIFICATES CATEGORY
echo -e "${YELLOW}[CERTIFICATES]${NC}"
for file in \
    CERTIFICATE_ISSUE_FIX.md \
    CERTIFICATE_OPTIONS.md \
    CERTIFICATE_SETUP_GUIDE.md \
    FINAL_CERTIFICATE_SOLUTION.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/certificates/
        echo "  ✓ $file → docs/certificates/"
        ((MOVED++))
    fi
done
echo ""

# NATIVE MODULES CATEGORY
echo -e "${YELLOW}[NATIVE MODULES]${NC}"
for file in \
    NATIVE_MODULE_BUILD_EXPLAINED.md \
    NATIVE_MODULE_BUILD_FIX.md \
    NATIVE_MODULE_FIX_COMPLETE.md \
    NATIVE_MODULE_FIX_SUMMARY.md \
    NATIVE_MODULE_PLATFORM_FIX.md \
    SIMPLE_NATIVE_MODULE_FIX.md \
    RUST_TARGET_EXPLANATION.md \
    REBRANDING_PDF_SIGN_COMPLETE.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/native-modules/
        echo "  ✓ $file → docs/native-modules/"
        ((MOVED++))
    fi
done
echo ""

# EMAIL/RESEND CATEGORY
echo -e "${YELLOW}[EMAIL]${NC}"
for file in \
    COMPLETE_RESEND_FIX_GUIDE.md \
    REACT_EMAIL_RENDER_FIX.md \
    README_RESEND_FIX.md \
    RESEND_DOCUMENT_FIX.md \
    RESEND_ERROR_DIAGNOSIS.md \
    RESEND_ISSUE_SOLUTION.md \
    FINAL_RESEND_FIX.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/email/
        echo "  ✓ $file → docs/email/"
        ((MOVED++))
    fi
done
echo ""

# DATABASE CATEGORY
echo -e "${YELLOW}[DATABASE]${NC}"
for file in \
    PRISMA_DEPENDENCY_FIX.md \
    PRISMA_QUICK_REFERENCE.md \
    PRISMA_SETUP_COMPLETE.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/database/
        echo "  ✓ $file → docs/database/"
        ((MOVED++))
    fi
done
echo ""

# PDF CATEGORY
echo -e "${YELLOW}[PDF]${NC}"
for file in \
    PDF_PROCESSING_COMPARISON.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/pdf/
        echo "  ✓ $file → docs/pdf/"
        ((MOVED++))
    fi
done
echo ""

# ASSETS CATEGORY
echo -e "${YELLOW}[ASSETS]${NC}"
for file in \
    SIGNTUSK_ASSETS_INVENTORY.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/assets/
        echo "  ✓ $file → docs/assets/"
        ((MOVED++))
    fi
done
echo ""

# GUIDES CATEGORY
echo -e "${YELLOW}[GUIDES]${NC}"
for file in \
    ACTION_CHECKLIST.md \
    ACTION_REQUIRED_NOW.md \
    CURRENT_STATUS_AND_NEXT_STEPS.md \
    EXECUTIVE_SUMMARY.md \
    FINAL_ACTION_PLAN.md \
    DOCUMENTATION.md \
    DOCS_GITIGNORE_UPDATED.md \
    DOCS_ORGANIZATION_COMPLETE.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/guides/
        echo "  ✓ $file → docs/guides/"
        ((MOVED++))
    fi
done
echo ""

echo "=================================================="
echo -e "${GREEN}Documentation Organization Complete!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "--------"
echo "✓ Moved $MOVED files"
echo "✓ Backup created at: $BACKUP_DIR"
echo ""
echo "Documentation Structure:"
echo "------------------------"
echo "docs/"
echo "  ├── fonts/           (Font replacement guides)"
echo "  ├── deployment/      (Deployment & Dokploy guides)"
echo "  ├── docker/          (Docker & build fixes)"
echo "  ├── fixes/           (Bug fixes & solutions)"
echo "  ├── troubleshooting/ (Debugging & diagnostics)"
echo "  ├── certificates/    (SSL/TLS certificate setup)"
echo "  ├── native-modules/  (Native module builds)"
echo "  ├── email/           (Email & Resend fixes)"
echo "  ├── database/        (Prisma & database setup)"
echo "  ├── pdf/             (PDF processing)"
echo "  ├── assets/          (Asset management)"
echo "  └── guides/          (General guides & checklists)"
echo ""
echo "To view organized docs:"
echo "  ls -la docs/*/"
echo ""
echo "To rollback:"
echo "  cp $BACKUP_DIR/*.md ."
echo ""
echo -e "${GREEN}Done!${NC}"
