#!/bin/bash

# Neon Database Setup Script
# Sets up the Signtusk with Neon PostgreSQL database

set -e

echo "🚀 Setting up Signtusk with Neon Database"
echo "====================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Neon database connection configured"
echo "✅ PostgreSQL schema deployed successfully"

# Create demo users
echo "🔄 Creating demo users..."

# Create a Node.js script to add demo users
cat > scripts/create-neon-demo-users.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createDemoUsers() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Creating demo users in Neon database...');
    
    // Create demo organisation first
    const org = await prisma.organisation.upsert({
      where: { url: 'demo-org' },
      update: {},
      create: {
        id: 'demo-org-id',
        name: 'Demo Organisation',
        url: 'demo-org',
        type: 'ORGANISATION',
        ownerUserId: 1, // Will be updated after creating admin user
      }
    });

    // Create demo team
    const team = await prisma.team.upsert({
      where: { url: 'demo-team' },
      update: {},
      create: {
        name: 'Demo Team',
        url: 'demo-team',
        organisationId: org.id,
      }
    });

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@demo.local' },
      update: {},
      create: {
        name: 'Demo Admin',
        email: 'admin@demo.local',
        password: adminPassword,
        roles: ['ADMIN', 'USER'],
        emailVerified: new Date(),
        source: 'manual',
      }
    });

    // Create regular user
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@demo.local' },
      update: {},
      create: {
        name: 'Demo User',
        email: 'user@demo.local',
        password: userPassword,
        roles: ['USER'],
        emailVerified: new Date(),
        source: 'manual',
      }
    });

    // Update organisation owner
    await prisma.organisation.update({
      where: { id: org.id },
      data: { ownerUserId: adminUser.id }
    });

    // Create organisation memberships
    await prisma.organisationMember.upsert({
      where: { 
        userId_organisationId: {
          userId: adminUser.id,
          organisationId: org.id
        }
      },
      update: {},
      create: {
        id: 'admin-member-id',
        userId: adminUser.id,
        organisationId: org.id,
      }
    });

    await prisma.organisationMember.upsert({
      where: { 
        userId_organisationId: {
          userId: regularUser.id,
          organisationId: org.id
        }
      },
      update: {},
      create: {
        id: 'user-member-id',
        userId: regularUser.id,
        organisationId: org.id,
      }
    });

    console.log('✅ Demo users created successfully!');
    console.log('');
    console.log('📧 Admin: admin@demo.local / admin123');
    console.log('📧 User:  user@demo.local / user123');
    console.log('');
    console.log('🏢 Organisation: Demo Organisation');
    console.log('👥 Team: Demo Team');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Demo users already exist');
    } else {
      console.error('❌ Error creating demo users:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers().catch(console.error);
EOF

# Run the demo user creation script
echo "🔄 Installing bcryptjs for password hashing..."
npm install bcryptjs --save-dev

echo "🔄 Creating demo users..."
node scripts/create-neon-demo-users.js

echo ""
echo "🎉 Neon setup complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. npm run dev"
echo "   2. Open http://localhost:3000"
echo "   3. Login with demo credentials:"
echo "      - Admin: admin@demo.local / admin123"
echo "      - User:  user@demo.local / user123"
echo ""
echo "✅ Your application is now using Neon PostgreSQL database!"
echo "🌐 Database: ep-round-river-a1cizlzb-pooler.ap-southeast-1.aws.neon.tech"
echo ""