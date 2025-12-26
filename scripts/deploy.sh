#!/bin/bash

# Deployment script for Signtusk
set -e

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
REGISTRY=${DOCKER_REGISTRY:-"signtusk"}

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "❌ Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

# Load environment-specific configuration
if [ -f ".env.$ENVIRONMENT" ]; then
    echo "📋 Loading environment configuration from .env.$ENVIRONMENT"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo "⚠️  No environment file found for $ENVIRONMENT, using defaults"
fi

# Validate required environment variables
required_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
    "ENCRYPTION_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Build Docker image
echo "🔨 Building Docker image..."
if [ "$ENVIRONMENT" = "development" ]; then
    docker build -f Dockerfile.dev -t $REGISTRY:$VERSION-dev .
else
    docker build -f Dockerfile -t $REGISTRY:$VERSION \
        --build-arg NODE_ENV=$ENVIRONMENT \
        --build-arg DATABASE_URL="$DATABASE_URL" \
        --build-arg REDIS_URL="$REDIS_URL" \
        --build-arg JWT_SECRET="$JWT_SECRET" \
        --build-arg ENCRYPTION_KEY="$ENCRYPTION_KEY" \
        .
fi

# Run database migrations
echo "🗄️  Running database migrations..."
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose -f docker-compose.dev.yml run --rm app npm run db:migrate
else
    docker-compose run --rm app npm run db:migrate
fi

# Health check before deployment
echo "🏥 Performing pre-deployment health check..."
if [ "$ENVIRONMENT" != "development" ]; then
    # Start a temporary container to run health checks
    TEMP_CONTAINER=$(docker run -d --env-file .env.$ENVIRONMENT $REGISTRY:$VERSION)
    
    # Wait for container to start
    sleep 10
    
    # Check if container is healthy
    if ! docker exec $TEMP_CONTAINER curl -f http://localhost:3000/health; then
        echo "❌ Health check failed, aborting deployment"
        docker stop $TEMP_CONTAINER
        docker rm $TEMP_CONTAINER
        exit 1
    fi
    
    # Clean up temporary container
    docker stop $TEMP_CONTAINER
    docker rm $TEMP_CONTAINER
fi

# Deploy based on environment
case $ENVIRONMENT in
    "development")
        echo "🔧 Starting development environment..."
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    "staging"|"production")
        echo "🚀 Deploying to $ENVIRONMENT..."
        
        # Create backup of current deployment
        if docker-compose ps | grep -q "Up"; then
            echo "💾 Creating backup of current deployment..."
            docker-compose stop
            docker tag $REGISTRY:current $REGISTRY:backup-$(date +%Y%m%d-%H%M%S) || true
        fi
        
        # Deploy new version
        docker tag $REGISTRY:$VERSION $REGISTRY:current
        docker-compose up -d
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to be ready..."
        sleep 30
        
        # Verify deployment
        echo "✅ Verifying deployment..."
        if ! curl -f http://localhost/health; then
            echo "❌ Deployment verification failed, rolling back..."
            docker-compose stop
            docker tag $REGISTRY:backup-$(date +%Y%m%d) $REGISTRY:current || true
            docker-compose up -d
            exit 1
        fi
        ;;
esac

# Post-deployment tasks
echo "🧹 Running post-deployment tasks..."

# Seed database if needed
if [ "$ENVIRONMENT" = "development" ] || [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    docker-compose exec app npm run db:seed
fi

# Clear caches
echo "🗑️  Clearing caches..."
docker-compose exec app npm run cache:clear || true

# Generate sitemap (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🗺️  Generating sitemap..."
    docker-compose exec app npm run sitemap:generate || true
fi

# Send deployment notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    echo "📢 Sending deployment notification..."
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 Deployment completed for $ENVIRONMENT environment (version: $VERSION)\"}" \
        $SLACK_WEBHOOK_URL || true
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Application is available at: http://localhost:3000"
echo "📊 Metrics available at: http://localhost:9090"

if [ "$ENVIRONMENT" = "development" ]; then
    echo "🗄️  Database admin: http://localhost:8080"
    echo "📧 Mail catcher: http://localhost:8025"
    echo "🔍 Redis admin: http://localhost:8081"
fi