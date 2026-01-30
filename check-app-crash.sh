#!/bin/bash

echo "🔍 Checking why app is crashing..."
echo ""

# Find the container
CONTAINER_ID=$(docker ps -aq | head -1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No containers found!"
    exit 1
fi

echo "📦 Container: $CONTAINER_ID"
echo "📊 Container Status:"
docker ps -a | grep $CONTAINER_ID
echo ""

# Get ALL logs
echo "📋 FULL Container Logs:"
echo "================================"
docker logs $CONTAINER_ID 2>&1
echo "================================"
echo ""

# Check if container is still running
if docker ps -q --filter "id=$CONTAINER_ID" | grep -q .; then
    echo "✅ Container is RUNNING"
    echo ""
    
    # Check if Node process exists
    echo "🔍 Checking Node.js process..."
    docker exec $CONTAINER_ID ps aux 2>&1 | grep -v grep | grep node || echo "❌ No Node.js process!"
    echo ""
    
    # Try to curl health from inside
    echo "🏥 Testing health endpoint from INSIDE container..."
    docker exec $CONTAINER_ID curl -v http://localhost:3000/health 2>&1 || echo "❌ Health check failed"
    echo ""
    
    # Check what's listening on ports
    echo "🔌 Checking listening ports..."
    docker exec $CONTAINER_ID netstat -tlnp 2>/dev/null || docker exec $CONTAINER_ID ss -tlnp 2>/dev/null || echo "Cannot check ports"
    echo ""
else
    echo "❌ Container is NOT running (crashed or stopped)"
    echo ""
    echo "Last 100 lines before crash:"
    docker logs --tail 100 $CONTAINER_ID 2>&1
fi

echo ""
echo "💡 Next steps:"
echo "  1. Look for 'Error', 'Exception', or 'failed' in logs above"
echo "  2. Check if Node.js process is running"
echo "  3. Verify health endpoint responds"
