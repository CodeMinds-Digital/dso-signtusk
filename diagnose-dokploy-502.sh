#!/bin/bash

echo "🔍 Diagnosing Dokploy 502 Error..."
echo ""

# Find the app container (Dokploy usually prefixes with project name)
echo "1️⃣ Finding Signtusk containers..."
docker ps -a | grep -E "signtusk|remix" || docker ps -a
echo ""

# Get the app container ID
APP_CONTAINER=$(docker ps -q --filter "name=signtusk" --filter "status=running" | head -1)

if [ -z "$APP_CONTAINER" ]; then
    echo "❌ No running Signtusk container found!"
    echo ""
    echo "Checking all containers:"
    docker ps -a
    exit 1
fi

echo "✅ Found app container: $APP_CONTAINER"
echo ""

# Check if app is responding inside container
echo "2️⃣ Testing /health from INSIDE container..."
docker exec $APP_CONTAINER curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000/health 2>&1 || echo "❌ Failed"
echo ""

# Check if port is listening
echo "3️⃣ Checking if port 3000 is listening..."
docker exec $APP_CONTAINER sh -c "netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000" || echo "❌ Port not listening"
echo ""

# Check Node.js process
echo "4️⃣ Checking Node.js process..."
docker exec $APP_CONTAINER ps aux | grep -v grep | grep node || echo "❌ No Node.js process"
echo ""

# Check container logs
echo "5️⃣ Container logs (last 50 lines)..."
docker logs --tail 50 $APP_CONTAINER 2>&1
echo ""

# Check Traefik (Dokploy's reverse proxy)
echo "6️⃣ Checking Traefik (Dokploy's reverse proxy)..."
TRAEFIK_CONTAINER=$(docker ps -q --filter "name=traefik" | head -1)
if [ -n "$TRAEFIK_CONTAINER" ]; then
    echo "✅ Traefik container: $TRAEFIK_CONTAINER"
    echo ""
    echo "Traefik logs (last 30 lines)..."
    docker logs --tail 30 $TRAEFIK_CONTAINER 2>&1 | grep -i "error\|502\|signtusk" || echo "No relevant errors"
else
    echo "⚠️  No Traefik container found"
fi
echo ""

# Check Docker networks
echo "7️⃣ Checking Docker networks..."
docker network ls | grep -E "dokploy|signtusk|traefik"
echo ""

# Check if app is on the same network as Traefik
echo "8️⃣ Checking network connectivity..."
if [ -n "$TRAEFIK_CONTAINER" ]; then
    APP_NETWORKS=$(docker inspect $APP_CONTAINER | grep -A 10 "Networks" | grep "Name" | cut -d'"' -f4)
    TRAEFIK_NETWORKS=$(docker inspect $TRAEFIK_CONTAINER | grep -A 10 "Networks" | grep "Name" | cut -d'"' -f4)
    
    echo "App networks: $APP_NETWORKS"
    echo "Traefik networks: $TRAEFIK_NETWORKS"
    
    # Check if they share a network
    for net in $APP_NETWORKS; do
        if echo "$TRAEFIK_NETWORKS" | grep -q "$net"; then
            echo "✅ Both on network: $net"
        fi
    done
fi
echo ""

# Check Traefik labels on app container
echo "9️⃣ Checking Traefik labels..."
docker inspect $APP_CONTAINER | grep -A 20 "Labels" | grep traefik || echo "⚠️  No Traefik labels found"
echo ""

# Test from Traefik to app
echo "🔟 Testing connectivity from Traefik to app..."
if [ -n "$TRAEFIK_CONTAINER" ]; then
    docker exec $TRAEFIK_CONTAINER wget -q -O- http://$APP_CONTAINER:3000/health 2>&1 || \
    docker exec $TRAEFIK_CONTAINER curl -s http://$APP_CONTAINER:3000/health 2>&1 || \
    echo "❌ Cannot reach app from Traefik"
fi
echo ""

echo "✅ Diagnosis complete!"
echo ""
echo "💡 Common Dokploy 502 causes:"
echo "  1. App not listening on 0.0.0.0:3000 (should be fixed now)"
echo "  2. App and Traefik not on same Docker network"
echo "  3. Traefik labels missing or incorrect"
echo "  4. App crashed after startup (check logs above)"
echo "  5. Port 3000 not exposed in Dockerfile"
echo ""
echo "🔧 Next steps:"
echo "  - If health check works inside but not from Traefik: Network issue"
echo "  - If Node.js not running: App crashed (check logs)"
echo "  - If port not listening: App failed to start"
