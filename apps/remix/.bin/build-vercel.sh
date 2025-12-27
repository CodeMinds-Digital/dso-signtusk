#!/usr/bin/env bash

# Exit on error.
set -e

SCRIPT_DIR="$(readlink -f "$(dirname "$0")")"
WEB_APP_DIR="$SCRIPT_DIR/.."

# Store the original directory
ORIGINAL_DIR=$(pwd)

# Set up trap to ensure we return to original directory
trap 'cd "$ORIGINAL_DIR"' EXIT

cd "$WEB_APP_DIR"

start_time=$(date +%s)

echo "[Build]: Extracting and compiling translations (Vercel)"
# Try to run translations, but continue if it fails
cd ../../
if npx lingui extract --clean 2>/dev/null && npx lingui compile 2>/dev/null; then
    echo "[Build]: Translations completed successfully"
else
    echo "[Build]: Translations skipped (lingui not available)"
fi
cd "$WEB_APP_DIR"

echo "[Build]: Running typecheck"
# Run typecheck with npx
npx react-router typegen && npx tsc

echo "[Build]: Building app"
npx cross-env NODE_ENV=production npx react-router build

echo "[Build]: Building server"
npm run build:server

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