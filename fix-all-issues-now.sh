#!/bin/bash

# Complete Fix Script for All Issues
# This script will:
# 1. Stop the application
# 2. Clean build artifacts
# 3. Rebuild everything
# 4. Rebuild Docker image
# 5. Start the application
# 6. Show logs

set -e  # Exit on error

echo "🔧 Starting Complete Fix Procedure..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop application
echo -e "${YELLOW}Step 1/6: Stopping application...${NC}"
docker-compose down
echo -e "${GREEN}✅ Application stopped${NC}"
echo ""

# Step 2: Clean build artifacts
echo -e "${YELLOW}Step 2/6: Cleaning build artifacts...${NC}"
rm -rf apps/remix/build
rm -rf apps/web/build 2>/dev/null || true
rm -rf apps/docs/build 2>/dev/null || true
rm -rf .turbo/cache
echo -e "${GREEN}✅ Build artifacts cleaned${NC}"
echo ""

# Step 3: Rebuild application
echo -e "${YELLOW}Step 3/6: Building application (this may take 3-5 minutes)...${NC}"
npm run build
echo -e "${GREEN}✅ Application built successfully${NC}"
echo ""

# Step 4: Verify build output
echo -e "${YELLOW}Step 4/6: Verifying build output...${NC}"
if [ -f "apps/remix/build/server/hono/packages/lib/utils/get-email-translations.js" ]; then
    echo -e "${GREEN}✅ Email translation functions found in build${NC}"
else
    echo -e "${RED}❌ Email translation functions NOT found in build${NC}"
    echo -e "${RED}Build may have failed. Check output above.${NC}"
    exit 1
fi
echo ""

# Step 5: Rebuild Docker image
echo -e "${YELLOW}Step 5/6: Rebuilding Docker image (this may take 5-10 minutes)...${NC}"
docker build --no-cache -t signtusk:latest .
echo -e "${GREEN}✅ Docker image rebuilt${NC}"
echo ""

# Step 6: Start application
echo -e "${YELLOW}Step 6/6: Starting application...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Application started${NC}"
echo ""

# Wait a moment for startup
echo "Waiting 5 seconds for application to start..."
sleep 5
echo ""

# Show logs
echo -e "${GREEN}🎉 Rebuild complete!${NC}"
echo ""
echo "Showing logs (press Ctrl+C to exit)..."
echo "Watch for:"
echo "  ✅ No 'getDocumentCompletedTranslations is not defined' errors"
echo "  ✅ No 'No route matches URL' errors for /assets/, /fonts/, /static/"
echo "  ⚠️  May still see 'Invalid email' errors (needs database fix)"
echo ""
echo "---"
echo ""

docker-compose logs -f --tail=100
