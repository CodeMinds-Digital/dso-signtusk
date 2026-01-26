#!/bin/bash

# 🚀 Deploy to Dokploy Script
# This script commits the latest changes and pushes to dokploy-deploy branch

set -e

echo "🚀 Deploying Signtusk to Dokploy..."
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Stash any uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "💾 Stashing uncommitted changes..."
    git stash push -m "Auto-stash before deploy $(date +%Y%m%d_%H%M%S)"
fi

# Switch to dokploy-deploy branch (create if doesn't exist)
if git show-ref --verify --quiet refs/heads/dokploy-deploy; then
    echo "🔄 Switching to dokploy-deploy branch..."
    git checkout dokploy-deploy
else
    echo "🆕 Creating dokploy-deploy branch..."
    git checkout -b dokploy-deploy
fi

# Merge or rebase from main/master
if git show-ref --verify --quiet refs/heads/main; then
    echo "🔀 Merging latest changes from main..."
    git merge main --no-edit || true
elif git show-ref --verify --quiet refs/heads/master; then
    echo "🔀 Merging latest changes from master..."
    git merge master --no-edit || true
fi

# Add all changes
echo "📦 Adding changes..."
git add Dockerfile.production
git add docker/start.sh
git add packages/pdf-processing/package.json
git add scripts/diagnose-document-completion.ts
git add PYTHON_BUILD_FIX.md
git add DOCUMENT_COMPLETION_FIX.md
git add FIXES_APPLIED.md
git add CURRENT_STATUS_AND_NEXT_STEPS.md
git add deploy-to-dokploy.sh

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "fix: resolve pdf-processing module error and document completion issues

- Add Python and build tools to runner stage for pkcs11js
- Fix pdf-processing package.json to point to compiled dist files
- Required for pkcs11js native module compilation
- Fixes node-gyp rebuild error during npm ci
- Resolves @react-email/render module not found error
- Fixes documents stuck in Processing state after signing
- Add diagnostic script for stuck documents
- Remove old Documenso GitHub link from startup script
- Add comprehensive deployment and troubleshooting documentation"
fi

# Push to remote
echo "🚀 Pushing to remote..."
git push origin dokploy-deploy

echo ""
echo "✅ Successfully pushed to dokploy-deploy branch!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to Dokploy Dashboard"
echo "2. Clear build cache (Advanced → Clear Build Cache)"
echo "3. Click 'Redeploy'"
echo "4. Monitor build logs"
echo "5. Check application logs after deployment"
echo ""
echo "📚 See CURRENT_STATUS_AND_NEXT_STEPS.md for detailed instructions"
echo ""
echo "🎯 Expected build time: 10-15 minutes"
echo "🎯 Expected image size: ~550-600MB"
echo ""
