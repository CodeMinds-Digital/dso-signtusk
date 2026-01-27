# Prisma Quick Reference Card

One-page reference for Prisma database operations.

---

## 🚀 Quick Start

```bash
# Current setup (Neon) - Just run:
npm run prisma:generate && npm run prisma:migrate-deploy && npm run dev

# Switch database - Run:
./scripts/setup-prisma.sh
```

---

## 📋 Essential Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate-dev --name migration_name

# Apply migrations
npm run prisma:migrate-deploy

# View database
npm run prisma:studio

# Seed database
npm run prisma:seed

# Reset database (⚠️ deletes data)
npm run prisma:migrate-reset

# Check status
npx prisma migrate status
```

---

## 🔌 Connection Strings

### Neon (Current)

```bash
NEXT_PRIVATE_DATABASE_URL="postgresql://user:pass@host-pooler.neon.tech/db?sslmode=require"
NEXT_PRIVATE_DIRECT_DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
```

### Supabase

```bash
NEXT_PRIVATE_DATABASE_URL="postgresql://postgres.[ref]:[pass]@[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXT_PRIVATE_DIRECT_DATABASE_URL="postgresql://postgres.[ref]:[pass]@[region].pooler.supabase.com:5432/postgres"
```

### Local

```bash
NEXT_PRIVATE_DATABASE_URL="postgresql://postgres:password@localhost:5432/signtusk_dev"
NEXT_PRIVATE_DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:5432/signtusk_dev"
```

### Dokploy

```bash
NEXT_PRIVATE_DATABASE_URL="postgresql://admin:password@your-server.com:5432/dso"
NEXT_PRIVATE_DIRECT_DATABASE_URL="postgresql://admin:password@your-server.com:5432/dso"
```

---

## 🛠️ Quick Fixes

```bash
# Can't reach database
psql "your-connection-string"

# SSL required
# Add: ?sslmode=require

# Client not generated
npm run prisma:generate

# Migration failed
npx prisma migrate status
npm run prisma:migrate-reset  # ⚠️ deletes data
```

---

## 📚 Documentation

- **Quick Start:** [docs/database/PRISMA_QUICK_START.md](docs/database/PRISMA_QUICK_START.md)
- **Complete Guide:** [docs/database/PRISMA_DATABASE_SETUP.md](docs/database/PRISMA_DATABASE_SETUP.md)
- **Summary:** [docs/database/PRISMA_SETUP_SUMMARY.md](docs/database/PRISMA_SETUP_SUMMARY.md)
- **Setup Script:** `./scripts/setup-prisma.sh`

---

## 🎯 Common Workflows

### After Schema Changes

```bash
npm run prisma:generate
npm run prisma:migrate-dev --name your_change
npm run dev
```

### Switch Database

```bash
./scripts/setup-prisma.sh
# Follow prompts
```

### View Data

```bash
npm run prisma:studio
# Opens http://localhost:5555
```

---

## 💡 Pro Tips

- Use `.env.local` for local overrides
- Backup before reset: `pg_dump $NEXT_PRIVATE_DATABASE_URL > backup.sql`
- URL encode special chars: `@` → `%40`, `:` → `%3A`
- Check status: `npx prisma migrate status`

---

**Need help?** Run `./scripts/setup-prisma.sh` or read the docs!
