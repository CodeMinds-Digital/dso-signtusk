# @signtusk/database

Database schema and migrations for the Signtusk e-signature platform.

## Overview

This package provides:
- Comprehensive Prisma schema for all e-signature workflows
- Database client with connection pooling and optimization
- Type-safe validation schemas using Zod
- Seed data for development and testing
- Property-based tests for schema integrity

## Features

### Database Schema

The schema includes all entities required for a complete e-signature platform:

- **User Management**: Users, organizations, teams, roles, and permissions
- **Authentication**: Sessions, API tokens, 2FA, passkeys, and OAuth
- **Document Management**: Documents, folders, versions, sharing, and metadata
- **PDF Processing**: Document fields, form elements, and positioning
- **Signing Workflow**: Signing requests, recipients, signatures, and workflow state
- **Template System**: Reusable templates with fields and recipient roles
- **Analytics**: Document and template usage analytics
- **Integrations**: Webhooks, third-party integrations, and API management
- **Billing**: Subscriptions, usage tracking, and billing management
- **Audit Trail**: Comprehensive audit logging and activity tracking

### Key Features

- **Multi-tenant Architecture**: Complete data isolation between organizations
- **Role-based Access Control**: Hierarchical permissions and team management
- **Comprehensive Audit Trail**: Immutable logging of all system actions
- **Advanced Field Types**: Support for signatures, text, dates, checkboxes, and more
- **Workflow Engine**: Sequential, parallel, and conditional signing workflows
- **Template Management**: Reusable document templates with sharing capabilities
- **Analytics Integration**: Built-in tracking for usage and performance metrics

### Migration System

The database includes a comprehensive migration system with:

- **File-based migrations**: SQL migration files with version control
- **Migration tracking**: Immutable migration history with checksums
- **Rollback support**: Safe rollback capabilities for development
- **Status monitoring**: Migration status and health checking

### Audit Trail & Compliance

The audit trail system meets strict immutable logging requirements:

- **Cryptographic Integrity**: Each audit event includes SHA-256 hash for verification
- **Immutable Storage**: Audit events cannot be modified after creation
- **Complete Traceability**: All system actions logged with full context
- **Compliance Ready**: Supports SOC 2, GDPR, and regulatory requirements
- **Long-term Retention**: 7-year default retention with compression support

## Installation

```bash
npm install @signtusk/database
```

## Usage

### Database Client

```typescript
import { prisma, connectDatabase, withTransaction } from '@signtusk/database';

// Connect to database
await connectDatabase();

// Basic usage
const users = await prisma.user.findMany();

// Using transactions
await withTransaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com', name: 'John Doe', organizationId: 'org_id' }
  });
  
  await tx.auditEvent.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      entityType: 'user',
      entityId: user.id,
      action: 'create',
      details: { email: user.email }
    }
  });
});
```

### Validation Schemas

```typescript
import { CreateUserSchema, CreateDocumentSchema } from '@signtusk/database';

// Validate user input
const userResult = CreateUserSchema.safeParse({
  email: 'user@example.com',
  name: 'John Doe',
  organizationId: 'org_123'
});

if (userResult.success) {
  const user = await prisma.user.create({ data: userResult.data });
}
```

### Type Safety

```typescript
import type { User, Document, SigningRequest } from '@signtusk/database';

// All Prisma types are re-exported for convenience
function processUser(user: User) {
  console.log(`Processing user: ${user.name} (${user.email})`);
}
```

## Development

### Database Setup

1. Set up your database URL:
```bash
cp .env.example .env
# Edit .env with your database connection string
```

2. Generate Prisma client:
```bash
npm run db:generate
```

3. Run migrations:
```bash
# Using Prisma migrations (recommended for development)
npm run db:migrate

# Using custom migration system (for production)
npm run db:migrate:run

# Check migration status
npm run db:migrate:status

# Rollback last migration (development only)
npm run db:migrate:rollback
```

4. Seed development data:
```bash
npm run db:seed
```

### Available Scripts

- `npm run build` - Build TypeScript files
- `npm run dev` - Watch mode for development
- `npm run test` - Run property-based tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed development data
- `npm run db:studio` - Open Prisma Studio

### Testing

The package includes comprehensive property-based tests that verify:

- Schema validation correctness
- Data integrity constraints
- Relationship enforcement
- Input sanitization
- Type safety

Run tests with:
```bash
npm test
```

## Schema Design Principles

### Data Integrity

- All foreign key relationships are properly constrained
- Unique constraints prevent data duplication
- Audit trails are immutable and comprehensive
- Soft deletes preserve data integrity

### Performance

- Strategic indexing on frequently queried fields
- Connection pooling for optimal database usage
- Efficient pagination support
- Optimized query patterns

### Security

- Input validation at the schema level
- Audit logging for all sensitive operations
- Role-based access control enforcement
- Secure session and token management

### Scalability

- Multi-tenant architecture with data isolation
- Efficient bulk operations support
- Horizontal scaling considerations
- Performance monitoring capabilities

## Environment Variables

```bash
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Optional: separate URLs for different environments
DEV_DATABASE_URL="postgresql://..."
TEST_DATABASE_URL="postgresql://..."
PROD_DATABASE_URL="postgresql://..."

# Connection pool settings
DATABASE_POOL_SIZE=10
DATABASE_POOL_TIMEOUT=20000
```

## Contributing

When making changes to the schema:

1. Create a new migration: `npm run db:migrate`
2. Update seed data if necessary
3. Run tests to ensure integrity: `npm test`
4. Update documentation as needed

## License

This package is part of the Signtusk project and follows the same licensing terms.