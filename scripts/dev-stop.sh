#!/bin/bash

# Development Environment Stop Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
CLEAN=${1:-"false"}
VOLUMES=${2:-"false"}

show_help() {
    echo "Usage: $0 [CLEAN] [VOLUMES]"
    echo ""
    echo "Options:"
    echo "  CLEAN:"
    echo "    false  - Stop services only (default)"
    echo "    true   - Stop services and remove containers"
    echo ""
    echo "  VOLUMES:"
    echo "    false  - Keep data volumes (default)"
    echo "    true   - Remove data volumes (WARNING: This will delete all data!)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Stop services only"
    echo "  $0 true               # Stop and remove containers"
    echo "  $0 true true          # Stop, remove containers and volumes (DESTRUCTIVE!)"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

print_status "Stopping development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_warning "Docker is not running. Nothing to stop."
    exit 0
fi

# Check if any containers are running
if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    print_warning "No development containers are currently running."
    exit 0
fi

# Stop services
print_status "Stopping development services..."
docker-compose -f docker-compose.dev.yml stop

# Show running containers before cleanup
print_status "Current container status:"
docker-compose -f docker-compose.dev.yml ps

if [ "$CLEAN" = "true" ]; then
    print_status "Removing containers..."
    docker-compose -f docker-compose.dev.yml down
    
    if [ "$VOLUMES" = "true" ]; then
        print_warning "⚠️  DESTRUCTIVE OPERATION: Removing data volumes..."
        echo "This will permanently delete:"
        echo "  • Database data"
        echo "  • Redis data"
        echo "  • Uploaded files"
        echo "  • Log files"
        echo ""
        read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
        
        if [ "$confirm" = "yes" ]; then
            docker-compose -f docker-compose.dev.yml down -v
            print_warning "All data volumes have been removed"
        else
            print_status "Volume removal cancelled"
        fi
    fi
    
    # Clean up orphaned containers
    print_status "Cleaning up orphaned containers..."
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    
    # Remove unused images (optional)
    if docker images | grep -q "signtusk"; then
        print_status "Development images found. You can remove them with:"
        echo "  docker rmi \$(docker images | grep 'signtusk' | awk '{print \$3}')"
    fi
fi

# Kill any remaining processes
print_status "Checking for remaining processes..."

# Kill any Node.js processes running on development ports
if lsof -ti:3000 > /dev/null 2>&1; then
    print_status "Stopping process on port 3000..."
    kill $(lsof -ti:3000) 2>/dev/null || true
fi

if lsof -ti:9090 > /dev/null 2>&1; then
    print_status "Stopping process on port 9090..."
    kill $(lsof -ti:9090) 2>/dev/null || true
fi

if lsof -ti:5555 > /dev/null 2>&1; then
    print_status "Stopping process on port 5555..."
    kill $(lsof -ti:5555) 2>/dev/null || true
fi

# Show final status
print_status "Final container status:"
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    print_warning "Some containers are still running:"
    docker-compose -f docker-compose.dev.yml ps
else
    print_success "All development containers have been stopped"
fi

# Show disk usage if volumes were not removed
if [ "$VOLUMES" != "true" ]; then
    echo ""
    print_status "Data volumes are preserved. To see disk usage:"
    echo "  docker system df"
    echo ""
    print_status "To remove all data (DESTRUCTIVE):"
    echo "  $0 true true"
fi

echo ""
print_success "Development environment stopped successfully!"

# Show restart instructions
echo ""
print_status "To restart the development environment:"
echo "  ./scripts/dev-start.sh"
echo ""
print_status "To set up from scratch:"
echo "  ./scripts/dev-setup.sh"