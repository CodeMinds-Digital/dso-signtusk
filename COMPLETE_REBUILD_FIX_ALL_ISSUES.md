# 🔧 Complete Fix for All Issues

## Current Issues (All caused by OLD BUILD + Data Issue)

### ❌ Issue 1: Static Asset Routing Errors

```
Error: No route matches URL "/assets/web-CKsRT77S.js"
Error: No route matches URL "/fonts/inter-variablefont_opsz,wght.ttf"
Error: No route matches URL "/static/signing-card.png"
```

**Status**: ✅ Code fix already applied to `apps/remix/server/middleware.ts`
**Problem**: Running OLD BUILD that doesn't have the fix
**Solution**: Rebuild required

---

### ❌ Issue 2: Email Translation Functions Missing

```
ReferenceError: getDocumentCompletedTranslations is not defined
Task failed - BackgroundTaskFailedError
```

**Status**: ✅ All 23 translation functions added to `packages/lib/utils/get-email-translations.ts`
**Problem**: Running OLD BUILD that doesn't have the new functions
**Solution**: Rebuild required

---

### ❌ Issue 3: Invalid Email in Database

```
Output validation failed: Invalid email at path results[0].email
```

**Status**: ❌ Data issue - invalid email in database
**Problem**: Database contains invalid email address
**Solution**: SQL fix required (separate from rebuild)

---

## 🚀 COMPLETE FIX PROCEDURE

### Step 1: Stop Current Application

```bash
docker-compose down
```

### Step 2: Clean Build Artifacts (Important!)

```bash
# Remove old build files
rm -rf apps/remix/build
rm -rf apps/web/build
rm -rf apps/docs/build
rm -rf .turbo/cache

# Optional: Clean node_modules if issues persist
# rm -rf node_modules apps/*/node_modules packages/*/node_modules
# npm install
```

### Step 3: Rebuild Application

```bash
# Build all packages
npm run build
```

**Expected output**: Should complete without errors. Look for:

- ✅ `packages/lib` build success
- ✅ `packages/email` build success
- ✅ `apps/remix` build success

### Step 4: Verify Build Output

```bash
# Check if translation functions exist in build
ls -la apps/remix/build/server/hono/packages/lib/utils/get-email-translations.js

# Should show the file exists
# If not found, the build failed
```

### Step 5: Rebuild Docker Image (No Cache!)

```bash
# Build fresh Docker image
docker build --no-cache -t signtusk:latest .
```

**Why `--no-cache`?** Ensures Docker doesn't use old cached layers with the old build.

### Step 6: Start Application

```bash
docker-compose up -d
```

### Step 7: Monitor Logs

```bash
# Watch logs for errors
docker-compose logs -f --tail=100
```

**What to look for**:

- ✅ No more "getDocumentCompletedTranslations is not defined" errors
- ✅ No more "No route matches URL" errors for /assets/, /fonts/, /static/
- ⚠️ May still see "Invalid email" TRPC error (that's Issue 3 - separate fix)

---

## 🔍 Step 8: Fix Invalid Email in Database

This is a **DATA ISSUE**, not a code issue. You need to find and fix the invalid email.

### Option A: Find Invalid Emails via SQL

```bash
# Connect to your database
docker-compose exec postgres psql -U postgres -d signtusk

# Or if using external database
# psql -h your-host -U your-user -d your-database
```

Then run:

```sql
-- Find invalid emails in User table
SELECT id, email, name, "createdAt"
FROM "User"
WHERE email NOT LIKE '%@%.%'
   OR email NOT LIKE '%@%'
   OR email = ''
   OR email IS NULL
ORDER BY "createdAt" DESC;

-- Find invalid emails in Recipient table
SELECT id, email, name, "envelopeId"
FROM "Recipient"
WHERE email NOT LIKE '%@%.%'
   OR email NOT LIKE '%@%'
   OR email = ''
   OR email IS NULL
LIMIT 20;
```

### Option B: Use Prisma Studio

```bash
# Open Prisma Studio
npm run prisma:studio
```

Then:

1. Navigate to "User" table
2. Look for invalid emails (missing @, no domain, etc.)
3. Edit or delete the invalid records

### Fix the Invalid Emails

Once you find the invalid email(s), you have 3 options:

**Option 1: Update to valid email**

```sql
UPDATE "User"
SET email = 'placeholder@example.com'
WHERE id = <invalid-user-id>;
```

**Option 2: Delete the user** (if it's a test/junk user)

```sql
DELETE FROM "User" WHERE id = <invalid-user-id>;
```

**Option 3: Use the fix script**

```bash
# Run the automated fix script
npm run prisma:studio
# Then manually fix in the UI
```

---

## ✅ Verification Checklist

After rebuild and database fix, verify:

### 1. Static Assets Load

```bash
# Test in browser or curl
curl -I http://localhost:3000/assets/web-CKsRT77S.js
# Should return 200 OK, not 404

curl -I http://localhost:3000/fonts/inter-variablefont_opsz,wght.ttf
# Should return 200 OK, not 404

curl -I http://localhost:3000/static/signing-card.png
# Should return 200 OK, not 404
```

### 2. Email Functions Exist

```bash
# Check logs for email errors
docker-compose logs -f | grep "getDocumentCompletedTranslations"
# Should see NOTHING (no errors)

# Try completing a document to trigger email
# Should work without errors
```

### 3. No Invalid Email Errors

```bash
# Check logs for TRPC validation errors
docker-compose logs -f | grep "Invalid email"
# Should see NOTHING after database fix
```

### 4. Application Works

- ✅ Can sign up
- ✅ Can log in
- ✅ Can create documents
- ✅ Can invite recipients
- ✅ Emails send successfully
- ✅ No 404 errors in browser console

---

## 🆘 If Issues Persist

### Issue: Still seeing "getDocumentCompletedTranslations is not defined"

**Cause**: Build didn't include the new code

**Fix**:

```bash
# Nuclear option - complete clean rebuild
docker-compose down
docker system prune -a  # WARNING: Removes all Docker cache
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf apps/remix/build .turbo
npm install
npm run build
docker build --no-cache -t signtusk:latest .
docker-compose up -d
```

### Issue: Still seeing "No route matches URL" for assets

**Cause**: Middleware change didn't get compiled

**Fix**:

```bash
# Verify middleware file has the fix
grep "/static/" apps/remix/server/middleware.ts
# Should show: /^(\/api\/|\/ingest\/|\/__manifest|\/assets\/|\/fonts\/|\/static\/|\/apple-.*|\/favicon.*|\/site\.webmanifest)/

# If not there, the file wasn't saved. Re-apply the fix.
# If it's there, rebuild is needed (see nuclear option above)
```

### Issue: Still seeing "Invalid email" errors

**Cause**: Database still has invalid emails

**Fix**:

```bash
# Find ALL invalid emails more aggressively
docker-compose exec postgres psql -U postgres -d signtusk -c "
SELECT 'User' as table_name, id, email, name
FROM \"User\"
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
UNION ALL
SELECT 'Recipient' as table_name, id::text, email, name
FROM \"Recipient\"
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
LIMIT 50;
"

# Fix each one manually
```

---

## 📊 Expected Timeline

- **Step 1-2** (Stop & Clean): 1 minute
- **Step 3** (Build): 3-5 minutes
- **Step 4** (Verify): 30 seconds
- **Step 5** (Docker Build): 5-10 minutes
- **Step 6-7** (Start & Monitor): 2 minutes
- **Step 8** (Fix Database): 5-10 minutes

**Total**: ~20-30 minutes

---

## 🎯 Summary

**All three issues will be fixed by**:

1. ✅ Rebuilding the application (fixes Issues 1 & 2)
2. ✅ Fixing invalid emails in database (fixes Issue 3)

**The key**: You MUST rebuild. All code fixes are done, but the running container has the old compiled code.

---

## 🚀 Quick Commands (Copy-Paste)

```bash
# Complete rebuild procedure
docker-compose down
rm -rf apps/remix/build .turbo/cache
npm run build
docker build --no-cache -t signtusk:latest .
docker-compose up -d
docker-compose logs -f --tail=100
```

Then fix database separately:

```bash
# Find invalid emails
docker-compose exec postgres psql -U postgres -d signtusk -c "SELECT id, email, name FROM \"User\" WHERE email NOT LIKE '%@%.%' LIMIT 10;"

# Fix them (example)
docker-compose exec postgres psql -U postgres -d signtusk -c "UPDATE \"User\" SET email = 'fixed@example.com' WHERE id = <id>;"
```

---

**After these steps, all three issues should be resolved!** 🎉
