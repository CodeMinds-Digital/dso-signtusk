#!/bin/bash

echo "🔍 Detailed 502 Debugging..."
echo ""

# Find container
CONTAINER_ID=$(docker ps -q | head -1)
if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No running containers found!"
    echo "All containers:"
    docker ps -a
    exit 1
fi

echo "📦 Container ID: $CONTAINER_ID"
echo ""

# 1. Check if Node.js is running
echo "1️⃣ Is Node.js process running?"
docker exec $CONTAINER_ID sh -c "ps aux | grep -v grep | grep node" || echo "❌ No Node.js process found!"
echo ""

# 2. Check if port 3000 is listening
echo "2️⃣ Is port 3000 listening?"
docker exec $CONTAINER_ID sh -c "netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000 || lsof -i :3000 2>/dev/null || echo '❌ Port 3000 not listening'"
echo ""

# 3. Test health endpoint from INSIDE container
echo "3️⃣ Testing /health from INSIDE container..."
docker exec $CONTAINER_ID sh -c "curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://localhost:3000/health 2>&1 || echo '❌ Health check failed'"
echo ""

# 4. Test health endpoint with verbose output
echo "4️⃣ Verbose health check..."
docker exec $CONTAINER_ID sh -c "curl -v http://localhost:3000/health 2>&1 | head -20"
echo ""

# 5. Check for errors in logs
echo "5️⃣ Checking for errors in logs..."
docker logs $CONTAINER_ID 2>&1 | grep -i "error\|exception\|failed\|fatal\|econnrefused\|eaddrinuse" | tail -20
echo ""

# 6. Get last 50 lines of logs
echo "6️⃣ Last 50 lines of container logs..."
docker logs --tail 50 $CONTAINER_ID 2>&1
echo ""

# 7. Check if build artifacts exist
echo "7️⃣ Checking build artifacts..."
docker exec $CONTAINER_ID sh -c "ls -lh build/server/main.js 2>&1 || echo '❌ main.js not found'"
docker exec $CONTAINER_ID sh -c "ls -lh build/client/ 2>&1 | head -5 || echo '❌ client build not found'"
echo ""

# 8. Check critical env vars
echo "8️⃣ Critical environment variables..."
docker exec $CONTAINER_ID sh -c "env | grep -E '^(NEXTAUTH_URL|NEXT_PUBLIC_WEBAPP_URL|DATABASE_URL|PORT|NODE_ENV)=' | sed 's/postgresql:\/\/[^@]*@/postgresql:\/\/***:***@/'"
echo ""

# 9. Try to access from host
echo "9️⃣ Testing from host machine..."
CONTAINER_PORT=$(docker port $CONTAINER_ID 3000 2>/dev/null | cut -d: -f2)
if [ -n "$CONTAINER_PORT" ]; then
    echo "Container port 3000 is mapped to host port: $CONTAINER_PORT"
    curl -s -o /dev/null -w "HTTP Status from host: %{http_code}\n" http://localhost:$CONTAINER_PORT/health 2>&1
else
    echo "⚠️  Port 3000 not exposed to host"
fi
echo ""

# 10. Check container resource usage
echo "🔟 Container resource usage..."
docker stats --no-stream $CONTAINER_ID
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "💡 Common issues:"
echo "  - If Node.js is not running: App crashed during startup"
echo "  - If port not listening: App failed to bind to port 3000"
echo "  - If health check fails from inside: App is not responding"
echo "  - If health check works inside but 502 from outside: Reverse proxy issue"
