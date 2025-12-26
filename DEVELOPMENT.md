# Development Environment Guide

This guide provides comprehensive instructions for setting up and working with the DocuSign Alternative development environment.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Available Services](#available-services)
- [Debugging](#debugging)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Quick Start

For the fastest setup, run our automated setup script:

```bash
# One-time setup
./scripts/dev-setup.sh

# Start development environment
./scripts/dev-start.sh

# Access the application
open http://localhost:3000
```

## Prerequisites

### Required Software

- **Docker** (v20.0+) and **Docker Compose** (v2.0+)
- **Node.js** (v18.0+) and **npm** (v9.0+)
- **Git** (v2.30+)

### System Requirements

- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 10GB free space for Docker images and data
- **Network**: Internet connection for downloading dependencies

### Installation

#### macOS (using Homebrew)
```bash
# Install Docker Desktop
brew install --cask docker

# Install Node.js
brew install node

# Verify installations
docker --version
node --version
npm --version
```

#### Ubuntu/Debian
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

#### Windows
1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
2. Install [Node.js](https://nodejs.org/en/download/)
3. Use Git Bash or WSL2 for running scripts

## Environment Setup

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd docusign-alternative-implementation

# Run automated setup
./scripts/dev-setup.sh
```

### 2. Environment Configuration

The setup script creates several environment files:

- **`.env.development`** - Main development configuration
- **`.env.local`** - Local overrides (git-ignored)
- **`.env.example`** - Template for new environments

#### Key Configuration Options

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/docusign_alternative_dev

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=development-jwt-secret-that-is-long-enough-for-validation
ENCRYPTION_KEY=development-encryption-key-32-chars

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_EXPERIMENTAL_FEATURES=true

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

### 3. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Install dependencies
npm ci

# Copy environment file
cp .env.example .env.development

# Start infrastructure services
docker-compose -f docker-compose.dev.yml up -d database redis

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev
```

## Development Workflow

### Starting Development

```bash
# Start everything (recommended for first-time)
./scripts/dev-start.sh

# Start only infrastructure services
./scripts/dev-start.sh services

# Start only the application (if services are running)
./scripts/dev-start.sh app

# Start in background (detached mode)
./scripts/dev-start.sh full true
```

### Daily Development Commands

```bash
# Check service status
npm run dev:status

# View logs
npm run docker:logs
npm run docker:logs:app  # App logs only

# Restart services
npm run docker:restart
npm run docker:restart:app  # App only

# Run tests
npm run test
npm run test:watch
npm run test:e2e

# Code quality
npm run lint
npm run format
npm run type-check
```

### Stopping Development

```bash
# Stop services only
./scripts/dev-stop.sh

# Stop and remove containers
./scripts/dev-stop.sh true

# Stop and remove everything including data
./scripts/dev-stop.sh true true
```

## Available Services

When the development environment is running, these services are available:

| Service | URL | Description |
|---------|-----|-------------|
| **Application** | http://localhost:3000 | Main application |
| **API Documentation** | http://localhost:3000/api/docs | OpenAPI/Swagger docs |
| **Health Check** | http://localhost:3000/health | Service health status |
| **Database Admin** | http://localhost:8080 | Adminer (DB management) |
| **Email Testing** | http://localhost:8025 | MailHog (email catcher) |
| **Redis Admin** | http://localhost:8081 | Redis Commander |
| **Prisma Studio** | http://localhost:5555 | Database browser |
| **Metrics** | http://localhost:9090 | Application metrics |

### Service Credentials

- **Database**: `postgres` / `password`
- **Adminer**: Use database credentials above
- **Redis**: No authentication required in development

## Debugging

### VS Code Setup

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug App",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Debug Commands

```bash
# Start with debugging enabled
npm run dev:debug

# Inspect running application
npm run debug:inspect

# View debug logs
npm run debug:logs
```

### Browser DevTools

The application supports React DevTools and Redux DevTools when running in development mode.

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run with coverage
npm run test:coverage

# Run property-based tests
npm run test:properties
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts
```

### Test Database

Tests use a separate database (`docusign_alternative_test`) that is automatically created and managed.

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill $(lsof -ti:3000)

# Or use our stop script
./scripts/dev-stop.sh
```

#### Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.dev.yml ps database

# Restart database
docker-compose -f docker-compose.dev.yml restart database

# Reset database
npm run dev:reset
```

#### Docker Issues
```bash
# Clean Docker system
docker system prune -f

# Rebuild containers
docker-compose -f docker-compose.dev.yml build --no-cache

# Complete reset
./scripts/dev-reset.sh nuclear
```

#### Hot Reloading Not Working
```bash
# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Restart with polling enabled
CHOKIDAR_USEPOLLING=true npm run dev
```

### Reset Options

```bash
# Soft reset (database and cache only)
./scripts/dev-reset.sh soft

# Hard reset (containers and volumes)
./scripts/dev-reset.sh hard

# Nuclear reset (everything including node_modules)
./scripts/dev-reset.sh nuclear
```

### Getting Help

1. **Check logs**: `npm run docker:logs`
2. **Verify configuration**: `npm run config:validate`
3. **Check service health**: `npm run health:check`
4. **Reset environment**: `./scripts/dev-reset.sh`

## Advanced Configuration

### Custom Environment Variables

Add custom variables to `.env.local`:

```bash
# Custom API endpoints
EXTERNAL_API_URL=http://localhost:8000

# Custom feature flags
ENABLE_CUSTOM_FEATURE=true

# Custom logging
LOG_LEVEL=trace
LOG_DESTINATION=file
```

### Performance Tuning

#### Docker Resource Limits

Edit `docker-compose.dev.yml` to adjust resource limits:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

#### Node.js Optimization

```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable performance monitoring
export NODE_ENV=development
export DEBUG=*
```

### Database Configuration

#### Custom Database Settings

```bash
# Use external database
DATABASE_URL=postgresql://user:pass@external-db:5432/dbname

# Enable query logging
DATABASE_LOGGING=true
```

#### Multiple Databases

```yaml
# docker-compose.dev.yml
services:
  test-database:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: docusign_alternative_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5433:5432"
```

### Monitoring and Observability

#### Application Metrics

- **Prometheus metrics**: http://localhost:9090/metrics
- **Health checks**: http://localhost:3000/health
- **Performance monitoring**: Built-in APM

#### Log Aggregation

```bash
# Centralized logging
docker-compose -f docker-compose.dev.yml logs -f --tail=100

# Application-specific logs
docker-compose -f docker-compose.dev.yml logs -f app

# Database logs
docker-compose -f docker-compose.dev.yml logs -f database
```

## Development Best Practices

### Code Quality

1. **Always run linting**: `npm run lint`
2. **Format code**: `npm run format`
3. **Type checking**: `npm run type-check`
4. **Write tests**: Aim for >80% coverage

### Git Workflow

1. **Feature branches**: Create branches from `main`
2. **Commit messages**: Use conventional commits
3. **Pre-commit hooks**: Automatically run linting and formatting
4. **Pull requests**: Required for all changes

### Performance

1. **Hot reloading**: Enabled by default
2. **Incremental builds**: Turbo handles caching
3. **Lazy loading**: Implement for large components
4. **Bundle analysis**: Use webpack-bundle-analyzer

### Security

1. **Environment variables**: Never commit secrets
2. **Dependencies**: Regularly update and audit
3. **HTTPS**: Use in production-like environments
4. **Authentication**: Test with real OAuth providers

## Contributing

1. **Setup development environment**: Follow this guide
2. **Read contributing guidelines**: See `CONTRIBUTING.md`
3. **Follow coding standards**: Use provided ESLint/Prettier config
4. **Write tests**: Include unit and integration tests
5. **Update documentation**: Keep docs current with changes

## Support

- **Documentation**: Check `README.md` and other docs
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Code review**: All changes require review

---

**Happy coding! 🚀**