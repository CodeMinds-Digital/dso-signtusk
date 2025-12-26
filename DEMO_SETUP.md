# Demo User Setup Guide

This guide will help you set up demo users and test the complete DocuSign Alternative workflow end-to-end.

## Quick Start

### 1. Prerequisites

Ensure you have the following running:

```bash
# Start database and services
npm run dev:services

# Verify services are running
docker ps
```

### 2. Create Demo Users

```bash
# Create all demo users with one command
npm run demo:setup
```

Or run the individual steps:

```bash
# Just create users
npm run demo:create-users

# Run demo workflows
npm run with:env -- npx tsx scripts/demo-workflow.ts
```

## Demo User Accounts

The setup creates the following demo accounts:

### 🔑 Admin Account
- **Email**: `admin@demo.docusign-alternative.com`
- **Password**: `DemoAdmin123!`
- **Role**: Administrator
- **Features**: Full system access, user management, organization settings

### 👨‍💼 Manager Account
- **Email**: `manager@demo.docusign-alternative.com`
- **Password**: `DemoManager123!`
- **Role**: Manager
- **Features**: Team management, document oversight

### 👤 Regular User Account
- **Email**: `user@demo.docusign-alternative.com`
- **Password**: `DemoUser123!`
- **Role**: Standard User
- **Features**: Document creation, signing, basic features

### 🧪 Test User (Unverified)
- **Email**: `john.doe@demo.docusign-alternative.com`
- **Password**: `JohnDoe123!`
- **Role**: Standard User
- **Features**: Test email verification flow

## Testing Workflows

### 1. Basic Authentication Flow

```bash
# Start the development server
npm run dev

# Navigate to http://localhost:3000
# Try signing in with any demo account
```

### 2. Document Creation & Signing

1. Sign in as any user
2. Navigate to Documents
3. Create a new document
4. Add recipients
5. Send for signing
6. Test the signing flow

### 3. Organization Management

1. Sign in as admin
2. Navigate to Organization settings
3. Manage users and teams
4. Test role assignments

### 4. Email Verification Flow

1. Sign in as `john.doe@demo.docusign-alternative.com`
2. Check for email verification prompt
3. Test the verification process

## Advanced Demo Scripts

### Run Complete Workflow Demo

```bash
# Demonstrates full user workflows for all demo users
npm run with:env -- npx tsx scripts/demo-workflow.ts
```

### Create Custom Demo User

```typescript
import { createDemoUser } from './scripts/create-demo-user';

const customUser = await createDemoUser({
  name: 'Custom Demo User',
  email: 'custom@demo.com',
  password: 'CustomPass123!',
  role: 'user',
  organizationType: 'personal',
  verified: true,
});
```

## Database Management

### Reset Demo Data

```bash
# Clean up and recreate demo users
npm run demo:create-users
```

### View Database

```bash
# Open Prisma Studio
npm run prisma:studio
```

### Manual Database Operations

```bash
# Reset entire database
npm run prisma:migrate-reset

# Run migrations
npm run prisma:migrate-dev

# Seed database
npm run prisma:seed
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if services are running
docker ps

# Restart services
npm run dev:services

# Check database connection
npm run with:env -- npx prisma db push
```

### User Already Exists

The demo script automatically cleans up existing demo users. If you encounter issues:

```bash
# Manually clean up
npm run with:env -- npx prisma studio
# Delete users manually, then re-run demo setup
```

### Email Verification Testing

For testing email verification:

1. Check MailHog at `http://localhost:8025`
2. Look for verification emails
3. Click verification links

## Development Tips

### Testing Different User Roles

1. **Admin Testing**: Use admin account to test system-wide features
2. **User Testing**: Use regular user account for standard workflows
3. **Unverified Testing**: Use John Doe account for email verification flows

### Document Testing

Each demo user comes with:
- Pre-created sample documents
- Appropriate organization settings
- Team memberships configured

### API Testing

Demo users can be used for API testing:

```bash
# Get user token (implement based on your auth system)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.docusign-alternative.com","password":"DemoAdmin123!"}'
```

## Security Notes

⚠️ **Important**: These are demo accounts with simple passwords. Never use these in production!

- All demo passwords follow the pattern: `Demo[Role]123!`
- Demo emails use the `@demo.docusign-alternative.com` domain
- Users are created with appropriate test flags enabled

## Next Steps

After setting up demo users:

1. **Explore the UI**: Navigate through all major features
2. **Test Workflows**: Try the complete document signing process
3. **Check Admin Features**: Use the admin account to explore system settings
4. **API Integration**: Test API endpoints with demo user tokens
5. **Customization**: Modify the demo scripts for your specific testing needs

## Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Verify all services are running with `docker ps`
3. Check database connectivity with `npm run prisma:studio`
4. Review the application logs in the development server

Happy testing! 🚀