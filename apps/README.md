# Applications

This directory contains the hybrid monorepo applications for the Signtusk platform.

## Architecture

The hybrid architecture consists of:

### 📱 Apps

- **`web/`** - Next.js marketing site (Port 3000)
  - Public-facing marketing pages
  - SEO-optimized static generation
  - Built with Next.js 14+ and App Router

- **`app/`** - Remix main application (Port 3001)
  - Main application interface
  - Full-stack application with server-side rendering
  - Built with Remix v2+ (React Router v7 based)

### 🔧 Development

Each application can be developed independently:

```bash
# Start Next.js marketing site
cd apps/web && npm run dev

# Start Remix main application
cd apps/app && npm run dev

# Or use Turbo to run both
npm run dev
```

### 🏗️ Build System

The applications are integrated with the existing Turbo monorepo:

- Shared packages: `@signtusk/ui`, `@signtusk/lib`, etc.
- Unified build pipeline with dependency management
- Type-safe integration across the entire monorepo

### 🚀 Deployment

- **Next.js (web)**: Optimized for Netlify deployment
- **Remix (app)**: Optimized for Netlify deployment
- Both applications share the same backend services and packages