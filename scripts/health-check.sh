#!/bin/bash

# Health Check Script for Development Environment
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
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Health check results
HEALTH_ISSUES=0

echo "🏥 Signtusk - Development Environment Health Check"
echo "============================================================"

# Check Docker
print_status "Checking Docker..."
if command -v docker &> /dev/null; then
    if docker info > /dev/null 2>&1; then
        print_success "Docker is running"
    else
        print_error "Docker is installed but not running"
        HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
    fi
else
    print_error "Docker is not installed"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Check Docker Compose
print_status "Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    print_success "Docker Compose is available"
else
    print_error "Docker Compose is not installed"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Check Node.js
print_status "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_success "Node.js $NODE_VERSION (✓ >= 18.0.0)"
    else
        print_warning "Node.js $NODE_VERSION (⚠ recommend >= 18.0.0)"
    fi
else
    print_error "Node.js is not installed"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Check npm
print_status "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION"
else
    print_error "npm is not installed"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Check dependencies
print_status "Checking dependencies..."
if [ -d "node_modules" ]; then
    print_success "Dependencies are installed"
else
    print_warning "Dependencies not installed (run: npm ci)"
fi

# Check environment files
print_status "Checking environment configuration..."
if [ -f ".env.development" ]; then
    print_success ".env.development exists"
else
    print_warning ".env.development missing (run: ./scripts/dev-setup.sh)"
fi

if [ -f ".env.local" ]; then
    print_success ".env.local exists"
else
    print_warning ".env.local missing (optional local overrides)"
fi

# Check Docker services
print_status "Checking Docker services..."
if docker-compose -f docker-compose.dev.yml ps > /dev/null 2>&1; then
    RUNNING_SERVICES=$(docker-compose -f docker-compose.dev.yml ps --services --filter "status=running" | wc -l)
    TOTAL_SERVICES=$(docker-compose -f docker-compose.dev.yml config --services | wc -l)
    
    if [ "$RUNNING_SERVICES" -gt 0 ]; then
        print_success "$RUNNING_SERVICES/$TOTAL_SERVICES services are running"
        
        # Check individual services
        services=("database" "redis" "mailhog" "adminer" "redis-commander")
        for service in "${services[@]}"; do
            if docker-compose -f docker-compose.dev.yml ps | grep -q "$service.*Up"; then
                print_success "  $service is running"
            else
                print_warning "  $service is not running"
            fi
        done
    else
        print_warning "No services are currently running"
    fi
else
    print_warning "Docker Compose services not initialized"
fi

# Check service connectivity
print_status "Checking service connectivity..."

# Database
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    print_success "Database admin (Adminer) is accessible"
else
    print_warning "Database admin (Adminer) is not accessible"
fi

# Redis
if curl -f http://localhost:8081 > /dev/null 2>&1; then
    print_success "Redis admin is accessible"
else
    print_warning "Redis admin is not accessible"
fi

# MailHog
if curl -f http://localhost:8025 > /dev/null 2>&1; then
    print_success "Email testing (MailHog) is accessible"
else
    print_warning "Email testing (MailHog) is not accessible"
fi

# Application
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Application health check passed"
else
    print_warning "Application is not running or health check failed"
fi

# Check ports
print_status "Checking port availability..."
ports=(3000 5432 6379 8080 8025 8081 5555 9090)
for port in "${ports[@]}"; do
    if lsof -ti:$port > /dev/null 2>&1; then
        print_success "Port $port is in use"
    else
        print_warning "Port $port is available"
    fi
done

# Check disk space
print_status "Checking disk space..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    print_success "Disk usage: ${DISK_USAGE}% (healthy)"
else
    print_warning "Disk usage: ${DISK_USAGE}% (consider cleanup)"
fi

# Check Docker disk usage
if command -v docker &> /dev/null && docker info > /dev/null 2>&1; then
    print_status "Checking Docker disk usage..."
    docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}" | while read line; do
        if [[ $line == *"Images"* ]] || [[ $line == *"Containers"* ]] || [[ $line == *"Volumes"* ]]; then
            print_success "  $line"
        fi
    done
fi

# Summary
echo ""
echo "📊 Health Check Summary"
echo "======================"

if [ $HEALTH_ISSUES -eq 0 ]; then
    print_success "All critical components are healthy! 🎉"
    echo ""
    echo "🚀 Ready for development!"
    echo "  • Start development: ./scripts/dev-start.sh"
    echo "  • View services: npm run dev:status"
    echo "  • Run tests: npm run test"
else
    print_warning "$HEALTH_ISSUES critical issues found"
    echo ""
    echo "🔧 Recommended actions:"
    echo "  • Install missing prerequisites"
    echo "  • Run setup: ./scripts/dev-setup.sh"
    echo "  • Start services: ./scripts/dev-start.sh"
fi

echo ""
echo "📋 Quick Commands:"
echo "  • Setup environment: ./scripts/dev-setup.sh"
echo "  • Start development: ./scripts/dev-start.sh"
echo "  • Stop services: ./scripts/dev-stop.sh"
echo "  • Reset environment: ./scripts/dev-reset.sh"
echo "  • View logs: npm run docker:logs"

exit $HEALTH_ISSUES