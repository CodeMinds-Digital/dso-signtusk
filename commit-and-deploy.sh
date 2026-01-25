#!/bin/bash

# Commit and Deploy Script
# This script commits the Dockerfile fix and provides deployment instructions

set -e

echo "🔧 Committing Dockerfile fix..."
git add Dockerfile.production FINAL_FIX_COMMIT_NOW.md commit-and-deploy.sh

echo ""
echo "📝 Creating commit..."
git commit -m "fix: copy all workspace packages in Docker runtime - FINAL FIX

- Copy entire packages/ folder from builder stage
- Install all dependencies with --production=false  
- Fixes @react-email/render module not found error
- Ensures all workspace packages available at runtime

This fix was missing in previous commits - now properly applied."

echo ""
echo "✅ Commit created successfully!"
echo ""
echo "🚀 Pushing to GitHub..."
git push origin dokploy-deploy

echo ""
echo "✅ Pushed to GitHub successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 NEXT STEPS - DO THIS IN DOKPLOY:"
echo ""
echo "1. Go to Dokploy Dashboard"
echo "2. Select your application"
echo "3. Go to 'Advanced' or 'Settings' tab"
echo "4. Click 'Clear Build Cache' button"
echo "5. Click 'Redeploy' button"
echo ""
echo "⏱️  Build will take ~15 minutes (full rebuild)"
echo ""
echo "✅ After deployment, check logs for:"
echo "   - No 'module not found' errors"
echo "   - Server starts successfully"
echo "   - Application accessible at your domain"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 For detailed instructions, see: FINAL_FIX_COMMIT_NOW.md"
echo ""
