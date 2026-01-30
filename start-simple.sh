#!/bin/bash

echo "🚀 Starting Signtusk (simplified - external DB)..."
echo ""

# Stop existing containers
echo "1️⃣ Stopping existing containers..."
docker-compose -f docker-compose.simple.yml down 2>/dev/null
docker stop $(docker ps -q) 2>/dev/null || true
echo ""

# Build and start
echo "2️⃣ Building and starting..."
docker-compose -f docker-compose.simple.yml up -d --build

echo ""
echo "3️⃣ Waiting for startup..."
sleep 15

echo ""
echo "4️⃣ Service status..."
docker-compose -f docker-compose.simple.yml ps

echo ""
echo "5️⃣ App logs (last 30 lines)..."
docker-compose -f docker-compose.simple.yml logs --tail 30 app

echo ""
echo "6️⃣ Testing endpoints..."
echo "Testing direct access (port 3000)..."
curl -s -o /dev/null -w "Direct (3000): HTTP %{http_code}\n" http://localhost:3000/health

echo "Testing via nginx (port 80)..."
curl -s -o /dev/null -w "Nginx (80): HTTP %{http_code}\n" http://localhost/health

echo ""
echo "✅ Done!"
echo ""
echo "📍 Access:"
echo "  - Direct: http://localhost:3000"
echo "  - Via nginx: http://localhost"
echo "  - Your domain: https://testone.intotni.com"
echo ""
echo "📋 Commands:"
echo "  - Logs: docker-compose -f docker-compose.simple.yml logs -f app"
echo "  - Stop: docker-compose -f docker-compose.simple.yml down"
echo "  - Restart: docker-compose -f docker-compose.simple.yml restart app"
