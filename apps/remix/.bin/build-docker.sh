#!/usr/bin/env bash

# Docker build script - skips typecheck for faster builds
set -e

cd "$(dirname "$0")/.."

echo "[Build]: Generating Prisma client"
cd ../../packages/prisma
npx prisma generate
cd -

echo "[Build]: Extracting and compiling translations"
cd ../..
npm run translate
cd apps/remix

echo "[Build]: Building app (skipping typecheck)"
npx cross-env NODE_ENV=production npx react-router build

echo "[Build]: Building server"
npm run build:server

echo "[Build]: Copying files"
cp server/main.js build/server/main.js
mkdir -p build/server/hono/packages/lib
cp -r ../../packages/lib/translations build/server/hono/packages/lib/

echo "[Build]: Done!"
