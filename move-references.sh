#!/bin/bash

# Move Reference Folders Outside Project
# This script moves reference/comparison folders outside the project directory

set -e

echo "🔍 Moving reference folders outside project..."

# Create references directory
REFS_DIR="$HOME/Desktop/ai_pair_programming/references"
mkdir -p "$REFS_DIR"

# Move documenso-main folder
if [ -d "documenso-main" ]; then
    echo "📦 Moving documenso-main folder..."
    mv documenso-main "$REFS_DIR/"
    echo "✅ Moved documenso-main to $REFS_DIR/"
else
    echo "⏭️  documenso-main folder not found (already moved?)"
fi

# Move documenso-main.zip
if [ -f "documenso-main.zip" ]; then
    echo "📦 Moving documenso-main.zip..."
    mv documenso-main.zip "$REFS_DIR/"
    echo "✅ Moved documenso-main.zip to $REFS_DIR/"
else
    echo "⏭️  documenso-main.zip not found (already moved?)"
fi

# Move other reference folders if they exist
if [ -d "dso-signtusk-working" ]; then
    echo "📦 Moving dso-signtusk-working..."
    mv dso-signtusk-working "$REFS_DIR/"
    echo "✅ Moved dso-signtusk-working to $REFS_DIR/"
fi

if [ -d "dso-pdf-sign" ]; then
    echo "📦 Moving dso-pdf-sign..."
    mv dso-pdf-sign "$REFS_DIR/"
    echo "✅ Moved dso-pdf-sign to $REFS_DIR/"
fi

echo ""
echo "✅ Done! Reference folders moved to:"
echo "   $REFS_DIR"
echo ""
echo "📁 Your project is now cleaner:"
ls -la | grep -E "^d" | grep -v "^\." | head -10
echo ""
echo "🧪 Test TypeScript scanning:"
echo "   cd apps/remix && npm run typecheck"
