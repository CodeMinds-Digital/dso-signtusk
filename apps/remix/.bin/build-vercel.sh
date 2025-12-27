#!/usr/bin/env bash

# Exit on error.
set -e

SCRIPT_DIR="$(readlink -f "$(dirname "$0")")"
WEB_APP_DIR="$SCRIPT_DIR/.."

# Store the original directory
ORIGINAL_DIR=$(pwd)

# Set up trap to ensure we return to original directory
trap 'cd "$ORIGINAL_DIR"' EXIT

# Work from root directory where all dependencies are installed
cd "$WEB_APP_DIR/../../"

start_time=$(date +%s)

echo "[Build]: Extracting and compiling translations (Vercel)"
# Try to run translations, but continue if it fails
if ./node_modules/.bin/lingui extract --clean 2>/dev/null && ./node_modules/.bin/lingui compile 2>/dev/null; then
    echo "[Build]: Translations completed successfully"
else
    echo "[Build]: Translations skipped (lingui not available)"
fi

echo "[Build]: Running typecheck"
# Run typecheck from root, targeting remix
cd apps/remix
../../node_modules/.bin/react-router typegen && ../../node_modules/.bin/tsc
cd ../../

echo "[Build]: Building app"
cd apps/remix
../../node_modules/.bin/cross-env NODE_ENV=production ../../node_modules/.bin/react-router build
cd ../../

echo "[Build]: Building server"
cd apps/remix
npm run build:server
cd ../../

echo "[Build]: Copying files"
cd apps/remix
# Copy over the entry point for the server.
cp server/main.js build/server/main.js

# Copy over all web.js translations if they exist
if [ -d "../../packages/lib/translations" ]; then
    mkdir -p build/server/hono/packages/lib
    cp -r ../../packages/lib/translations build/server/hono/packages/lib/translations
    echo "[Build]: Translations copied"
else
    echo "[Build]: No translations to copy"
fi

# Time taken
end_time=$(date +%s)

echo "[Build]: Done in $((end_time - start_time)) seconds"