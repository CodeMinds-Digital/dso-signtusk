#!/bin/bash

# Fix Database Invalid Email and Font Routing Issues
# Run this script to diagnose and fix both issues

echo "=========================================="
echo "Fix 1: Database Invalid Email"
echo "=========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set it first:"
    echo "export DATABASE_URL='your-database-url'"
    exit 1
fi

echo "Checking for invalid emails in database..."

# Create SQL script to find and fix invalid emails
cat > /tmp/fix_emails.sql << 'EOF'
-- Find users with invalid emails
SELECT id, email, name, createdAt 
FROM "User" 
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%' 
   OR email NOT LIKE '%@%.%'
ORDER BY createdAt DESC
LIMIT 10;

-- Find recipients with invalid emails
SELECT id, email, name, documentId, createdAt
FROM "Recipient"
WHERE email IS NULL
   OR email = ''
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%@%.%'
ORDER BY createdAt DESC
LIMIT 10;

-- Find team members with invalid emails (if they have email field)
SELECT id, email, userId, teamId, createdAt
FROM "TeamMember"
WHERE email IS NOT NULL
  AND (email = '' OR email NOT LIKE '%@%' OR email NOT LIKE '%@%.%')
ORDER BY createdAt DESC
LIMIT 10;
EOF

echo ""
echo "Running diagnostic query..."
npx prisma db execute --file /tmp/fix_emails.sql --schema packages/prisma/schema.prisma

echo ""
echo "=========================================="
echo "Fix 2: Font Routing Issue"
echo "=========================================="

echo "Checking font files..."
if [ -f "apps/remix/public/fonts/inter-variablefont_opsz,wght.ttf" ]; then
    echo "✅ Font file exists: inter-variablefont_opsz,wght.ttf"
else
    echo "❌ Font file missing: inter-variablefont_opsz,wght.ttf"
fi

if [ -f "apps/remix/public/fonts/inter-italic-variablefont_opsz,wght.ttf" ]; then
    echo "✅ Font file exists: inter-italic-variablefont_opsz,wght.ttf"
else
    echo "❌ Font file missing: inter-italic-variablefont_opsz,wght.ttf"
fi

echo ""
echo "Checking CSS references..."
grep -n "inter-variablefont" apps/remix/app/app.css || echo "No CSS references found"

echo ""
echo "=========================================="
echo "Recommended Actions"
echo "=========================================="

echo ""
echo "For Invalid Emails:"
echo "1. Review the invalid emails listed above"
echo "2. Run the fix script: ./fix-invalid-emails.sql"
echo "3. Or manually update in database"

echo ""
echo "For Font Routing:"
echo "1. Fonts exist but React Router is trying to handle them"
echo "2. Static file middleware should handle fonts automatically"
echo "3. If issue persists, check nginx/proxy configuration"

echo ""
echo "Done!"
