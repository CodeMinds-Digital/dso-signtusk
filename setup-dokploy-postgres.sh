#!/bin/bash

# Setup Dokploy PostgreSQL for Local Development
# This script helps you connect to Dokploy's PostgreSQL service

set -e

echo "🚀 Dokploy PostgreSQL Local Development Setup"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Warning
echo -e "${RED}⚠️  WARNING: You're about to connect to Dokploy database!${NC}"
echo ""
echo "Choose your setup:"
echo ""
echo "  1. 🟢 Separate Dev Database (Recommended)"
echo "     → Safe, isolated, perfect for development"
echo ""
echo "  2. 🟡 SSH Tunnel to Production (Use with caution)"
echo "     → Secure connection, view production data"
echo ""
echo "  3. 🔴 Direct Production Connection (Dangerous!)"
echo "     → Direct access, high risk"
echo ""
echo "  4. 🔵 Read-Only Access (Safest for production)"
echo "     → View data only, cannot modify"
echo ""
read -p "Enter choice (1-4): " choice
echo ""

# Backup current .env
BACKUP_DIR="env-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
if [ -f ".env" ]; then
  cp .env "$BACKUP_DIR/.env"
  echo -e "${GREEN}✓${NC} Backed up .env to $BACKUP_DIR/"
fi

case $choice in
  1)
    echo "🟢 Setting up Separate Dev Database"
    echo "===================================="
    echo ""
    echo "First, create a PostgreSQL service in Dokploy:"
    echo "  1. Go to Dokploy Dashboard"
    echo "  2. Click 'Create Service' → 'PostgreSQL'"
    echo "  3. Name: signtusk-dev"
    echo "  4. Set password and deploy"
    echo ""
    read -p "Have you created the dev database? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Please create the database first, then run this script again."
      exit 0
    fi
    
    echo ""
    echo "📝 Enter your Dokploy Dev Database details:"
    echo ""
    read -p "Host (e.g., your-server.com): " DB_HOST
    read -p "Port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database name [signtusk_dev]: " DB_NAME
    DB_NAME=${DB_NAME:-signtusk_dev}
    read -p "Username [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    read -sp "Password: " DB_PASS
    echo ""
    
    DB_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
    SAFE_MODE=true
    ;;
    
  2)
    echo "🟡 Setting up SSH Tunnel to Production"
    echo "======================================="
    echo ""
    echo "📝 Enter SSH tunnel details:"
    echo ""
    read -p "SSH Host (e.g., your-server.com): " SSH_HOST
    read -p "SSH User: " SSH_USER
    read -p "SSH Port [22]: " SSH_PORT
    SSH_PORT=${SSH_PORT:-22}
    echo ""
    read -p "Database Internal Host [intotnisigntusk-dso-pmlx1h]: " DB_INTERNAL_HOST
    DB_INTERNAL_HOST=${DB_INTERNAL_HOST:-intotnisigntusk-dso-pmlx1h}
    read -p "Database Name [dso]: " DB_NAME
    DB_NAME=${DB_NAME:-dso}
    read -p "Database User [admin]: " DB_USER
    DB_USER=${DB_USER:-admin}
    read -sp "Database Password: " DB_PASS
    echo ""
    
    # Test SSH connection
    echo ""
    echo "Testing SSH connection..."
    if ssh -p $SSH_PORT -o ConnectTimeout=5 $SSH_USER@$SSH_HOST exit 2>/dev/null; then
      echo -e "${GREEN}✓${NC} SSH connection successful"
    else
      echo -e "${RED}❌ SSH connection failed!${NC}"
      echo "Please check:"
      echo "  - SSH host and user are correct"
      echo "  - You have SSH key access"
      echo "  - Port $SSH_PORT is open"
      exit 1
    fi
    
    # Create tunnel script
    cat > start-dokploy-tunnel.sh << EOF
#!/bin/bash
echo "🔒 Starting SSH tunnel to Dokploy PostgreSQL..."
ssh -N -L 5433:$DB_INTERNAL_HOST:5432 -p $SSH_PORT $SSH_USER@$SSH_HOST &
SSH_PID=\$!
echo "✅ Tunnel created (PID: \$SSH_PID)"
echo "📝 Connect to: postgresql://$DB_USER:****@localhost:5433/$DB_NAME"
echo ""
echo "To stop tunnel: kill \$SSH_PID"
echo "Or run: pkill -f 'ssh.*5433:$DB_INTERNAL_HOST'"
EOF
    chmod +x start-dokploy-tunnel.sh
    
    echo ""
    echo -e "${GREEN}✓${NC} Created start-dokploy-tunnel.sh"
    echo ""
    echo "Starting tunnel..."
    ./start-dokploy-tunnel.sh
    sleep 2
    
    DB_URL="postgresql://$DB_USER:$DB_PASS@localhost:5433/$DB_NAME"
    SAFE_MODE=false
    ;;
    
  3)
    echo "🔴 Setting up Direct Production Connection"
    echo "==========================================="
    echo ""
    echo -e "${RED}⚠️  DANGER: You're connecting directly to production!${NC}"
    echo ""
    echo "Risks:"
    echo "  - Accidental data deletion"
    echo "  - Breaking production with bad queries"
    echo "  - No rollback for mistakes"
    echo ""
    read -p "Type 'I UNDERSTAND THE RISKS' to continue: " confirm
    if [ "$confirm" != "I UNDERSTAND THE RISKS" ]; then
      echo "Aborted."
      exit 0
    fi
    
    echo ""
    echo "📝 Enter production database details:"
    echo ""
    read -p "Host: " DB_HOST
    read -p "Port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database [dso]: " DB_NAME
    DB_NAME=${DB_NAME:-dso}
    read -p "User [admin]: " DB_USER
    DB_USER=${DB_USER:-admin}
    read -sp "Password: " DB_PASS
    echo ""
    
    DB_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
    SAFE_MODE=false
    ;;
    
  4)
    echo "🔵 Setting up Read-Only Access"
    echo "==============================="
    echo ""
    echo "First, create a read-only user in Dokploy PostgreSQL:"
    echo ""
    echo "psql postgresql://admin:password@host:5432/dso"
    echo ""
    echo "CREATE USER readonly_dev WITH PASSWORD 'secure_password';"
    echo "GRANT CONNECT ON DATABASE dso TO readonly_dev;"
    echo "GRANT USAGE ON SCHEMA public TO readonly_dev;"
    echo "GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_dev;"
    echo "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_dev;"
    echo ""
    read -p "Have you created the read-only user? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Please create the user first, then run this script again."
      exit 0
    fi
    
    echo ""
    echo "📝 Enter read-only user details:"
    echo ""
    read -p "Host: " DB_HOST
    read -p "Port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database [dso]: " DB_NAME
    DB_NAME=${DB_NAME:-dso}
    read -p "Read-only Username: " DB_USER
    read -sp "Password: " DB_PASS
    echo ""
    
    DB_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
    SAFE_MODE=true
    ;;
    
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

# Test connection
echo ""
echo "🔍 Testing database connection..."

# Create test script
cat > test-connection.js << EOF
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.NEXT_PRIVATE_DATABASE_URL,
});

async function test() {
  try {
    await prisma.\$connect();
    console.log('✅ Successfully connected to Dokploy PostgreSQL!');
    const result = await prisma.\$queryRaw\`SELECT version()\`;
    console.log('PostgreSQL version:', result[0].version);
    await prisma.\$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

test();
EOF

# Update .env
sed -i.bak '/^NEXT_PRIVATE_DATABASE_URL=/d' .env
sed -i.bak '/^NEXT_PRIVATE_DIRECT_DATABASE_URL=/d' .env
rm .env.bak

cat >> .env << EOF

# =============================================================================
# DOKPLOY POSTGRESQL CONNECTION
# =============================================================================
NEXT_PRIVATE_DATABASE_URL="$DB_URL"
NEXT_PRIVATE_DIRECT_DATABASE_URL="$DB_URL"
EOF

# Disable .env.local
if [ -f ".env.local" ]; then
  cp .env.local "$BACKUP_DIR/.env.local"
  mv .env.local .env.local.disabled
  echo -e "${GREEN}✓${NC} Disabled .env.local"
fi

# Test connection
export NEXT_PRIVATE_DATABASE_URL="$DB_URL"
if node test-connection.js 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Connection test passed!"
  rm test-connection.js
else
  echo -e "${RED}❌ Connection test failed!${NC}"
  echo ""
  echo "Please check:"
  echo "  1. Connection details are correct"
  echo "  2. Database is accessible from your network"
  echo "  3. Firewall allows connection"
  echo "  4. Password doesn't have special characters issues"
  rm test-connection.js
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Summary:"
echo "  - Database: Dokploy PostgreSQL"
echo "  - Connection: $(echo $DB_URL | sed 's/:.*@/:****@/')"
echo "  - Backup: $BACKUP_DIR/"

if [ "$SAFE_MODE" = false ]; then
  echo ""
  echo -e "${RED}⚠️  WARNING: You're connected to production database!${NC}"
  echo ""
  echo "Safety tips:"
  echo "  - DO NOT run migrations: npm run prisma:migrate-dev"
  echo "  - Create backups before testing"
  echo "  - Be careful with data modifications"
fi

echo ""
echo "🚀 Next steps:"
if [ $choice -eq 1 ]; then
  echo "  1. Run migrations: npm run prisma:migrate-dev"
  echo "  2. Seed database: npm run prisma:seed"
  echo "  3. Start dev server: npm run dev"
elif [ $choice -eq 2 ]; then
  echo "  1. Keep tunnel running in this terminal"
  echo "  2. Open new terminal"
  echo "  3. Start dev server: npm run dev"
  echo "  4. To restart tunnel: ./start-dokploy-tunnel.sh"
else
  echo "  1. Start dev server: npm run dev"
  echo "  2. Test carefully!"
fi

echo ""
echo "📖 For detailed guide, see: DOKPLOY_POSTGRES_LOCAL_DEV.md"
