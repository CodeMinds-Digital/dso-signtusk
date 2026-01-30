#!/bin/bash

echo "🧪 Testing if app is actually working..."
echo ""

CONTAINER_ID=$(docker ps -q | head -1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No running container!"
    exit 1
fi

echo "📦 Container: $CONTAINER_ID"
echo ""

# Test 1: Check from inside container
echo "1️⃣ Testing /health from INSIDE container..."
docker exec $CONTAINER_ID curl -s http://localhost:3000/health | head -20
echo ""
echo ""

# Test 2: Check if port is listening
echo "2️⃣ Checking if port 3000 is listening..."
docker exec $CONTAINER_ID sh -c "netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000"
echo ""

# Test 3: Check from host (if port is mapped)
echo "3️⃣ Testing from HOST machine..."
MAPPED_PORT=$(docker port $CONTAINER_ID 3000 2>/dev/null | cut -d: -f2)
if [ -n "$MAPPED_PORT" ]; then
    echo "Port 3000 is mapped to localhost:$MAPPED_PORT"
    echo "Testing http://localhost:$MAPPED_PORT/health ..."
    curl -s http://localhost:$MAPPED_PORT/health | head -20
    echo ""
    echo ""
    echo "Testing http://localhost:$MAPPED_PORT/signin ..."
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:$MAPPED_PORT/signin
else
    echo "⚠️  Port 3000 is NOT mapped to host!"
    echo "Run: docker run -p 3000:3000 ..."
fi
echo ""

# Test 4: Check Docker network
echo "4️⃣ Docker network info..."
docker inspect $CONTAINER_ID | grep -A 10 "NetworkSettings"
echo ""

# Test 5: Are you using a reverse proxy?
echo "5️⃣ Checking for reverse proxy..."
docker ps | grep -E "nginx|traefik|caddy|haproxy" || echo "No reverse proxy container found"
echo ""

echo "✅ Tests complete!"
echo ""
echo "💡 If health check works from inside but not from outside:"
echo "   - Check your reverse proxy configuration (nginx, traefik, etc.)"
echo "   - Verify the proxy is pointing to the correct container/port"
echo "   - Check proxy logs for errors"
echo ""
echo "💡 If you're using Dokploy/similar:"
echo "   - Check the service configuration"
echo "   - Verify port mapping is correct"
echo "   - Check if there's a load balancer in front"
