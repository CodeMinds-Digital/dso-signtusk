#!/bin/bash

# Dokploy 502 Diagnostic Script
# Run this on your Dokploy server to diagnose issues

echo "=================================="
echo "Dokploy 502 Diagnostic Tool"
echo "=================================="
echo ""

# Find SignTusk container
echo "1. Finding SignTusk container..."
CONTAINER=$(docker ps -a | grep -i signtusk | head -1 | awk '{print $1}')

if [ -z "$CONTAINER" ]; then
    echo "❌ No SignTusk container found!"
    echo "   Check if deployment succeeded in Dokploy UI"
    exit 1
fi

echo "✅ Found container: $CONTAINER"
echo ""

# Check container status
echo "2. Checking container status..."
STATUS=$(docker inspect -f '{{.State.Status}}' $CONTAINER)
echo "   Status: $STATUS"

if [ "$STATUS" != "running" ]; then
    echo "❌ Container is not running!"
    echo "   Checking why it stopped..."
    echo ""
    echo "Last 30 lines of logs:"
    docker logs $CONTAINER --tail 30
    exit 1
fi

echo "✅ Container is running"
echo ""

# Check if app is listening on port 3000
echo "3. Checking if app is listening on port 3000..."
docker exec $CONTAINER sh -c "netstat -tlnp 2>/dev/null | grep 3000" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ App is listening on port 3000"
else
    echo "❌ App is NOT listening on port 3000"
    echo "   This means the app crashed or didn't start"
fi
echo ""

# Test health endpoint
echo "4. Testing /health endpoint..."
HEALTH=$(docker exec $CONTAINER curl -s http://localhost:3000/health 2>/dev/null)
if [ $? -eq 0 ] && [ ! -z "$HEALTH" ]; then
    echo "✅ Health endpoint responding: $HEALTH"
else
    echo "❌ Health endpoint not responding"
    echo "   App may have crashed or not started properly"
fi
echo ""

# Check database connection
echo "5. Checking database connection..."
docker exec $CONTAINER sh -c "npx prisma db pull --force 2>&1" | grep -q "Introspected"
if [ $? -eq 0 ]; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed"
    echo "   Check DATABASE_URL environment variable"
fi
echo ""

# Check critical environment variables
echo "6. Checking critical environment variables..."
ENV_VARS="DATABASE_URL NEXTAUTH_URL NEXTAUTH_SECRET NEXT_PRIVATE_ENCRYPTION_KEY"
for VAR in $ENV_VARS; do
    VALUE=$(docker exec $CONTAINER sh -c "echo \$$VAR" 2>/dev/null)
    if [ ! -z "$VALUE" ]; then
        echo "✅ $VAR is set"
    else
        echo "❌ $VAR is NOT set"
    fi
done
echo ""

# Show recent logs
echo "7. Recent container logs (last 30 lines):"
echo "-------------------------------------------"
docker logs $CONTAINER --tail 30
echo "-------------------------------------------"
echo ""

# Summary
echo "=================================="
echo "SUMMARY"
echo "=================================="
echo ""
echo "Container ID: $CONTAINER"
echo "Status: $STATUS"
echo ""
echo "If you see errors above, check:"
echo "1. Database connection (DATABASE_URL)"
echo "2. Environment variables in Dokploy UI"
echo "3. Neon IP allowlist (if using Neon)"
echo "4. Full logs in Dokploy UI"
echo ""
echo "For detailed troubleshooting, see:"
echo "DOKPLOY_502_TROUBLESHOOTING.md"
