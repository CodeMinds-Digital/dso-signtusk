#!/bin/bash

# Simple Demo Setup (No Docker Required)
# Creates a basic demo environment using SQLite

set -e

echo "🚀 Signtusk - Simple Demo Setup"
echo "==========================================="
echo ""
echo "This setup creates a minimal demo environment without Docker."
echo "Perfect for quick testing and development!"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Use demo environment
echo "🔧 Setting up demo environment..."
cp .env.demo .env.local
echo "✅ Demo environment configured"

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npm run prisma:generate

# Push database schema (creates SQLite file)
echo "🔄 Setting up database schema..."
npm run with:env -- npx prisma db push --accept-data-loss --schema=packages/prisma/schema.prisma

# Run the simple demo setup
echo "🔄 Creating demo users..."
npm run with:env -- npx tsx scripts/simple-demo-setup.ts

echo ""
echo "🎉 Simple demo setup complete!"
echo ""
echo "📋 Quick Start:"
echo "   1. npm run dev"
echo "   2. Open http://localhost:3000"
echo "   3. Sign in with:"
echo "      • admin@demo.local / admin123 (Admin)"
echo "      • user@demo.local / user123 (User)"
echo ""
echo "💡 For full features, install Docker and run: npm run dev:services"
echo ""