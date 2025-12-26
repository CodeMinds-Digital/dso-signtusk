# Signtusk - Implementation

A comprehensive, enterprise-grade e-signature platform built with modern technologies and best practices.

## 🚀 Quick Start

```bash
# One-time setup
./scripts/dev-setup.sh

# Start development environment
./scripts/dev-start.sh

# Access the application
open http://localhost:3000
```

## 📋 Prerequisites

- **Docker** (v20.0+) and **Docker Compose** (v2.0+)
- **Node.js** (v18.0+) and **npm** (v9.0+)
- **Git** (v2.30+)

## 🏗️ Project Structure

This monorepo follows modern best practices with:

```
signtusk-implementation/
├── apps/                    # Applications
├── packages/               # Shared packages
│   ├── auth/              # Authentication package
│   ├── database/          # Database package with Prisma
│   ├── email/             # Email service package
│   ├── lib/               # Shared utilities
│   ├── ui/                # UI component library
│   └── ...
├── scripts/               # Development scripts
├── e2e/                   # End-to-end tests
├── test/                  # Unit and property tests
└── docker-compose.dev.yml # Development environment
```

## 🛠️ Development Environment

### Available Services

| Service | URL | Description |
|---------|-----|-------------|
| **Application** | http://localhost:3000 | Main application |
| **API Docs** | http://localhost:3000/api/docs | OpenAPI documentation |
| **Database Admin** | http://localhost:8080 | Adminer (PostgreSQL) |
| **Email Testing** | http://localhost:8025 | MailHog (email catcher) |
| **Redis Admin** | http://localhost:8081 | Redis Commander |
| **Prisma Studio** | http://localhost:5555 | Database browser |
| **Metrics** | http://localhost:9090 | Application metrics |

### Development Commands

```bash
# Environment management
npm run dev:setup          # Initial setup
npm run dev:start          # Start all services
npm run dev:stop           # Stop services
npm run dev:reset          # Reset environment

# Development workflow
npm run dev                # Start development server
npm run test               # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:e2e           # Run E2E tests
npm run lint               # Lint code
npm run format             # Format code
npm run type-check         # TypeScript checking

# Database operations
npm run db:migrate         # Run migrations
npm run db:seed            # Seed database
npm run db:studio          # Open Prisma Studio
npm run db:reset           # Reset database

# Docker operations
npm run docker:logs        # View logs
npm run docker:restart     # Restart services
npm run dev:status         # Check service status
```

## 🏛️ Architecture

Built with modern, scalable technologies:

### Core Technologies
- **TypeScript** - Type safety and developer experience
- **Turbo** - Monorepo build system with caching
- **Prisma** - Type-safe database ORM
- **React** - Frontend user interface
- **Node.js** - Backend runtime
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage

### Development Tools
- **Docker** - Containerized development environment
- **Vitest** - Fast unit testing framework
- **Playwright** - End-to-end testing
- **Fast-check** - Property-based testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

### Infrastructure
- **Docker Compose** - Multi-service orchestration
- **MailHog** - Email testing in development
- **Adminer** - Database administration
- **Redis Commander** - Redis management

## 🧪 Testing Strategy

Comprehensive testing approach with multiple layers:

### Unit Tests
```bash
npm run test:unit          # Run unit tests
npm run test:unit:watch    # Watch mode
npm run test:coverage      # Coverage report
```

### Property-Based Tests
```bash
npm run test:properties    # Run property tests
```

### End-to-End Tests
```bash
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Run with UI
```

### Test Structure
- **Unit tests**: `packages/*/src/**/*.test.ts`
- **Property tests**: `test/properties/**/*.test.ts`
- **E2E tests**: `e2e/**/*.spec.ts`
- **Test utilities**: `test/utils/` and `test/fixtures/`

## 📚 Documentation

- **[Development Guide](DEVELOPMENT.md)** - Comprehensive development setup
- **[Testing Guide](TESTING.md)** - Testing strategies and practices
- **[Contributing Guide](CONTRIBUTING.md)** - Contribution guidelines
- **[Testing Infrastructure](TESTING_INFRASTRUCTURE.md)** - Test infrastructure details

## 🎯 Implementation Progress

Following the comprehensive task list from `.kiro/specs/tasks.md` with 160+ tasks:

### ✅ Completed Phases
- **Phase 1**: Project Foundation (Tasks 1-10)
  - Monorepo structure and tooling
  - Database schema and infrastructure
  - Security middleware and environment setup
  - Shared libraries and UI components
  - Testing infrastructure
  - **Development environment configuration** ← Current task

### 🔄 Current Phase
- **Phase 2**: Authentication System (Tasks 11-25)

### 📋 Upcoming Phases
- **Phase 3**: Document Management (Tasks 26-45)
- **Phase 4**: PDF Processing & Digital Signatures (Tasks 46-65)
- **Phase 5**: Template Management & Workflow Automation (Tasks 66-80)
- **Phase 6**: Organization & Team Management (Tasks 81-95)
- And more...

## 🚀 Getting Started for Contributors

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd signtusk-implementation
   ```

2. **Run the setup script**
   ```bash
   ./scripts/dev-setup.sh
   ```

3. **Start development**
   ```bash
   ./scripts/dev-start.sh
   ```

4. **Verify setup**
   - Visit http://localhost:3000
   - Check all services are running: `npm run dev:status`
   - Run tests: `npm run test`

## 🔧 Troubleshooting

### Common Issues

**Port conflicts**: Use `./scripts/dev-stop.sh` to stop services

**Database issues**: Reset with `npm run dev:reset`

**Docker issues**: Clean with `docker system prune -f`

**Hot reloading not working**: Check file watching limits (Linux)

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed troubleshooting.

## 🤝 Contributing

1. Read the [Contributing Guide](CONTRIBUTING.md)
2. Set up the development environment
3. Create a feature branch
4. Make your changes with tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the docs/ directory
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Development**: See [DEVELOPMENT.md](DEVELOPMENT.md)

---

**Built with ❤️ for the open-source community**