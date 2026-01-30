#!/bin/bash

echo "🔨 Rebuilding Docker image with hostname fix..."
echo ""

# Stop existing container
echo "1️⃣ Stopping existing containers..."
docker stop $(docker ps -q --filter "ancestor=signtusk:latest") 2>/dev/null || echo "No running containers"
echo ""

# Rebuild image
echo "2️⃣ Building new Docker image..."
docker build -t signtusk:latest . || {
    echo "❌ Build failed!"
    exit 1
}
echo ""

# Start new container
echo "3️⃣ Starting new container..."
docker run -d \
  --name signtusk-app \
  -p 3000:3000 \
  --env-file .env \
  -e HOSTNAME=0.0.0.0 \
  signtusk:latest

CONTAINER_ID=$(docker ps -q --filter "name=signtusk-app")
echo "✅ Container started: $CONTAINER_ID"
echo ""

# Wait a bit for startup
echo "4️⃣ Waiting for app to start..."
sleep 10
echo ""

# Check logs
echo "5️⃣ Checking logs..."
docker logs --tail 30 $CONTAINER_ID
echo ""

# Test health endpoint
echo "6️⃣ Testing health endpoint..."
sleep 5
curl -s http://localhost:3000/health | jq . || curl -s http://localhost:3000/health
echo ""

echo "✅ Done! Check if app is accessible at http://localhost:3000"
