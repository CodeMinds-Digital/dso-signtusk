#!/bin/bash

# Hybrid Architecture Development Setup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Setting up hybrid architecture development environment${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ $1 is installed${NC}"
    return 0
}

echo -e "${YELLOW}🔍 Checking required tools...${NC}"
check_tool "node" || exit 1
check_tool "npm" || exit 1
check_tool "docker" || exit 1
check_tool "docker-compose" || exit 1

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION or higher${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version $NODE_VERSION is compatible${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Generate environment files if they don't exist
echo -e "${PURPLE}🔧 Setting up environment configuration...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Generating .env file...${NC}"
    node scripts/env-config.js generate development
fi

if [ ! -f "apps/web/.env" ]; then
    echo -e "${YELLOW}📝 Generating apps/web/.env file...${NC}"
    cp apps/web/.env.example apps/web/.env
fi

if [ ! -f "apps/app/.env" ]; then
    echo -e "${YELLOW}📝 Generating apps/app/.env file...${NC}"
    cp apps/app/.env.example apps/app/.env
fi

# Validate environment configuration
echo -e "${PURPLE}🔍 Validating environment configuration...${NC}"
node scripts/env-config.js validate development

# Build Docker images
echo -e "${YELLOW}🐳 Building Docker images...${NC}"
docker-compose -f docker-compose.dev.yml build

# Start services
echo -e "${YELLOW}🚀 Starting development services...${NC}"
docker-compose -f docker-compose.dev.yml up -d database redis mailhog adminer redis-commander

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check service health
check_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s --max-time 2 "http://localhost:$port" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service is ready${NC}"
            return 0
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            echo -e "${RED}❌ $service failed to start${NC}"
            return 1
        fi
        
        sleep 2
        ((attempt++))
    done
}

echo -e "${YELLOW}🏥 Checking service health...${NC}"
check_service "Database" 5432
check_service "Redis" 6379
check_service "MailHog" 8025
check_service "Adminer" 8080
check_service "Redis Commander" 8081

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npm run db:migrate

# Build applications
echo -e "${YELLOW}🔨 Building applications...${NC}"
npm run build

# Run tests to ensure everything is working
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm run test:unit

echo -e "${GREEN}🎉 Development environment setup complete!${NC}"

# Display useful information
echo -e "${BLUE}📋 Development Environment Information:${NC}"
echo -e "${BLUE}  Next.js Web App: http://localhost:3000${NC}"
echo -e "${BLUE}  Remix Main App: http://localhost:3001${NC}"
echo -e "${BLUE}  tRPC API: http://localhost:3002${NC}"
echo -e "${BLUE}  Database: postgresql://postgres:password@localhost:5432/signtusk_dev${NC}"
echo -e "${BLUE}  Redis: redis://localhost:6379${NC}"
echo -e "${BLUE}  MailHog UI: http://localhost:8025${NC}"
echo -e "${BLUE}  Adminer: http://localhost:8080${NC}"
echo -e "${BLUE}  Redis Commander: http://localhost:8081${NC}"
echo -e "${BLUE}  Prisma Studio: npm run db:studio${NC}"

echo -e "${PURPLE}🚀 To start development:${NC}"
echo -e "${PURPLE}  npm run dev:hybrid    # Start all services and apps${NC}"
echo -e "${PURPLE}  npm run dev:docker    # Start in Docker containers${NC}"
echo -e "${PURPLE}  npm run dev           # Start apps only (services must be running)${NC}"

echo -e "${PURPLE}🛠️  Useful commands:${NC}"
echo -e "${PURPLE}  npm run docker:logs   # View all logs${NC}"
echo -e "${PURPLE}  npm run docker:restart # Restart services${NC}"
echo -e "${PURPLE}  npm run config:validate # Validate environment${NC}"
echo -e "${PURPLE}  npm run health:check:all # Check all services${NC}"