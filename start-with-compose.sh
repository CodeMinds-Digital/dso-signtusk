#!/bin/bash

echo "🚀 Starting Signtusk with Docker Compose..."
echo ""

# Stop any standalone containers
echo "1️⃣ Stopping standalone containers..."
docker stop $(docker ps -q) 2>/dev/null || echo "No standalone containers running"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with required variables"
    exit 1
fi

echo "2️⃣ Building and starting services..."
docker-compose up -d --build

echo ""
echo "3️⃣ Waiting for services to start..."
sleep 10

echo ""
echo "4️⃣ Checking service status..."
docker-compose ps

echo ""
echo "5️⃣ Checking app logs..."
docker-compose logs --tail 30 app

echo ""
echo "6️⃣ Testing health endpoint..."
sleep 5
curl -s http://localhost/health || curl -s http://localhost:3000/health

echo ""
echo ""
echo "✅ Services started!"
echo ""
echo "📍 Access points:"
echo "  - Direct: http://localhost:3000"
echo "  - Via nginx: http://localhost (or https://localhost if SSL configured)"
echo "  - Your domain: https://testone.intotni.com"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: docker-compose logs -f app"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart app"
