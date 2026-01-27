#!/bin/bash

# Update Font References in Code
# Replaces all Inter/Caveat references with new fonts

set -e

echo "=================================================="
echo "Font Reference Update Script"
echo "=================================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Searching for font references...${NC}"
echo ""

# Find all files with font references
echo -e "${YELLOW}Files containing 'Inter' font:${NC}"
grep -r "font.*Inter" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.css" --include="*.scss" . | grep -v node_modules | grep -v ".git" | cut -d: -f1 | sort -u

echo ""
echo -e "${YELLOW}Files containing 'Caveat' font:${NC}"
grep -r "font.*Caveat" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.css" --include="*.scss" . | grep -v node_modules | grep -v ".git" | cut -d: -f1 | sort -u

echo ""
echo -e "${BLUE}Creating backup before replacement...${NC}"
BACKUP_DIR="code_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup key files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec cp --parents {} "$BACKUP_DIR" \;

echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
echo ""

echo -e "${BLUE}Replacing font references...${NC}"

# Replace Inter with IBM Plex Sans
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec sed -i.bak "s/'Inter'/'IBM Plex Sans'/g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec sed -i.bak 's/"Inter"/"IBM Plex Sans"/g' {} \;

echo -e "${GREEN}✓ Replaced 'Inter' with 'IBM Plex Sans'${NC}"

# Replace Caveat with Dancing Script
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec sed -i.bak "s/'Caveat'/'Dancing Script'/g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec sed -i.bak 's/"Caveat"/"Dancing Script"/g' {} \;

echo -e "${GREEN}✓ Replaced 'Caveat' with 'Dancing Script'${NC}"

# Replace font file references
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec sed -i.bak 's/inter-regular\.ttf/IBMPlexSans-Regular.ttf/g' {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec sed -i.bak 's/inter-bold\.ttf/IBMPlexSans-Bold.ttf/g' {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec sed -i.bak 's/inter-semibold\.ttf/IBMPlexSans-SemiBold.ttf/g' {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec sed -i.bak 's/caveat-regular\.ttf/DancingScript-Regular.ttf/g' {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  -exec sed -i.bak 's/caveat\.ttf/DancingScript-Bold.ttf/g' {} \;

echo -e "${GREEN}✓ Replaced font file references${NC}"

# Clean up .bak files
find . -name "*.bak" -type f -delete
echo -e "${GREEN}✓ Cleaned up backup files${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}Font References Updated!${NC}"
echo "=================================================="
echo ""
echo "Changes made:"
echo "-------------"
echo "✓ 'Inter' → 'IBM Plex Sans'"
echo "✓ 'Caveat' → 'Dancing Script'"
echo "✓ inter-regular.ttf → IBMPlexSans-Regular.ttf"
echo "✓ inter-bold.ttf → IBMPlexSans-Bold.ttf"
echo "✓ inter-semibold.ttf → IBMPlexSans-SemiBold.ttf"
echo "✓ caveat-regular.ttf → DancingScript-Regular.ttf"
echo "✓ caveat.ttf → DancingScript-Bold.ttf"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review changes with: git diff"
echo "2. Test the application"
echo "3. Check for any missed references"
echo ""
echo "To rollback:"
echo "------------"
echo "git checkout ."
echo "# Or restore from: $BACKUP_DIR"
echo ""
echo -e "${GREEN}Done!${NC}"
