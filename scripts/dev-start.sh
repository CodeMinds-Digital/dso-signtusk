#!/bin/bash

# Development Server Start Script
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
MODE=${1:-"full"}
DETACHED=${2:-"false"}

show_help() {
    echo "Usage: $0 [MODE] [DETACHED]"
    echo ""
    echo "Modes:"
    echo "  full     - Start all services including app (default)"
    echo "  services - Start only infrastructure services (DB, Redis, etc.)"
    echo "  app      - Start only the application (assumes services are running)"
    echo ""
    echo "Options:"
    echo "  true     - Run in detached mode (background)"
    echo "  false    - Run in foreground with logs (default)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start everything in foreground"
    echo "  $0 full true          # Start everything in background"
    echo "  $0 services           # Start only infrastructure services"
    echo "  $0 app                # Start only the application"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Validate mode
if [[ ! "$MODE" =~ ^(full|services|app)$ ]]; then
    print_error "Invalid mode: $MODE"
    show_help
    exit 1
fi

print_status "Starting development environment in '$MODE' mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Function to check service health
check_service_health() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.dev.yml ps | grep -q "$service.*healthy\|$service.*Up"; then
            print_success "$service is healthy"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to become healthy within $((max_attempts * 2)) seconds"
    return 1
}

# Function to start services
start_services() {
    print_status "Starting infrastructure services..."
    
    if [ "$DETACHED" = "true" ]; then
        docker-compose -f docker-compose.dev.yml up -d database redis mailhog adminer redis-commander
    else
        docker-compose -f docker-compose.dev.yml up database redis mailhog adminer redis-commander &
        SERVICES_PID=$!
    fi
    
    # Wait for critical services
    check_service_health "database"
    check_service_health "redis"
    
    print_success "Infrastructure services are ready"
}

# Function to start application
start_app() {
    print_status "Starting application..."
    
    # Ensure dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm ci
    fi
    
    # Run database migrations if needed
    print_status "Checking database migrations..."
    npm run db:migrate
    
    if [ "$DETACHED" = "true" ]; then
        # Start app in Docker
        docker-compose -f docker-compose.dev.yml up -d app
        check_service_health "app"
    else
        # Start app locally with hot reloading
        print_status "Starting application with hot reloading..."
        npm run dev &
        APP_PID=$!
        
        # Wait for app to be ready
        print_status "Waiting for application to be ready..."
        timeout=60
        while ! curl -f http://localhost:3000/health > /dev/null 2>&1; do
            sleep 2
            timeout=$((timeout - 2))
            if [ $timeout -le 0 ]; then
                print_error "Application failed to start within 60 seconds"
                exit 1
            fi
        done
    fi
    
    print_success "Application is ready"
}

# Function to show status
show_status() {
    echo ""
    echo "🎉 Development environment is ready!"
    echo ""
    echo "🌐 Available services:"
    echo "  • Application: http://localhost:3000"
    echo "  • Health Check: http://localhost:3000/health"
    echo "  • API Documentation: http://localhost:3000/api/docs"
    echo "  • Database Admin (Adminer): http://localhost:8080"
    echo "  • Email Testing (MailHog): http://localhost:8025"
    echo "  • Redis Admin: http://localhost:8081"
    echo "  • Metrics: http://localhost:9090"
    echo "  • Prisma Studio: http://localhost:5555"
    echo ""
    echo "🛠️  Development tools:"
    echo "  • Hot reloading: Enabled"
    echo "  • TypeScript checking: Enabled"
    echo "  • ESLint: Enabled"
    echo "  • Prettier: Enabled"
    echo ""
    echo "📋 Useful commands:"
    echo "  • View logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "  • Stop services: docker-compose -f docker-compose.dev.yml down"
    echo "  • Restart app: docker-compose -f docker-compose.dev.yml restart app"
    echo "  • Run tests: npm run test"
    echo "  • Run migrations: npm run db:migrate"
    echo "  • Reset database: npm run db:reset"
    echo ""
}

# Function to handle cleanup
cleanup() {
    print_status "Shutting down development environment..."
    
    if [ -n "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
    fi
    
    if [ -n "$SERVICES_PID" ]; then
        kill $SERVICES_PID 2>/dev/null || true
    fi
    
    if [ "$DETACHED" != "true" ]; then
        docker-compose -f docker-compose.dev.yml down
    fi
    
    print_success "Development environment stopped"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

# Main execution
case $MODE in
    "services")
        start_services
        show_status
        if [ "$DETACHED" != "true" ]; then
            print_status "Services running in foreground. Press Ctrl+C to stop."
            wait
        fi
        ;;
    "app")
        # Check if services are running
        if ! docker-compose -f docker-compose.dev.yml ps | grep -q "database.*Up"; then
            print_error "Infrastructure services are not running. Start them first with: $0 services"
            exit 1
        fi
        start_app
        show_status
        if [ "$DETACHED" != "true" ]; then
            print_status "Application running in foreground. Press Ctrl+C to stop."
            wait
        fi
        ;;
    "full")
        start_services
        start_app
        show_status
        if [ "$DETACHED" != "true" ]; then
            print_status "Development environment running. Press Ctrl+C to stop all services."
            wait
        fi
        ;;
esac