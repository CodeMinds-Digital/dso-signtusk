#!/bin/bash

# Nixpacks Build Test Script
# Tests your Nixpacks configuration locally before deploying to Dokploy

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="signtusk-test"
CONTAINER_NAME="signtusk-test"
PORT=3000

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Nixpacks Build Test for Signtusk              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print step
print_step() {
  echo -e "${BLUE}▶ $1${NC}"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Nixpacks is installed
print_step "Step 1: Checking Nixpacks installation..."
if command -v nixpacks &> /dev/null; then
  NIXPACKS_VERSION=$(nixpacks --version)
  print_success "Nixpacks is installed: $NIXPACKS_VERSION"
else
  print_error "Nixpacks is not installed!"
  echo ""
  echo "Install Nixpacks using one of these methods:"
  echo "  1. npm install -g nixpacks"
  echo "  2. brew install nixpacks (macOS)"
  echo "  3. curl -sSL https://nixpacks.com/install.sh | bash"
  echo ""
  exit 1
fi

# Check if Docker is running
print_step "Step 2: Checking Docker..."
if docker info &> /dev/null; then
  print_success "Docker is running"
else
  print_error "Docker is not running!"
  echo "Please start Docker Desktop and try again."
  exit 1
fi

# Check if nixpacks.toml exists
print_step "Step 3: Checking configuration files..."
if [ -f "nixpacks.toml" ]; then
  print_success "nixpacks.toml found"
else
  print_error "nixpacks.toml not found!"
  exit 1
fi

# Check if .env.local exists
if [ -f ".env.local" ]; then
  print_success ".env.local found"
else
  print_warning ".env.local not found - will use .env if available"
fi

# Generate build plan
print_step "Step 4: Generating build plan..."
if nixpacks plan . > nixpacks-plan.json 2>&1; then
  print_success "Build plan generated successfully"
  echo ""
  echo "Build plan preview:"
  cat nixpacks-plan.json | head -20
  echo ""
else
  print_error "Failed to generate build plan"
  cat nixpacks-plan.json
  exit 1
fi

# Clean up old containers and images
print_step "Step 5: Cleaning up old test containers..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true
print_success "Cleanup complete"

# Build with Nixpacks
print_step "Step 6: Building Docker image with Nixpacks..."
echo "This may take 10-15 minutes on first build..."
echo ""

if nixpacks build . --name $IMAGE_NAME; then
  print_success "Build completed successfully!"
else
  print_error "Build failed!"
  exit 1
fi

# Check image size
print_step "Step 7: Checking image details..."
docker images $IMAGE_NAME
echo ""

# Check file structure
print_step "Step 8: Verifying file structure..."

echo -n "Checking apps/remix/build/... "
if docker run --rm $IMAGE_NAME ls apps/remix/build/ &> /dev/null; then
  print_success "Found"
else
  print_error "Missing"
fi

echo -n "Checking apps/remix/public/... "
if docker run --rm $IMAGE_NAME ls apps/remix/public/ &> /dev/null; then
  print_success "Found"
  echo "Public folder contents:"
  docker run --rm $IMAGE_NAME ls -la apps/remix/public/
else
  print_error "Missing - THIS IS THE CRITICAL ISSUE!"
  exit 1
fi

echo -n "Checking node_modules/... "
if docker run --rm $IMAGE_NAME ls node_modules/ &> /dev/null; then
  print_success "Found"
else
  print_error "Missing"
fi

# Test native dependencies
print_step "Step 9: Testing native dependencies..."

echo -n "Testing @napi-rs/canvas... "
if docker run --rm $IMAGE_NAME node -e "require('@napi-rs/canvas')" &> /dev/null; then
  print_success "OK"
else
  print_warning "Failed (may need enhanced config)"
fi

echo -n "Testing sharp... "
if docker run --rm $IMAGE_NAME node -e "require('sharp')" &> /dev/null; then
  print_success "OK"
else
  print_warning "Failed (may need enhanced config)"
fi

echo -n "Testing bcryptjs... "
if docker run --rm $IMAGE_NAME node -e "require('bcryptjs')" &> /dev/null; then
  print_success "OK"
else
  print_error "Failed"
fi

# Start container
print_step "Step 10: Starting container..."

# Determine which env file to use
ENV_FILE=""
if [ -f ".env.local" ]; then
  ENV_FILE=".env.local"
elif [ -f ".env" ]; then
  ENV_FILE=".env"
else
  print_warning "No .env file found - starting without environment variables"
fi

if [ -n "$ENV_FILE" ]; then
  docker run -d -p $PORT:3000 \
    --env-file $ENV_FILE \
    --name $CONTAINER_NAME \
    $IMAGE_NAME
else
  docker run -d -p $PORT:3000 \
    --name $CONTAINER_NAME \
    $IMAGE_NAME
fi

print_success "Container started"

# Wait for application to start
print_step "Step 11: Waiting for application to start..."
echo "Waiting 15 seconds for startup..."
sleep 15

# Test endpoints
print_step "Step 12: Testing endpoints..."

echo -n "Testing health endpoint... "
if curl -s -f http://localhost:$PORT/health > /dev/null 2>&1; then
  HEALTH_RESPONSE=$(curl -s http://localhost:$PORT/health)
  print_success "OK - Response: $HEALTH_RESPONSE"
else
  print_error "Failed"
fi

echo -n "Testing homepage... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
  print_success "OK - HTTP $HTTP_CODE"
else
  print_warning "HTTP $HTTP_CODE"
fi

echo -n "Testing favicon (CRITICAL TEST)... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/favicon.ico)
if [ "$HTTP_CODE" = "200" ]; then
  print_success "OK - HTTP $HTTP_CODE (Public folder works!)"
else
  print_error "Failed - HTTP $HTTP_CODE (Public folder issue!)"
fi

# Show logs
print_step "Step 13: Container logs (last 30 lines)..."
echo ""
docker logs --tail 30 $CONTAINER_NAME
echo ""

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Summary                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Container is running at: http://localhost:$PORT"
echo ""
echo "Useful commands:"
echo "  View logs:        docker logs -f $CONTAINER_NAME"
echo "  Stop container:   docker stop $CONTAINER_NAME"
echo "  Remove container: docker rm $CONTAINER_NAME"
echo "  Remove image:     docker rmi $IMAGE_NAME"
echo ""
echo "To keep the container running, press Ctrl+C now."
echo "Otherwise, it will be stopped and removed in 30 seconds..."
echo ""

# Wait for user input or timeout
read -t 30 -p "Press Enter to stop and cleanup, or Ctrl+C to keep running..." || true

# Cleanup
print_step "Cleaning up..."
docker stop $CONTAINER_NAME
docker rm $CONTAINER_NAME
print_success "Cleanup complete"

echo ""
echo -e "${GREEN}✅ Test complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. If all tests passed, you're ready to deploy to Dokploy"
echo "  2. If native deps failed, try: cp nixpacks-enhanced.toml nixpacks.toml"
echo "  3. If favicon failed, check apps/remix/public/ folder"
echo ""
