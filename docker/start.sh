#!/bin/sh

# 🚀 Starting Signtusk...
printf "🚀 Starting Signtusk...\n\n"

# 🔐 Check certificate configuration
printf "🔐 Checking certificate configuration...\n"

CERT_PATH="${NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH:-/opt/signtusk/cert.p12}"

if [ -f "$CERT_PATH" ] && [ -r "$CERT_PATH" ]; then
    printf "✅ Certificate file found and readable - document signing is ready!\n"
else
    printf "⚠️  Certificate not found or not readable at: $CERT_PATH\n"
    printf "💡 Tip: Signtusk will still start, but document signing will be unavailable\n"
    printf "🔧 To enable signing, mount your certificate file to: $CERT_PATH\n"
fi

printf "\n📚 Useful Links:\n"
printf "🏥 Health check: http://localhost:3000/health\n"
printf "📊 API docs: http://localhost:3000/api/swagger\n\n"

printf "🗄️  Running database migrations...\n"
npx prisma migrate deploy --schema ../../packages/prisma/schema.prisma

if [ $? -eq 0 ]; then
    printf "✅ Database migrations completed successfully\n\n"
else
    printf "❌ Database migrations failed\n"
    printf "💡 Check your DATABASE_URL environment variable\n"
    exit 1
fi

printf "🌟 Starting Signtusk server...\n"
printf "📍 Server will be available at: http://0.0.0.0:3000\n"
printf "🔧 Make sure HOSTNAME=0.0.0.0 is set for Docker\n\n"

export HOSTNAME=0.0.0.0
node build/server/main.js
