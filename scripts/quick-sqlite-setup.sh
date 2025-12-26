#!/bin/bash

# Quick SQLite Setup for Immediate Testing
# This bypasses the need for PostgreSQL/Docker

set -e

echo "🚀 Quick SQLite Setup for Signtusk"
echo "=============================================="
echo ""
echo "This setup uses SQLite for immediate testing without Docker."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Backup original schema
echo "📋 Backing up original Prisma schema..."
cp packages/prisma/schema.prisma packages/prisma/schema.postgresql.backup

# Use SQLite schema
echo "🔄 Switching to SQLite schema..."
cp packages/prisma/schema.sqlite.prisma packages/prisma/schema.prisma

# Update environment for SQLite
echo "🔧 Configuring environment for SQLite..."
cat > .env.local << EOF
# SQLite Configuration for Quick Testing
NEXT_PRIVATE_DATABASE_URL="file:./dev.db"
NEXT_PRIVATE_DIRECT_DATABASE_URL="file:./dev.db"

# Disable Redis for now (optional)
REDIS_URL=""

# Mock SMTP (console output)
NEXT_PRIVATE_SMTP_TRANSPORT="console"
EOF

echo "✅ Environment configured for SQLite"

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npm run prisma:generate

# Create and migrate database
echo "🔄 Creating SQLite database..."
npm run with:env -- npx prisma db push --accept-data-loss --schema=packages/prisma/schema.prisma

echo ""
echo "🎉 SQLite setup complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. npm run dev"
echo "   2. Open http://localhost:3000"
echo "   3. Create users manually through the signup form"
echo ""
echo "💡 Note: This is a simplified setup for testing."
echo "   For full features, install Docker and use PostgreSQL."
echo ""
echo "🔄 To restore PostgreSQL setup later:"
echo "   cp packages/prisma/schema.postgresql.backup packages/prisma/schema.prisma"
echo ""