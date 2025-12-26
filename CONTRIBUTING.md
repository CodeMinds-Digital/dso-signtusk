# Contributing to DocuSign Alternative

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and configure
4. Set up database: `npm run db:setup`
5. Start development: `npm run dev`

## Code Standards

- Use TypeScript for all new code
- Follow the ESLint configuration
- Write tests for new features
- Use conventional commits
- Ensure all tests pass before submitting PR

## Project Structure

- `apps/` - Applications (web, mobile, docs, admin)
- `packages/` - Shared packages and libraries
- `tools/` - Build tools and deployment configs

## Testing

- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Type checking: `npm run type-check`

## Deployment

- Development: Automatic on push to `develop`
- Staging: Automatic on push to `main`
- Production: Manual deployment with approval