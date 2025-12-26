# Signtusk - Development Makefile
# Provides convenient shortcuts for common development tasks

.PHONY: help setup start stop restart reset clean test lint format health logs status

# Default target
help: ## Show this help message
	@echo "Signtusk - Development Commands"
	@echo "==============================="
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Examples:"
	@echo "  make setup     # Initial environment setup"
	@echo "  make start     # Start development environment"
	@echo "  make test      # Run all tests"
	@echo "  make logs      # View application logs"

# Environment Management
setup: ## Initial development environment setup
	@echo "🚀 Setting up development environment..."
	./scripts/dev-setup.sh

start: ## Start development environment
	@echo "🔥 Starting development environment..."
	./scripts/dev-start.sh

start-services: ## Start only infrastructure services
	@echo "🔧 Starting infrastructure services..."
	./scripts/dev-start.sh services

start-app: ## Start only the application
	@echo "📱 Starting application..."
	./scripts/dev-start.sh app

stop: ## Stop development environment
	@echo "🛑 Stopping development environment..."
	./scripts/dev-stop.sh

restart: ## Restart development environment
	@echo "🔄 Restarting development environment..."
	./scripts/dev-stop.sh
	./scripts/dev-start.sh

# Reset Operations
reset: ## Soft reset (database and cache only)
	@echo "🔄 Performing soft reset..."
	./scripts/dev-reset.sh soft

reset-hard: ## Hard reset (containers and volumes)
	@echo "💥 Performing hard reset..."
	./scripts/dev-reset.sh hard

reset-nuclear: ## Nuclear reset (everything including node_modules)
	@echo "☢️  Performing nuclear reset..."
	./scripts/dev-reset.sh nuclear

# Development Tasks
dev: ## Start development server (local)
	@echo "🔥 Starting development server..."
	npm run dev

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	npm ci

build: ## Build the application
	@echo "🔨 Building application..."
	npm run build

# Testing
test: ## Run all tests
	@echo "🧪 Running all tests..."
	npm run test

test-unit: ## Run unit tests
	@echo "🔬 Running unit tests..."
	npm run test:unit

test-e2e: ## Run end-to-end tests
	@echo "🎭 Running E2E tests..."
	npm run test:e2e

test-properties: ## Run property-based tests
	@echo "🎲 Running property-based tests..."
	npm run test:properties

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	npm run test:watch

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	npm run test:coverage

# Code Quality
lint: ## Lint code
	@echo "🔍 Linting code..."
	npm run lint

format: ## Format code
	@echo "✨ Formatting code..."
	npm run format

type-check: ## Run TypeScript type checking
	@echo "🔍 Type checking..."
	npm run type-check

# Database Operations
db-migrate: ## Run database migrations
	@echo "🗄️  Running database migrations..."
	npm run db:migrate

db-seed: ## Seed database with test data
	@echo "🌱 Seeding database..."
	npm run db:seed

db-reset: ## Reset database
	@echo "🔄 Resetting database..."
	npm run db:reset

db-studio: ## Open Prisma Studio
	@echo "🔍 Opening Prisma Studio..."
	npm run db:studio

# Monitoring and Debugging
health: ## Run health check
	@echo "🏥 Running health check..."
	./scripts/health-check.sh

status: ## Show service status
	@echo "📊 Checking service status..."
	npm run dev:status

logs: ## View application logs
	@echo "📋 Viewing logs..."
	npm run docker:logs

logs-app: ## View application logs only
	@echo "📱 Viewing application logs..."
	npm run docker:logs:app

logs-follow: ## Follow logs in real-time
	@echo "👀 Following logs..."
	npm run docker:logs -- --follow

# Docker Operations
docker-build: ## Build Docker images
	@echo "🐳 Building Docker images..."
	npm run docker:build:dev

docker-up: ## Start Docker services
	@echo "🐳 Starting Docker services..."
	npm run docker:up:dev

docker-down: ## Stop Docker services
	@echo "🐳 Stopping Docker services..."
	npm run docker:down:dev

docker-restart: ## Restart Docker services
	@echo "🐳 Restarting Docker services..."
	npm run docker:restart

# Cleanup Operations
clean: ## Clean build artifacts and caches
	@echo "🧹 Cleaning build artifacts..."
	npm run clean
	rm -rf dist build .turbo coverage playwright-report test-results

clean-docker: ## Clean Docker resources
	@echo "🐳 Cleaning Docker resources..."
	docker system prune -f

clean-all: clean clean-docker ## Clean everything
	@echo "🧹 Cleaning everything..."
	rm -rf node_modules packages/*/node_modules

# Utility Commands
open-app: ## Open application in browser
	@echo "🌐 Opening application..."
	open http://localhost:3000

open-db: ## Open database admin
	@echo "🗄️  Opening database admin..."
	open http://localhost:8080

open-email: ## Open email testing interface
	@echo "📧 Opening email testing..."
	open http://localhost:8025

open-redis: ## Open Redis admin
	@echo "🔍 Opening Redis admin..."
	open http://localhost:8081

open-all: ## Open all development interfaces
	@echo "🌐 Opening all development interfaces..."
	open http://localhost:3000
	open http://localhost:8080
	open http://localhost:8025
	open http://localhost:8081
	open http://localhost:5555

# Development Workflow Shortcuts
quick-start: setup start open-app ## Complete setup and start (new developers)

daily-start: start open-app ## Daily development start

daily-stop: stop ## Daily development stop

# CI/CD Simulation
ci-test: lint type-check test ## Run CI-like tests locally

pre-commit: format lint type-check test-unit ## Pre-commit checks

# Help for specific areas
help-docker: ## Show Docker-related commands
	@echo "Docker Commands:"
	@echo "  make docker-build    # Build Docker images"
	@echo "  make docker-up       # Start Docker services"
	@echo "  make docker-down     # Stop Docker services"
	@echo "  make docker-restart  # Restart Docker services"

help-test: ## Show testing commands
	@echo "Testing Commands:"
	@echo "  make test            # Run all tests"
	@echo "  make test-unit       # Run unit tests"
	@echo "  make test-e2e        # Run E2E tests"
	@echo "  make test-properties # Run property-based tests"
	@echo "  make test-watch      # Run tests in watch mode"
	@echo "  make test-coverage   # Run tests with coverage"

help-db: ## Show database commands
	@echo "Database Commands:"
	@echo "  make db-migrate      # Run migrations"
	@echo "  make db-seed         # Seed database"
	@echo "  make db-reset        # Reset database"
	@echo "  make db-studio       # Open Prisma Studio"