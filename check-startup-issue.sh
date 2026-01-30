#!/bin/bash

echo "🔍 Checking for startup issues..."
echo ""

# Get container ID
CONTAINER_ID=$(docker ps -q --filter "ancestor=signtusk:latest" | head -1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No running container found"
    echo "Checking stopped containers:"
    docker ps -a | grep signtusk
    exit 1
fi

echo "✅ Container ID: $CONTAINER_ID"
echo ""

# Check if process is running
echo "1️⃣ Checking if Node.js process is running..."
docker exec "$CONTAINER_ID" sh -c "ps aux | grep node" || echo "No node process found"
echo ""

# Check if port 3000 is listening
echo "2️⃣ Checking if port 3000 is listening..."
docker exec "$CONTAINER_ID" sh -c "netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000 || echo 'Port 3000 not listening'"
echo ""

# Try to curl the health endpoint from inside container
echo "3️⃣ Testing health endpoint from inside container..."
docker exec "$CONTAINER_ID" sh -c "curl -v http://localhost:3000/health 2>&1" || echo "Health check failed"
echo ""

# Check recent logs for errors
echo "4️⃣ Checking for errors in logs..."
docker logs "$CONTAINER_ID" 2>&1 | grep -i "error\|exception\|failed\|fatal" | tail -20
echo ""

# Check environment variables
echo "5️⃣ Checking critical environment variables..."
docker exec "$CONTAINER_ID" sh -c "env | grep -E '^(DATABASE_URL|PORT|NODE_ENV|HOSTNAME|NEXTAUTH_URL|NEXT_PUBLIC_WEBAPP_URL)=' | sed 's/=.*/=***REDACTED***/'"
echo ""

# Check if build artifacts exist
echo "6️⃣ Checking if build artifacts exist..."
docker exec "$CONTAINER_ID" sh -c "ls -lh build/server/main.js 2>&1"
echo ""

# Get full logs
echo "7️⃣ Full container logs (last 100 lines)..."
docker logs --tail 100 "$CONTAINER_ID" 2>&1
echo ""

echo "✅ Check complete!"
