#!/bin/bash

# Quick Nixpacks Test - Just verify the plan without building
# Use this for fast validation before full build

echo "🧪 Quick Nixpacks Test"
echo ""

# Check if Nixpacks is installed
if ! command -v nixpacks &> /dev/null; then
  echo "❌ Nixpacks not installed"
  echo ""
  echo "Install with: npm install -g nixpacks"
  exit 1
fi

echo "✅ Nixpacks installed: $(nixpacks --version)"
echo ""

# Check config file
if [ ! -f "nixpacks.toml" ]; then
  echo "❌ nixpacks.toml not found"
  exit 1
fi

echo "✅ nixpacks.toml found"
echo ""

# Generate and display plan
echo "📋 Generating build plan..."
echo ""

nixpacks plan . --format json | jq '.' 2>/dev/null || nixpacks plan .

echo ""
echo "✅ Plan generated successfully!"
echo ""
echo "Next steps:"
echo "  1. Run full test: ./test-nixpacks.sh"
echo "  2. Or deploy to Dokploy: Change Build Type to Nixpacks"
echo ""
