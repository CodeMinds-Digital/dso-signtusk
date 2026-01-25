#!/bin/bash

# Environment Files Cleanup Script
# This script helps organize your .env files correctly

set -e

echo "🔧 Environment Files Cleanup Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup directory
BACKUP_DIR="env-backup-$(date +%Y%m%d-%H%M%S)"

echo "📦 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup all env files
echo "💾 Backing up existing .env files..."
for file in .env .env.local .env.dokploy apps/remix/.env apps/remix/.env.local; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/"
    echo "  ✓ Backed up: $file"
  fi
done

echo ""
echo "🔍 Analyzing current configuration..."
echo ""

# Check which files exist
echo "Current .env files:"
for file in .env .env.local .env.dokploy apps/remix/.env apps/remix/.env.local; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file (exists)"
  else
    echo -e "  ${RED}✗${NC} $file (missing)"
  fi
done

echo ""
echo "📋 Recommended Actions:"
echo ""

# Action 1: Remove apps/remix/.env files
if [ -f "apps/remix/.env" ] || [ -f "apps/remix/.env.local" ]; then
  echo -e "${YELLOW}1. Remove unused apps/remix/.env files${NC}"
  echo "   These files are NOT loaded by the application."
  echo "   The app loads from root .env and .env.local instead."
  echo ""
  read -p "   Remove apps/remix/.env files? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    [ -f "apps/remix/.env" ] && rm "apps/remix/.env" && echo "   ✓ Removed apps/remix/.env"
    [ -f "apps/remix/.env.local" ] && rm "apps/remix/.env.local" && echo "   ✓ Removed apps/remix/.env.local"
  fi
  echo ""
fi

# Action 2: Rename .env.dokploy to template
if [ -f ".env.dokploy" ]; then
  echo -e "${YELLOW}2. Rename .env.dokploy to .env.dokploy.template${NC}"
  echo "   This makes it clear it's a reference file, not actively loaded."
  echo ""
  read -p "   Rename .env.dokploy? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    mv .env.dokploy .env.dokploy.template
    # Add header comment
    echo "# DOKPLOY DEPLOYMENT TEMPLATE" > .env.dokploy.template.tmp
    echo "# Copy these values to Dokploy Dashboard Environment Variables" >> .env.dokploy.template.tmp
    echo "# This file is NOT automatically loaded by the application" >> .env.dokploy.template.tmp
    echo "" >> .env.dokploy.template.tmp
    cat .env.dokploy.template >> .env.dokploy.template.tmp
    mv .env.dokploy.template.tmp .env.dokploy.template
    echo "   ✓ Renamed to .env.dokploy.template with header"
  fi
  echo ""
fi

# Action 3: Verify .gitignore
echo -e "${YELLOW}3. Verify .gitignore excludes sensitive files${NC}"
if ! grep -q "^\.env\.local$" .gitignore 2>/dev/null; then
  echo "   ⚠️  .env.local is NOT in .gitignore!"
  read -p "   Add .env.local to .gitignore? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ".env.local" >> .gitignore
    echo "   ✓ Added .env.local to .gitignore"
  fi
else
  echo "   ✓ .env.local is in .gitignore"
fi

if ! grep -q "^\.env\.dokploy$" .gitignore 2>/dev/null; then
  echo "   ⚠️  .env.dokploy is NOT in .gitignore!"
  read -p "   Add .env.dokploy to .gitignore? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ".env.dokploy" >> .gitignore
    echo "   ✓ Added .env.dokploy to .gitignore"
  fi
else
  echo "   ✓ .env.dokploy is in .gitignore"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Verify your .env files:"
echo "   - .env          → Local development (safe database)"
echo "   - .env.local    → Production testing (production database)"
echo ""
echo "2. Update deployment platforms:"
echo "   - Vercel: Copy variables from .env.local to Vercel Dashboard"
echo "   - Dokploy: Copy variables from .env.dokploy.template to Dokploy Dashboard"
echo ""
echo "3. Test your setup:"
echo "   npm run dev     → Should use .env + .env.local"
echo ""
echo "4. Backup location:"
echo "   $BACKUP_DIR/"
echo ""
echo "📖 For detailed analysis, see: ENV_FILE_USAGE_ANALYSIS.md"
