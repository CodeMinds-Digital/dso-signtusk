#!/bin/bash

# Enhanced Hybrid Architecture Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DEPLOY_WEB=${2:-true}
DEPLOY_APP=${3:-true}
PLATFORM=${4:-fly} # fly or railway

echo -e "${BLUE}🚀 Starting hybrid architecture deployment for ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [development|staging|production] [deploy_web] [deploy_app] [platform]"
    exit 1
fi

# Check required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}🔍 Checking required tools...${NC}"
check_tool "npm"
check_tool "git"
check_tool "node"

if [[ "$DEPLOY_WEB" == "true" ]]; then
    check_tool "vercel"
fi

if [[ "$DEPLOY_APP" == "true" ]]; then
    if [[ "$PLATFORM" == "fly" ]]; then
        check_tool "fly"
    elif [[ "$PLATFORM" == "railway" ]]; then
        check_tool "railway"
    fi
fi

# Validate environment configuration
echo -e "${PURPLE}🔧 Validating environment configuration...${NC}"
node scripts/env-config.js validate $ENVIRONMENT
if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Environment validation failed${NC}"
    exit 1
fi

# Ensure we're on the right branch for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" ]]; then
        echo -e "${RED}❌ Production deployments must be from main branch${NC}"
        echo "Current branch: $CURRENT_BRANCH"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        echo -e "${RED}❌ Uncommitted changes detected${NC}"
        exit 1
    fi
fi

# Install dependencies and build
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}🔨 Building applications...${NC}"
npm run build

echo -e "${YELLOW}🧪 Running comprehensive tests...${NC}"
npm run test:unit
npm run test:properties
npm run lint
npm run type-check

# Deploy Next.js Web App to Vercel
if [[ "$DEPLOY_WEB" == "true" ]]; then
    echo -e "${BLUE}🌐 Deploying Next.js web app to Vercel...${NC}"
    
    cd apps/web
    
    # Set environment-specific variables
    if [[ "$ENVIRONMENT" == "production" ]]; then
        vercel --prod --yes --env NODE_ENV=production
        WEB_URL="https://signtusk.com"
    else
        vercel --yes --env NODE_ENV=staging
        WEB_URL=$(vercel ls --scope=team | grep "signtusk-web" | head -1 | awk '{print $2}')
    fi
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Web app deployed successfully${NC}"
        echo -e "${GREEN}   URL: $WEB_URL${NC}"
    else
        echo -e "${RED}❌ Web app deployment failed${NC}"
        exit 1
    fi
    
    cd ../..
fi

# Deploy Remix App to chosen platform
if [[ "$DEPLOY_APP" == "true" ]]; then
    cd apps/app
    
    if [[ "$PLATFORM" == "fly" ]]; then
        echo -e "${BLUE}🚁 Deploying Remix app to Fly.io...${NC}"
        
        if [[ "$ENVIRONMENT" == "production" ]]; then
            fly deploy --config fly.toml --strategy rolling
            APP_URL="https://signtusk-app.fly.dev"
        else
            fly deploy --config fly.staging.toml --strategy immediate
            APP_URL="https://signtusk-app-staging.fly.dev"
        fi
        
    elif [[ "$PLATFORM" == "railway" ]]; then
        echo -e "${BLUE}🚂 Deploying Remix app to Railway...${NC}"
        
        if [[ "$ENVIRONMENT" == "production" ]]; then
            railway up --environment production
        else
            railway up --environment staging
        fi
        
        APP_URL=$(railway status --json | jq -r '.deployments[0].url')
    fi
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Remix app deployed successfully${NC}"
        echo -e "${GREEN}   URL: $APP_URL${NC}"
    else
        echo -e "${RED}❌ Remix app deployment failed${NC}"
        exit 1
    fi
    
    cd ../..
fi

# Health checks with retry logic
echo -e "${YELLOW}🏥 Running health checks...${NC}"

health_check() {
    local url=$1
    local name=$2
    local max_attempts=5
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        echo "  Checking $name (attempt $attempt/$max_attempts)..."
        
        if curl -f -s --max-time 10 "$url/health" > /dev/null; then
            echo -e "${GREEN}  ✅ $name is healthy${NC}"
            return 0
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            echo -e "${RED}  ❌ $name health check failed${NC}"
            return 1
        fi
        
        sleep 10
        ((attempt++))
    done
}

if [[ "$DEPLOY_WEB" == "true" && -n "$WEB_URL" ]]; then
    health_check "$WEB_URL" "Web App"
fi

if [[ "$DEPLOY_APP" == "true" && -n "$APP_URL" ]]; then
    health_check "$APP_URL" "Main App"
fi

# Generate deployment report
echo -e "${PURPLE}📊 Generating deployment report...${NC}"
cat > deployment-report.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "platform": "$PLATFORM",
  "deployments": {
    "web": {
      "deployed": $DEPLOY_WEB,
      "url": "${WEB_URL:-null}"
    },
    "app": {
      "deployed": $DEPLOY_APP,
      "url": "${APP_URL:-null}"
    }
  },
  "git": {
    "branch": "$(git branch --show-current)",
    "commit": "$(git rev-parse HEAD)",
    "message": "$(git log -1 --pretty=%B | tr '\n' ' ')"
  }
}
EOF

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"

# Output deployment summary
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "${BLUE}  Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}  Platform: ${PLATFORM}${NC}"
if [[ "$DEPLOY_WEB" == "true" ]]; then
    echo -e "${BLUE}  Web App: ${WEB_URL:-'Check Vercel dashboard'}${NC}"
fi
if [[ "$DEPLOY_APP" == "true" ]]; then
    echo -e "${BLUE}  Main App: ${APP_URL:-'Check platform dashboard'}${NC}"
fi
echo -e "${BLUE}  Report: deployment-report.json${NC}"