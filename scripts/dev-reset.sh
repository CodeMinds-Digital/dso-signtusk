#!/bin/bash

# Development Environment Reset Script
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
RESET_TYPE=${1:-"soft"}

show_help() {
    echo "Usage: $0 [RESET_TYPE]"
    echo ""
    echo "Reset Types:"
    echo "  soft     - Reset database and cache only (default)"
    echo "  hard     - Reset everything including containers and volumes"
    echo "  nuclear  - Complete reset including node_modules and Docker images"
    echo ""
    echo "Examples:"
    echo "  $0           # Soft reset (database and cache)"
    echo "  $0 soft      # Same as above"
    echo "  $0 hard      # Reset containers and volumes"
    echo "  $0 nuclear   # Complete reset (DESTRUCTIVE!)"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Validate reset type
if [[ ! "$RESET_TYPE" =~ ^(soft|hard|nuclear)$ ]]; then
    print_error "Invalid reset type: $RESET_TYPE"
    show_help
    exit 1
fi

print_warning "⚠️  Development Environment Reset ($RESET_TYPE)"
echo "=============================================="

case $RESET_TYPE in
    "soft")
        echo "This will reset:"
        echo "  • Database data"
        echo "  • Redis cache"
        echo "  • Application state"
        echo ""
        echo "This will preserve:"
        echo "  • Docker containers"
        echo "  • Node modules"
        echo "  • Environment files"
        ;;
    "hard")
        echo "This will reset:"
        echo "  • Database data"
        echo "  • Redis cache"
        echo "  • Docker containers and volumes"
        echo "  • Application state"
        echo ""
        echo "This will preserve:"
        echo "  • Node modules"
        echo "  • Environment files"
        echo "  • Docker images"
        ;;
    "nuclear")
        echo "⚠️  DESTRUCTIVE OPERATION ⚠️"
        echo "This will reset EVERYTHING:"
        echo "  • Database data"
        echo "  • Redis cache"
        echo "  • Docker containers and volumes"
        echo "  • Docker images"
        echo "  • Node modules"
        echo "  • Build artifacts"
        echo ""
        echo "This will preserve:"
        echo "  • Source code"
        echo "  • Environment files"
        ;;
esac

echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    print_status "Reset cancelled"
    exit 0
fi

echo ""
print_status "Starting $RESET_TYPE reset..."

# Function to perform soft reset
soft_reset() {
    print_status "Performing soft reset..."
    
    # Stop application if running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "app.*Up"; then
        print_status "Stopping application..."
        docker-compose -f docker-compose.dev.yml stop app
    fi
    
    # Reset database
    print_status "Resetting database..."
    if docker-compose -f docker-compose.dev.yml ps | grep -q "database.*Up"; then
        docker-compose -f docker-compose.dev.yml exec -T database psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS signtusk_dev;"
        docker-compose -f docker-compose.dev.yml exec -T database psql -U postgres -d postgres -c "CREATE DATABASE signtusk_dev;"
    else
        print_status "Starting database for reset..."
        docker-compose -f docker-compose.dev.yml up -d database
        sleep 10
        docker-compose -f docker-compose.dev.yml exec -T database psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS signtusk_dev;"
        docker-compose -f docker-compose.dev.yml exec -T database psql -U postgres -d postgres -c "CREATE DATABASE signtusk_dev;"
    fi
    
    # Clear Redis cache
    print_status "Clearing Redis cache..."
    if docker-compose -f docker-compose.dev.yml ps | grep -q "redis.*Up"; then
        docker-compose -f docker-compose.dev.yml exec -T redis redis-cli FLUSHALL
    else
        print_status "Starting Redis for reset..."
        docker-compose -f docker-compose.dev.yml up -d redis
        sleep 5
        docker-compose -f docker-compose.dev.yml exec -T redis redis-cli FLUSHALL
    fi
    
    # Run migrations and seed
    print_status "Running database migrations..."
    npm run db:migrate
    
    print_status "Seeding database..."
    npm run db:seed
    
    # Clear application caches
    print_status "Clearing application caches..."
    npm run cache:clear || true
    
    # Remove temporary files
    if [ -d "uploads" ]; then
        print_status "Clearing uploads directory..."
        rm -rf uploads/*
    fi
    
    if [ -d "logs" ]; then
        print_status "Clearing logs directory..."
        rm -rf logs/*
    fi
    
    print_success "Soft reset completed"
}

# Function to perform hard reset
hard_reset() {
    print_status "Performing hard reset..."
    
    # Stop all services
    print_status "Stopping all services..."
    docker-compose -f docker-compose.dev.yml down -v --remove-orphans
    
    # Remove all containers and volumes
    print_status "Removing containers and volumes..."
    docker-compose -f docker-compose.dev.yml down -v
    
    # Clear application caches and temporary files
    print_status "Clearing application files..."
    rm -rf uploads/* logs/* 2>/dev/null || true
    
    # Restart services
    print_status "Starting fresh services..."
    docker-compose -f docker-compose.dev.yml up -d database redis
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Run migrations and seed
    print_status "Running database migrations..."
    npm run db:migrate
    
    print_status "Seeding database..."
    npm run db:seed
    
    print_success "Hard reset completed"
}

# Function to perform nuclear reset
nuclear_reset() {
    print_status "Performing nuclear reset..."
    
    # Stop all services
    print_status "Stopping all services..."
    docker-compose -f docker-compose.dev.yml down -v --remove-orphans || true
    
    # Remove Docker images
    print_status "Removing Docker images..."
    if docker images | grep -q "signtusk"; then
        docker rmi $(docker images | grep 'signtusk' | awk '{print $3}') 2>/dev/null || true
    fi
    
    # Remove node_modules
    print_status "Removing node_modules..."
    rm -rf node_modules
    find packages -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove build artifacts
    print_status "Removing build artifacts..."
    rm -rf dist build .turbo coverage playwright-report test-results
    find packages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find packages -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Clear application files
    print_status "Clearing application files..."
    rm -rf uploads/* logs/* 2>/dev/null || true
    
    # Reinstall dependencies
    print_status "Reinstalling dependencies..."
    npm ci
    
    # Rebuild Docker images
    print_status "Rebuilding Docker images..."
    docker-compose -f docker-compose.dev.yml build --no-cache
    
    # Start services
    print_status "Starting fresh services..."
    docker-compose -f docker-compose.dev.yml up -d database redis
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 20
    
    # Run migrations and seed
    print_status "Running database migrations..."
    npm run db:migrate
    
    print_status "Seeding database..."
    npm run db:seed
    
    print_success "Nuclear reset completed"
}

# Execute the appropriate reset
case $RESET_TYPE in
    "soft")
        soft_reset
        ;;
    "hard")
        hard_reset
        ;;
    "nuclear")
        nuclear_reset
        ;;
esac

echo ""
print_success "🎉 Development environment reset completed!"
echo ""
print_status "Next steps:"
echo "  1. Start the development environment: ./scripts/dev-start.sh"
echo "  2. Verify everything is working: npm run test"
echo ""
print_status "Available services after restart:"
echo "  • Application: http://localhost:3000"
echo "  • Database Admin: http://localhost:8080"
echo "  • Email Testing: http://localhost:8025"
echo "  • Redis Admin: http://localhost:8081"