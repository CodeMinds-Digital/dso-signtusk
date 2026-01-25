#!/bin/bash

# Supabase Setup Script for Local Development
# This script helps you switch from Neon to Supabase

set -e

echo "🚀 Supabase Setup for Local Development"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env file not found!${NC}"
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

echo "📋 This script will:"
echo "  1. Backup your current .env file"
echo "  2. Update database URLs to use Supabase"
echo "  3. Comment out .env.local (to prevent overrides)"
echo "  4. Run database migrations"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Backup
BACKUP_DIR="env-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp .env "$BACKUP_DIR/.env"
echo -e "${GREEN}✓${NC} Backed up .env to $BACKUP_DIR/"

# Get Supabase connection string
echo ""
echo "🔑 Enter your Supabase connection string"
echo ""
echo "Get it from: https://app.supabase.com/project/_/settings/database"
echo "Choose: Connection pooling → Connection string"
echo ""
echo "Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
echo ""
read -p "Supabase connection string (pooled): " SUPABASE_POOLED_URL

if [ -z "$SUPABASE_POOLED_URL" ]; then
  echo -e "${RED}❌ Connection string cannot be empty!${NC}"
  exit 1
fi

# Validate format
if [[ ! "$SUPABASE_POOLED_URL" =~ ^postgresql:// ]]; then
  echo -e "${RED}❌ Invalid connection string format!${NC}"
  echo "Should start with: postgresql://"
  exit 1
fi

# Create direct connection URL (port 5432 instead of 6543)
SUPABASE_DIRECT_URL=$(echo "$SUPABASE_POOLED_URL" | sed 's/:6543\//:5432\//')

echo ""
echo "📝 Updating .env file..."

# Update .env file
# Remove existing database URLs and add new ones
sed -i.bak '/^NEXT_PRIVATE_DATABASE_URL=/d' .env
sed -i.bak '/^NEXT_PRIVATE_DIRECT_DATABASE_URL=/d' .env
sed -i.bak '/^DATABASE_URL=/d' .env

# Add Supabase URLs at the top
cat > .env.tmp << EOF
# =============================================================================
# SUPABASE DATABASE (Local Development)
# =============================================================================
NEXT_PRIVATE_DATABASE_URL="$SUPABASE_POOLED_URL"
NEXT_PRIVATE_DIRECT_DATABASE_URL="$SUPABASE_DIRECT_URL"

EOF

cat .env >> .env.tmp
mv .env.tmp .env
rm .env.bak

echo -e "${GREEN}✓${NC} Updated .env with Supabase connection"

# Handle .env.local
if [ -f ".env.local" ]; then
  echo ""
  echo "⚠️  Found .env.local file"
  echo "This file overrides .env and may interfere with Supabase setup."
  echo ""
  read -p "Backup and disable .env.local? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env.local "$BACKUP_DIR/.env.local"
    mv .env.local .env.local.disabled
    echo -e "${GREEN}✓${NC} Disabled .env.local (backed up to $BACKUP_DIR/)"
  else
    echo -e "${YELLOW}⚠️  .env.local is still active and may override Supabase settings${NC}"
  fi
fi

# Test connection
echo ""
echo "🔍 Testing Supabase connection..."

# Create test script
cat > test-connection.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.NEXT_PRIVATE_DATABASE_URL,
});

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase!');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('PostgreSQL version:', result[0].version);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

test();
EOF

# Run test
if npm run with:env -- node test-connection.js 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Connection test passed!"
  rm test-connection.js
else
  echo -e "${RED}❌ Connection test failed!${NC}"
  echo ""
  echo "Please check:"
  echo "  1. Connection string is correct"
  echo "  2. Password is correct (no special characters issues)"
  echo "  3. Supabase project is active"
  echo "  4. Your IP is allowed (check Supabase → Settings → Database → Connection pooling)"
  rm test-connection.js
  exit 1
fi

# Run migrations
echo ""
echo "🔄 Running database migrations..."
echo ""

read -p "Run migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Generating Prisma client..."
  npm run prisma:generate
  
  echo ""
  echo "Running migrations..."
  npm run prisma:migrate-dev --name init
  
  echo ""
  read -p "Seed database with test data? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run prisma:seed
  fi
fi

echo ""
echo -e "${GREEN}✅ Supabase setup complete!${NC}"
echo ""
echo "📝 Summary:"
echo "  - Database: Supabase (pooled connection)"
echo "  - Backup: $BACKUP_DIR/"
echo "  - .env: Updated with Supabase URLs"
if [ -f ".env.local.disabled" ]; then
  echo "  - .env.local: Disabled"
fi
echo ""
echo "🚀 Next steps:"
echo "  1. Start development server: npm run dev"
echo "  2. Visit: http://localhost:3000"
echo "  3. View data in Supabase Dashboard"
echo ""
echo "📖 For detailed guide, see: SUPABASE_SETUP_GUIDE.md"
echo ""

# Offer to start dev server
read -p "Start development server now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting npm run dev..."
  npm run dev
fi
