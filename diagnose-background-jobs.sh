#!/bin/bash

echo "=================================================="
echo "  BACKGROUND JOB DIAGNOSTIC SCRIPT"
echo "=================================================="
echo ""

# Get container ID
echo "1. Finding container..."
CONTAINER_ID=$(docker ps --format "{{.ID}}" | head -1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No running containers found!"
    echo "Run: docker ps"
    exit 1
fi

echo "✅ Container ID: $CONTAINER_ID"
echo ""

# Check environment variables
echo "2. Checking environment variables..."
echo "-----------------------------------"
docker exec -it $CONTAINER_ID env | grep -E "DATABASE|REDIS|JOB|WORKER|QUEUE" || echo "❌ No job-related env vars found"
echo ""

# Check startup logs
echo "3. Checking startup logs..."
echo "-----------------------------------"
docker logs $CONTAINER_ID 2>&1 | head -50
echo ""

# Check for job system
echo "4. Checking for job/worker messages..."
echo "-----------------------------------"
docker logs $CONTAINER_ID 2>&1 | grep -i "job\|worker\|queue" | head -20 || echo "❌ No job system messages found"
echo ""

# Check for seal-document
echo "5. Checking for seal-document job..."
echo "-----------------------------------"
docker logs $CONTAINER_ID 2>&1 | grep -i "seal-document" | head -10 || echo "❌ No seal-document messages found"
echo ""

# Check for errors
echo "6. Checking for errors..."
echo "-----------------------------------"
docker logs $CONTAINER_ID 2>&1 | grep -i "error" | tail -20 || echo "✅ No errors found"
echo ""

# Check package.json
echo "7. Checking package.json scripts..."
echo "-----------------------------------"
docker exec -it $CONTAINER_ID cat package.json 2>/dev/null | grep -A 15 '"scripts"' || echo "❌ Cannot read package.json"
echo ""

# Check if jobs directory exists
echo "8. Checking jobs directory..."
echo "-----------------------------------"
docker exec -it $CONTAINER_ID ls -la packages/jobs/ 2>/dev/null || echo "❌ Jobs directory not found"
echo ""

echo "=================================================="
echo "  DIAGNOSTIC COMPLETE"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Check if DATABASE_URL is set above"
echo "2. Look for 'worker' or 'job' startup messages"
echo "3. Check for any errors"
echo "4. Share this output for further diagnosis"
echo ""
