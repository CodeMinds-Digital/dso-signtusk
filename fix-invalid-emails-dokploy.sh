#!/bin/bash

# Fix Invalid Emails in Dokploy PostgreSQL Database
# This script connects to your Dokploy PostgreSQL instance and fixes invalid emails

set -e

echo "=================================================="
echo "Fix Invalid Emails - Dokploy PostgreSQL"
echo "=================================================="
echo ""

# Database connection details
DB_HOST="dsosigntusk-dsodb-hwrqbp"
DB_PORT="5432"
DB_NAME="dso"
DB_USER="admin"
DB_PASSWORD="hl44uy2yogavlaql"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "📊 Step 1: Checking for invalid emails..."
echo ""

# Check for invalid emails
INVALID_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM \"User\" 
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%.%';
" 2>/dev/null || echo "0")

INVALID_COUNT=$(echo $INVALID_COUNT | xargs)

echo "Found $INVALID_COUNT users with invalid emails"
echo ""

if [ "$INVALID_COUNT" = "0" ]; then
    echo "✅ No invalid emails found! Database is clean."
    exit 0
fi

echo "⚠️  Found $INVALID_COUNT invalid email(s)"
echo ""
echo "📋 Showing invalid emails:"
echo ""

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT id, name, email, \"emailVerified\", \"createdAt\"
FROM \"User\" 
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%.%'
LIMIT 10;
"

echo ""
echo "=================================================="
echo "🔧 Step 2: Fixing invalid emails..."
echo "=================================================="
echo ""
echo "This will update invalid emails to: invalid_{id}@placeholder.local"
echo ""
read -p "Do you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Aborted by user"
    exit 1
fi

echo ""
echo "Applying fix..."
echo ""

# Run the fix
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Fix invalid emails in User table
UPDATE "User"
SET email = CONCAT('invalid_', id, '@placeholder.local')
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%.%';

-- Show results
SELECT 'Users updated:' as status, COUNT(*) as count
FROM "User"
WHERE email LIKE 'invalid_%@placeholder.local';
EOF

echo ""
echo "=================================================="
echo "✅ Step 3: Verifying fix..."
echo "=================================================="
echo ""

# Verify no invalid emails remain
REMAINING=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM \"User\" 
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%.%';
" 2>/dev/null || echo "0")

REMAINING=$(echo $REMAINING | xargs)

if [ "$REMAINING" = "0" ]; then
    echo "✅ SUCCESS! All invalid emails have been fixed."
    echo ""
    echo "📊 Summary:"
    echo "   - Invalid emails found: $INVALID_COUNT"
    echo "   - Invalid emails remaining: $REMAINING"
    echo "   - Status: ✅ FIXED"
else
    echo "⚠️  WARNING: $REMAINING invalid emails still remain"
    echo "   Please check the database manually"
fi

echo ""
echo "=================================================="
echo "🔍 Step 4: Checking Recipients table..."
echo "=================================================="
echo ""

# Check recipients with invalid emails
INVALID_RECIPIENTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM \"Recipient\" 
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%.%';
" 2>/dev/null || echo "0")

INVALID_RECIPIENTS=$(echo $INVALID_RECIPIENTS | xargs)

if [ "$INVALID_RECIPIENTS" = "0" ]; then
    echo "✅ No invalid emails in Recipient table"
else
    echo "⚠️  Found $INVALID_RECIPIENTS recipients with invalid emails"
    echo ""
    echo "Showing invalid recipient emails:"
    echo ""
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT id, name, email, role, \"sendStatus\", \"createdAt\"
    FROM \"Recipient\" 
    WHERE email IS NULL 
       OR email = '' 
       OR email NOT LIKE '%@%'
       OR email NOT LIKE '%.%'
    LIMIT 10;
    "
    
    echo ""
    read -p "Fix recipient emails too? (yes/no): " FIX_RECIPIENTS
    
    if [ "$FIX_RECIPIENTS" = "yes" ]; then
        echo ""
        echo "Fixing recipient emails..."
        
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Fix invalid emails in Recipient table
UPDATE "Recipient"
SET email = CONCAT('invalid_recipient_', id, '@placeholder.local')
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%.%';

-- Show results
SELECT 'Recipients updated:' as status, COUNT(*) as count
FROM "Recipient"
WHERE email LIKE 'invalid_recipient_%@placeholder.local';
EOF
        
        echo ""
        echo "✅ Recipient emails fixed"
    fi
fi

echo ""
echo "=================================================="
echo "✅ COMPLETE!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Restart your application to clear any caches"
echo "2. Test email functionality"
echo "3. Monitor for any TRPC validation errors"
echo ""
echo "If you see TRPC errors, run this script again to check for new invalid emails"
echo ""
