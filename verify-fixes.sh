#!/bin/bash

# Verification Script for All Fixes
# Run this to check if all fixes are properly deployed

set -e

echo "=========================================="
echo "🔍 Verifying All Fixes"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# Check 1: Email fix files
echo "Check 1: Email Rendering Fix"
echo "----------------------------"

if [ -f "packages/email/render-with-i18n-wrapper.tsx" ]; then
    if grep -q "useCallback" packages/email/render-with-i18n-wrapper.tsx; then
        print_success "Email fix file has useCallback patch"
    else
        print_error "Email fix file missing useCallback patch"
    fi
    
    if grep -q "useMemo" packages/email/render-with-i18n-wrapper.tsx; then
        print_success "Email fix file has useMemo patch"
    else
        print_error "Email fix file missing useMemo patch"
    fi
    
    if grep -q "useEffect" packages/email/render-with-i18n-wrapper.tsx; then
        print_success "Email fix file has useEffect patch"
    else
        print_error "Email fix file missing useEffect patch"
    fi
else
    print_error "Email fix file not found"
fi

echo ""

# Check 2: Font routing fix
echo "Check 2: Font Routing Fix"
echo "-------------------------"

if [ -f "apps/remix/server/middleware.ts" ]; then
    if grep -q "/fonts/" apps/remix/server/middleware.ts; then
        print_success "Middleware has /fonts/ exclusion"
    else
        print_error "Middleware missing /fonts/ exclusion"
    fi
else
    print_error "Middleware file not found"
fi

echo ""

# Check 3: Font files exist
echo "Check 3: Font Files"
echo "------------------"

FONTS=(
    "inter-variablefont_opsz,wght.ttf"
    "inter-italic-variablefont_opsz,wght.ttf"
    "caveat-variablefont_wght.ttf"
    "noto-sans.ttf"
)

for font in "${FONTS[@]}"; do
    if [ -f "apps/remix/public/fonts/$font" ]; then
        SIZE=$(ls -lh "apps/remix/public/fonts/$font" | awk '{print $5}')
        print_success "Font exists: $font ($SIZE)"
    else
        print_error "Font missing: $font"
    fi
done

echo ""

# Check 4: Database fix script
echo "Check 4: Database Fix"
echo "--------------------"

if [ -f "fix-invalid-emails.sql" ]; then
    print_success "Database fix SQL exists"
else
    print_error "Database fix SQL not found"
fi

if [ -f "fix-database-and-fonts.sh" ]; then
    print_success "Diagnostic script exists"
else
    print_error "Diagnostic script not found"
fi

echo ""

# Check 5: Build status
echo "Check 5: Build Status"
echo "--------------------"

if [ -d "apps/remix/build" ]; then
    print_success "Build directory exists"
    
    if [ -f "apps/remix/build/server/index.js" ]; then
        print_success "Server build exists"
    else
        print_warning "Server build not found"
    fi
    
    if [ -d "apps/remix/build/client" ]; then
        print_success "Client build exists"
    else
        print_warning "Client build not found"
    fi
    
    # Check for new email fix hash
    if find apps/remix/build -name "*render-email-with-i18n*.js" | grep -q .; then
        HASH_FILE=$(find apps/remix/build -name "*render-email-with-i18n*.js" | head -1)
        print_success "Email fix built: $(basename $HASH_FILE)"
    else
        print_warning "Email fix build not found"
    fi
else
    print_error "Build directory not found - need to build"
fi

echo ""

# Check 6: Docker status
echo "Check 6: Docker Status"
echo "---------------------"

if docker ps | grep -q signtusk-app; then
    print_success "Container is running"
    
    # Check container logs for errors
    ERROR_COUNT=$(docker logs signtusk-app 2>&1 | grep -i "error" | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        print_success "No errors in container logs"
    else
        print_warning "Found $ERROR_COUNT error messages in logs"
    fi
    
    # Check for new build hash in logs
    if docker logs signtusk-app 2>&1 | grep -q "render-email-with-i18n-B7Kv0dtl.js"; then
        print_success "New email fix deployed (B7Kv0dtl)"
    elif docker logs signtusk-app 2>&1 | grep -q "render-email-with-i18n"; then
        print_warning "Email fix deployed but different hash"
    else
        print_warning "Could not verify email fix in logs"
    fi
else
    print_warning "Container not running"
fi

echo ""

# Check 7: Font loading (if container is running)
echo "Check 7: Font Loading"
echo "--------------------"

if docker ps | grep -q signtusk-app; then
    for font in "${FONTS[@]}"; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/fonts/$font" 2>/dev/null || echo "000")
        if [ "$STATUS" = "200" ]; then
            print_success "Font loads: $font (HTTP $STATUS)"
        else
            print_error "Font fails: $font (HTTP $STATUS)"
        fi
    done
else
    print_warning "Container not running - cannot test font loading"
fi

echo ""

# Check 8: Database connection
echo "Check 8: Database Connection"
echo "---------------------------"

if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL not set"
else
    print_success "DATABASE_URL is set"
    
    # Try to connect
    if npx prisma db execute --stdin --schema packages/prisma/schema.prisma << 'EOF' 2>/dev/null
SELECT 1;
EOF
    then
        print_success "Database connection works"
        
        # Check for invalid emails
        INVALID_COUNT=$(npx prisma db execute --stdin --schema packages/prisma/schema.prisma << 'EOF' 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0"
SELECT COUNT(*) FROM "User" WHERE email IS NULL OR email = '' OR email NOT LIKE '%@%.%';
EOF
)
        if [ "$INVALID_COUNT" = "0" ]; then
            print_success "No invalid emails in database"
        else
            print_warning "Found $INVALID_COUNT invalid emails"
        fi
    else
        print_error "Database connection failed"
    fi
fi

echo ""

# Summary
echo "=========================================="
echo "📊 Summary"
echo "=========================================="
echo ""

# Count checks
TOTAL_CHECKS=8
PASSED=0
FAILED=0
WARNINGS=0

# This is a simplified summary - in production you'd track each check result

echo "Verification complete!"
echo ""

print_info "To deploy all fixes, run:"
echo "  chmod +x deploy-complete-fix.sh"
echo "  ./deploy-complete-fix.sh"
echo ""

print_info "To check logs:"
echo "  docker logs -f signtusk-app"
echo ""

print_info "To test manually:"
echo "  1. Send a document invitation"
echo "  2. Check for email sending success"
echo "  3. Verify fonts load in browser"
echo "  4. Check for TRPC validation errors"
echo ""
