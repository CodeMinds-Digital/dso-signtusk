#!/bin/bash

# Script to Find and Fix Invalid Emails in Database
# Run this AFTER the rebuild is complete

set -e

echo "🔍 Finding Invalid Emails in Database..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if postgres container is running
if ! docker-compose ps | grep -q postgres; then
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
    echo "Start it with: docker-compose up -d"
    exit 1
fi

echo -e "${BLUE}Searching for invalid emails in User table...${NC}"
echo ""

# Find invalid emails in User table
INVALID_USERS=$(docker-compose exec -T postgres psql -U postgres -d signtusk -t -c "
SELECT COUNT(*) 
FROM \"User\" 
WHERE email NOT LIKE '%@%.%' 
   OR email NOT LIKE '%@%'
   OR email = ''
   OR email IS NULL;
" | tr -d ' ')

echo -e "Found ${YELLOW}${INVALID_USERS}${NC} invalid email(s) in User table"
echo ""

if [ "$INVALID_USERS" -gt 0 ]; then
    echo -e "${BLUE}Invalid User emails:${NC}"
    docker-compose exec -T postgres psql -U postgres -d signtusk -c "
    SELECT id, email, name, \"createdAt\" 
    FROM \"User\" 
    WHERE email NOT LIKE '%@%.%' 
       OR email NOT LIKE '%@%'
       OR email = ''
       OR email IS NULL
    ORDER BY \"createdAt\" DESC;
    "
    echo ""
fi

echo -e "${BLUE}Searching for invalid emails in Recipient table...${NC}"
echo ""

# Find invalid emails in Recipient table
INVALID_RECIPIENTS=$(docker-compose exec -T postgres psql -U postgres -d signtusk -t -c "
SELECT COUNT(*) 
FROM \"Recipient\" 
WHERE email NOT LIKE '%@%.%' 
   OR email NOT LIKE '%@%'
   OR email = ''
   OR email IS NULL;
" | tr -d ' ')

echo -e "Found ${YELLOW}${INVALID_RECIPIENTS}${NC} invalid email(s) in Recipient table"
echo ""

if [ "$INVALID_RECIPIENTS" -gt 0 ]; then
    echo -e "${BLUE}Invalid Recipient emails:${NC}"
    docker-compose exec -T postgres psql -U postgres -d signtusk -c "
    SELECT id, email, name, \"envelopeId\"
    FROM \"Recipient\"
    WHERE email NOT LIKE '%@%.%'
       OR email NOT LIKE '%@%'
       OR email = ''
       OR email IS NULL
    LIMIT 20;
    "
    echo ""
fi

# Summary
TOTAL_INVALID=$((INVALID_USERS + INVALID_RECIPIENTS))

if [ "$TOTAL_INVALID" -eq 0 ]; then
    echo -e "${GREEN}✅ No invalid emails found! Database is clean.${NC}"
    exit 0
fi

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}Found ${TOTAL_INVALID} total invalid email(s)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To fix these, you have 3 options:"
echo ""
echo -e "${GREEN}Option 1: Update to valid email${NC}"
echo "  docker-compose exec postgres psql -U postgres -d signtusk -c \\"
echo "    \"UPDATE \\\"User\\\" SET email = 'fixed@example.com' WHERE id = <id>;\""
echo ""
echo -e "${GREEN}Option 2: Delete the invalid user${NC}"
echo "  docker-compose exec postgres psql -U postgres -d signtusk -c \\"
echo "    \"DELETE FROM \\\"User\\\" WHERE id = <id>;\""
echo ""
echo -e "${GREEN}Option 3: Use Prisma Studio (GUI)${NC}"
echo "  npm run prisma:studio"
echo "  Then manually edit/delete the invalid records"
echo ""
echo -e "${YELLOW}After fixing, run this script again to verify.${NC}"
