#!/bin/bash

# Demo User Creation Script for Signtusk
# This script sets up demo users for testing and development

set -e

echo "🚀 Signtusk - Demo User Setup"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if database is running
echo "🔍 Checking database connection..."
if ! npm run with:env -- npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    echo "❌ Database connection failed. Please ensure:"
    echo "   1. Docker services are running: npm run dev:services"
    echo "   2. Database is accessible at the configured URL"
    exit 1
fi

echo "✅ Database connection successful"

# Run database migrations
echo "🔄 Running database migrations..."
npm run prisma:migrate-dev

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npm run prisma:generate

# Run the demo user creation script
echo "🔄 Creating demo users..."
npm run with:env -- npx tsx scripts/create-demo-user.ts

echo ""
echo "🎉 Demo setup complete!"
echo ""
echo "📋 Quick Start:"
echo "   1. npm run dev"
echo "   2. Open http://localhost:3000"
echo "   3. Sign in with demo credentials shown above"
echo ""