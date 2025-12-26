#!/bin/bash

# Development Environment Setup Script
set -e

echo "🚀 Setting up Signtusk development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    if [ ! -f ".env.development" ]; then
        print_warning ".env.development not found, creating from example..."
        cp .env.example .env.development
        
        # Update development-specific values
        sed -i.bak 's|DATABASE_URL="postgresql://username:password@localhost:5432/signtusk"|DATABASE_URL="postgresql://postgres:password@localhost:5432/signtusk_dev"|g' .env.development
        sed -i.bak 's|NODE_ENV="development"|NODE_ENV=development|g' .env.development
        sed -i.bak 's|LOG_LEVEL="info"|LOG_LEVEL=debug|g' .env.development
        sed -i.bak 's|ENABLE_AI_FEATURES="false"|ENABLE_AI_FEATURES=true|g' .env.development
        
        rm .env.development.bak 2>/dev/null || true
        
        print_success "Created .env.development file"
    else
        print_success ".env.development already exists"
    fi
    
    # Create .env.local for local overrides
    if [ ! -f ".env.local" ]; then
        cat > .env.local << EOF
# Local development overrides
# This file is ignored by git and can contain sensitive local configuration

# Uncomment and set these if you need local overrides:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/signtusk_dev
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=your-local-jwt-secret
# ENCRYPTION_KEY=your-local-encryption-key

# OAuth credentials for local testing (optional)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email testing (MailHog is configured by default)
# SMTP_HOST=localhost
# SMTP_PORT=1025

# Feature flags for local development
# ENABLE_AI_FEATURES=true
# ENABLE_EXPERIMENTAL_FEATURES=true
EOF
        print_success "Created .env.local template"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Clean install
    if [ -d "node_modules" ]; then
        print_status "Cleaning existing node_modules..."
        rm -rf node_modules
    fi
    
    npm ci
    print_success "Dependencies installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Start database services
    print_status "Starting database and Redis services..."
    docker-compose -f docker-compose.dev.yml up -d database redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    timeout=60
    while ! docker-compose -f docker-compose.dev.yml exec -T database pg_isready -U postgres > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "Database failed to start within 60 seconds"
            exit 1
        fi
    done
    
    print_success "Database is ready"
    
    # Run migrations
    print_status "Running database migrations..."
    npm run db:migrate
    
    # Seed database
    print_status "Seeding database with development data..."
    npm run db:seed
    
    print_success "Database setup complete"
}

# Setup development tools
setup_dev_tools() {
    print_status "Setting up development tools..."
    
    # Start additional development services
    print_status "Starting development services (MailHog, Adminer, Redis Commander)..."
    docker-compose -f docker-compose.dev.yml up -d mailhog adminer redis-commander
    
    print_success "Development tools are ready"
}

# Verify setup
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if all services are running
    services=("database" "redis" "mailhog" "adminer" "redis-commander")
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.dev.yml ps | grep -q "$service.*Up"; then
            print_success "$service is running"
        else
            print_warning "$service is not running"
        fi
    done
    
    # Test database connection
    if npm run config:validate > /dev/null 2>&1; then
        print_success "Configuration is valid"
    else
        print_warning "Configuration validation failed"
    fi
}

# Main setup process
main() {
    echo "🔧 Signtusk Development Environment Setup"
    echo "=================================================="
    
    check_prerequisites
    setup_environment
    install_dependencies
    setup_database
    setup_dev_tools
    verify_setup
    
    echo ""
    echo "🎉 Development environment setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Review and update .env.development with your specific configuration"
    echo "  2. Add any local overrides to .env.local"
    echo "  3. Start the development server: npm run dev"
    echo ""
    echo "🌐 Available services:"
    echo "  • Application: http://localhost:3000"
    echo "  • Database Admin (Adminer): http://localhost:8080"
    echo "  • Email Testing (MailHog): http://localhost:8025"
    echo "  • Redis Admin: http://localhost:8081"
    echo "  • Metrics: http://localhost:9090"
    echo "  • Prisma Studio: http://localhost:5555"
    echo ""
    echo "🛠️  Useful commands:"
    echo "  • Start development: npm run dev"
    echo "  • Run tests: npm run test"
    echo "  • View logs: npm run docker:logs"
    echo "  • Stop services: npm run docker:down:dev"
    echo "  • Reset database: npm run db:reset"
    echo ""
}

# Run main function
main "$@"