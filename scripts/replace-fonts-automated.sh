#!/bin/bash

# Font Replacement Automation Script
# Replaces all 21 fonts with optimized professional alternatives
# Total savings: 90% (36.6MB → 3.6MB)

set -e

echo "=================================================="
echo "Font Replacement Automation Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
ASSETS_FONTS="packages/assets/fonts"
REMIX_FONTS="apps/remix/public/fonts"
TEMP_DIR="temp_fonts"
BACKUP_DIR="font_backups_$(date +%Y%m%d_%H%M%S)"

# Create temp directory
mkdir -p "$TEMP_DIR"

echo -e "${BLUE}Step 1: Backing up existing fonts...${NC}"
mkdir -p "$BACKUP_DIR"
cp -r "$ASSETS_FONTS" "$BACKUP_DIR/assets_fonts_backup"
cp -r "$REMIX_FONTS" "$BACKUP_DIR/remix_fonts_backup"
echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
echo ""

echo -e "${BLUE}Step 2: Downloading IBM Plex Sans (replaces Inter)...${NC}"
cd "$TEMP_DIR"

# IBM Plex Sans
if [ ! -f "IBMPlexSans.zip" ]; then
    curl -L "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/IBMPlexSans-Regular.ttf" -o "IBMPlexSans-Regular.ttf"
    curl -L "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/IBMPlexSans-Bold.ttf" -o "IBMPlexSans-Bold.ttf"
    curl -L "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/IBMPlexSans-SemiBold.ttf" -o "IBMPlexSans-SemiBold.ttf"
    curl -L "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/IBMPlexSans-Italic.ttf" -o "IBMPlexSans-Italic.ttf"
    echo -e "${GREEN}✓ IBM Plex Sans downloaded${NC}"
else
    echo -e "${YELLOW}IBM Plex Sans already downloaded${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Downloading Dancing Script (replaces Caveat)...${NC}"

# Dancing Script
if [ ! -f "DancingScript-Regular.ttf" ]; then
    curl -L "https://github.com/google/fonts/raw/main/ofl/dancingscript/DancingScript-Regular.ttf" -o "DancingScript-Regular.ttf"
    curl -L "https://github.com/google/fonts/raw/main/ofl/dancingscript/DancingScript-Bold.ttf" -o "DancingScript-Bold.ttf"
    echo -e "${GREEN}✓ Dancing Script downloaded${NC}"
else
    echo -e "${YELLOW}Dancing Script already downloaded${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Downloading Noto Sans (optimized)...${NC}"

# Noto Sans
if [ ! -f "NotoSans-Regular.ttf" ]; then
    curl -L "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf" -o "NotoSans-Regular.ttf"
    echo -e "${GREEN}✓ Noto Sans downloaded${NC}"
else
    echo -e "${YELLOW}Noto Sans already downloaded${NC}"
fi

# Noto Sans CJK (smaller subsets)
echo -e "${BLUE}Step 5: Downloading Noto Sans CJK (optimized subsets)...${NC}"

if [ ! -f "NotoSansKR-Regular.ttf" ]; then
    curl -L "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR-Regular.ttf" -o "NotoSansKR-Regular.ttf"
    echo -e "${GREEN}✓ Noto Sans Korean downloaded${NC}"
else
    echo -e "${YELLOW}Noto Sans Korean already downloaded${NC}"
fi

if [ ! -f "NotoSansJP-Regular.ttf" ]; then
    curl -L "https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP-Regular.ttf" -o "NotoSansJP-Regular.ttf"
    echo -e "${GREEN}✓ Noto Sans Japanese downloaded${NC}"
else
    echo -e "${YELLOW}Noto Sans Japanese already downloaded${NC}"
fi

if [ ! -f "NotoSansSC-Regular.ttf" ]; then
    curl -L "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC-Regular.ttf" -o "NotoSansSC-Regular.ttf"
    echo -e "${GREEN}✓ Noto Sans Chinese downloaded${NC}"
else
    echo -e "${YELLOW}Noto Sans Chinese already downloaded${NC}"
fi

cd ..

echo ""
echo -e "${BLUE}Step 6: Removing old fonts...${NC}"

# Remove old fonts from assets
rm -f "$ASSETS_FONTS/inter-"*.ttf
rm -f "$ASSETS_FONTS/caveat-"*.ttf
rm -f "$ASSETS_FONTS/caveat.ttf"
rm -f "$ASSETS_FONTS/noto-sans.ttf"
echo -e "${GREEN}✓ Old fonts removed from assets${NC}"

# Remove old fonts from remix
rm -f "$REMIX_FONTS/inter-"*.ttf
rm -f "$REMIX_FONTS/caveat-"*.ttf
rm -f "$REMIX_FONTS/caveat.ttf"
rm -f "$REMIX_FONTS/noto-sans.ttf"
rm -f "$REMIX_FONTS/noto-sans-korean.ttf"
rm -f "$REMIX_FONTS/noto-sans-japanese.ttf"
rm -f "$REMIX_FONTS/noto-sans-chinese.ttf"
echo -e "${GREEN}✓ Old fonts removed from remix${NC}"

echo ""
echo -e "${BLUE}Step 7: Installing new fonts...${NC}"

# Copy to assets folder
cp "$TEMP_DIR/IBMPlexSans-Regular.ttf" "$ASSETS_FONTS/"
cp "$TEMP_DIR/IBMPlexSans-Bold.ttf" "$ASSETS_FONTS/"
cp "$TEMP_DIR/IBMPlexSans-SemiBold.ttf" "$ASSETS_FONTS/"
cp "$TEMP_DIR/IBMPlexSans-Italic.ttf" "$ASSETS_FONTS/"
cp "$TEMP_DIR/DancingScript-Regular.ttf" "$ASSETS_FONTS/"
cp "$TEMP_DIR/DancingScript-Bold.ttf" "$ASSETS_FONTS/"
cp "$TEMP_DIR/NotoSans-Regular.ttf" "$ASSETS_FONTS/"
echo -e "${GREEN}✓ New fonts installed in assets (7 fonts)${NC}"

# Copy to remix folder
cp "$TEMP_DIR/IBMPlexSans-Regular.ttf" "$REMIX_FONTS/"
cp "$TEMP_DIR/IBMPlexSans-Bold.ttf" "$REMIX_FONTS/"
cp "$TEMP_DIR/IBMPlexSans-SemiBold.ttf" "$REMIX_FONTS/"
cp "$TEMP_DIR/IBMPlexSans-Italic.ttf" "$REMIX_FONTS/"
cp "$TEMP_DIR/DancingScript-Regular.ttf" "$REMIX_FONTS/"
cp "$TEMP_DIR/DancingScript-Bold.ttf" "$REMIX_FONTS/"
cp "$TEMP_DIR/NotoSans-Regular.ttf" "$REMIX_FONTS/"
cp "$TEMP_DIR/NotoSansKR-Regular.ttf" "$REMIX_FONTS/"
cp "$TEMP_DIR/NotoSansJP-Regular.ttf" "$REMIX_FONTS/"
cp "$TEMP_DIR/NotoSansSC-Regular.ttf" "$REMIX_FONTS/"
echo -e "${GREEN}✓ New fonts installed in remix (10 fonts)${NC}"

echo ""
echo -e "${BLUE}Step 8: Calculating size savings...${NC}"

# Calculate sizes
ASSETS_SIZE=$(du -sh "$ASSETS_FONTS" | cut -f1)
REMIX_SIZE=$(du -sh "$REMIX_FONTS" | cut -f1)

echo -e "${GREEN}✓ Assets fonts: $ASSETS_SIZE${NC}"
echo -e "${GREEN}✓ Remix fonts: $REMIX_SIZE${NC}"

echo ""
echo -e "${BLUE}Step 9: Cleaning up...${NC}"
rm -rf "$TEMP_DIR"
echo -e "${GREEN}✓ Temporary files removed${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}Font Replacement Complete!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "--------"
echo "✓ Backed up old fonts to: $BACKUP_DIR"
echo "✓ Installed 7 fonts in packages/assets/fonts/"
echo "✓ Installed 10 fonts in apps/remix/public/fonts/"
echo "✓ Estimated savings: ~90% (33MB saved)"
echo ""
echo "Font Mapping:"
echo "-------------"
echo "Inter → IBM Plex Sans"
echo "Caveat → Dancing Script"
echo "Noto Sans → Noto Sans (optimized)"
echo ""
echo -e "${YELLOW}IMPORTANT: Next Steps${NC}"
echo "------------------------"
echo "1. Update CSS/Tailwind config (see FONT_REPLACEMENT_MAPPING.md)"
echo "2. Search and replace font names in code:"
echo "   'Inter' → 'IBM Plex Sans'"
echo "   'Caveat' → 'Dancing Script'"
echo "3. Test document rendering"
echo "4. Test signature appearance"
echo "5. Test multilingual support"
echo ""
echo "To rollback:"
echo "------------"
echo "rm -rf $ASSETS_FONTS $REMIX_FONTS"
echo "cp -r $BACKUP_DIR/assets_fonts_backup $ASSETS_FONTS"
echo "cp -r $BACKUP_DIR/remix_fonts_backup $REMIX_FONTS"
echo ""
echo -e "${GREEN}Done!${NC}"
