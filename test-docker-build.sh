#!/bin/bash

# Test Docker Build Script
# This script tests the production Dockerfile locally before deploying to Dokploy

set -e

echo "🚀 Testing Production Docker Build"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    echo "Creating from .env.production.example..."
    cp .env.production.example .env.production
    echo -e "${YELLOW}⚠️  Please edit .env.production with your actual values${NC}"
    echo ""
fi

# Ask user if they want to continue
read -p "Do you want to continue with the build? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Build cancelled."
    exit 0
fi

echo ""
echo "📦 Building Docker image..."
echo "This may take 5-10 minutes on first build..."
echo ""

# Build the image
docker build -f Dockerfile.production -t signtusk-remix:test .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo ""
    echo "🎉 Your Docker image is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Test locally with: docker-compose -f docker-compose.production.yml up"
    echo "2. Or deploy to Dokploy using Dockerfile.production"
    echo ""
    echo "To run the container manually:"
    echo "  docker run -p 3000:3000 --env-file .env.production signtusk-remix:test"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Build failed!${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Out of memory - increase Docker memory limit"
    echo "2. Network issues - check internet connection"
    echo "3. Missing dependencies - ensure all files are present"
    echo ""
    exit 1
fi
