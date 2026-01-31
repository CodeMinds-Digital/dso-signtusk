#!/bin/bash

# Email Fix COMPLETE Deployment Script
# This script builds and deploys the email fix for ALL email templates (Phases 1, 2, and 3)

set -e  # Exit on error

echo "========================================="
echo "Email Fix COMPLETE Deployment"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project root directory confirmed${NC}"
echo ""

# Step 2: Show what will be deployed
echo "========================================="
echo "What's Being Deployed:"
echo "========================================="
echo "✅ 10 Simple Email Templates (no React hooks)"
echo "✅ 9 Updated Email Handlers"
echo "✅ 11 Translation Helper Functions"
echo ""
echo "Email Types Fixed (ALL PHASES):"
echo ""
echo "Phase 1 - Document & Organisation Emails:"
echo "  • Document Invite"
echo "  • Document Completed"
echo "  • Document Rejected"
echo "  • Document Rejection Confirmed"
echo "  • Document Cancelled"
echo "  • Recipient Signed"
echo "  • Organisation Member Joined"
echo "  • Organisation Member Left"
echo "  • Confirmation Email (already worked)"
echo ""
echo "Phase 2 - Authentication & Team Emails:"
echo "  • Password Reset Success"
echo "  • Team Deleted"
echo ""
echo "Total: 11 Email Types (100% Complete)"
echo ""

# Step 3: Confirm deployment
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Step 4: Clean and build
echo ""
echo "========================================="
echo "Step 1: Building Application"
echo "========================================="
echo ""

echo "Cleaning previous build..."
rm -rf apps/remix/build apps/web/.next .turbo/cache

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 5: Build Docker image
echo ""
echo "========================================="
echo "Step 2: Building Docker Image"
echo "========================================="
echo ""

echo "Building Docker image (this may take a few minutes)..."
docker build --no-cache -t signtusk:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

# Step 6: Stop existing containers
echo ""
echo "========================================="
echo "Step 3: Stopping Existing Containers"
echo "========================================="
echo ""

docker-compose down

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers stopped${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Could not stop containers (they may not be running)${NC}"
fi

# Step 7: Start new containers
echo ""
echo "========================================="
echo "Step 4: Starting New Containers"
echo "========================================="
echo ""

docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers started successfully${NC}"
else
    echo -e "${RED}✗ Failed to start containers${NC}"
    exit 1
fi

# Step 8: Wait for application to start
echo ""
echo "Waiting for application to start..."
sleep 10

# Step 9: Check if application is running
echo ""
echo "========================================="
echo "Step 5: Verifying Deployment"
echo "========================================="
echo ""

# Check if containers are running
RUNNING=$(docker-compose ps | grep "Up" | wc -l)
if [ $RUNNING -gt 0 ]; then
    echo -e "${GREEN}✓ Containers are running${NC}"
else
    echo -e "${RED}✗ Containers are not running${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
fi

# Step 10: Show logs
echo ""
echo "========================================="
echo "Recent Logs:"
echo "========================================="
docker-compose logs --tail=20

# Step 11: Success message
echo ""
echo "========================================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Test email sending by creating and signing documents"
echo "2. Check logs for any errors: docker-compose logs -f"
echo "3. Monitor for React hooks errors (should be gone!)"
echo ""
echo "Email Types to Test (ALL 11):"
echo ""
echo "Document Emails:"
echo "  • Send document for signing → Invite email"
echo "  • Sign document → Signed notification"
echo "  • Reject document → Rejection emails"
echo "  • Cancel document → Cancellation email"
echo "  • Complete document → Completion email"
echo ""
echo "Organisation Emails:"
echo "  • Add/remove org members → Member notifications"
echo ""
echo "Authentication Emails:"
echo "  • Sign up → Confirmation email"
echo "  • Reset password → Success email"
echo ""
echo "Team Emails:"
echo "  • Delete team → Deletion notification"
echo ""
echo "If you see any errors, check:"
echo "  • docker-compose logs"
echo "  • ALL_PHASES_COMPLETE.md for details"
echo ""
