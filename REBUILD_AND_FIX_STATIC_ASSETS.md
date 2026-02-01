# Critical: Rebuild Required + Static Assets Fixed

## 🔴 ISSUE 1: You MUST Rebuild (Most Important!)

The error `getDocumentCompletedTranslations is not defined` means you're running the **OLD BUILD**.

### Fix: Rebuild Now!

```bash
# Stop current app
docker-compose down

# Rebuild everything
npm run build

# Rebuild Docker image (no cache to ensure fresh build)
docker build --no-cache -t signtusk:latest .

# Start fresh
docker-compose up -d

# Check logs
docker-compose logs -f --tail=100
```

**Why this is critical**: All the email migration code changes we made only exist in source files. The running Docker container is using the old compiled JavaScript that doesn't have the new functions.

---

## ✅ ISSUE 2: Static Assets Fixed

**Problem**: Routes like `/assets/web-*.js`, `/fonts/*.ttf`, `/static/*.png` were returning 404.

**Root Cause**: The middleware regex wasn't excluding `/static/` paths, so React Router was trying to handle them instead of letting the static file server handle them.

**Fix Applied**: Updated `apps/remix/server/middleware.ts` to include `/static/` in the `nonPagePathRegex`.

**Before**:

```typescript
const nonPagePathRegex =
  /^(\/api\/|\/ingest\/|\/__manifest|\/assets\/|\/fonts\/|\/apple-.*|\/favicon.*|\/site\.webmanifest)/;
```

**After**:

```typescript
const nonPagePathRegex =
  /^(\/api\/|\/ingest\/|\/__manifest|\/assets\/|\/fonts\/|\/static\/|\/apple-.*|\/favicon.*|\/site\.webmanifest)/;
```

This fix will take effect after you rebuild (see Issue 1).

---

## ⚠️ ISSUE 3: Invalid Email in Database

**Error**:

```
Output validation failed: Invalid email at path results[0].email
```

**This is a data issue**, not a code issue. You have an invalid email address in your database.

### Fix Options:

**Option A: Find and fix the invalid email**

```sql
-- Find invalid emails
SELECT id, email, name FROM "User" WHERE email NOT LIKE '%@%.%';
SELECT id, email, name FROM "Recipient" WHERE email NOT LIKE '%@%.%';

-- Update or delete them
UPDATE "User" SET email = 'valid@example.com' WHERE id = <id>;
-- OR
DELETE FROM "User" WHERE id = <id>;
```

**Option B: Run the fix script** (if you created one earlier)

```bash
npm run prisma:studio
# Then manually fix the invalid emails in the UI
```

---

## Summary of What to Do NOW

1. **REBUILD** (most important):

   ```bash
   docker-compose down
   npm run build
   docker build --no-cache -t signtusk:latest .
   docker-compose up -d
   ```

2. **Verify** the email errors are gone:

   ```bash
   docker-compose logs -f | grep "getDocumentCompletedTranslations"
   # Should see nothing
   ```

3. **Verify** static assets work:
   - Open your app in browser
   - Check browser console for 404 errors
   - Should see no errors for `/assets/`, `/fonts/`, `/static/` files

4. **Fix invalid emails** (optional, but recommended):
   - Use Prisma Studio or SQL to find and fix invalid emails

---

## Expected Results After Rebuild

✅ No more `getDocumentCompletedTranslations is not defined` errors
✅ No more `/assets/web-*.js` 404 errors  
✅ No more `/fonts/*.ttf` 404 errors
✅ No more `/static/*.png` 404 errors
✅ Emails will send successfully
⚠️ Invalid email validation error will remain until you fix the data

---

## If You Still See Issues After Rebuild

1. **Clear Docker cache completely**:

   ```bash
   docker system prune -a
   docker volume prune
   ```

2. **Rebuild from scratch**:

   ```bash
   rm -rf node_modules apps/*/node_modules packages/*/node_modules
   npm install
   npm run build
   docker build --no-cache -t signtusk:latest .
   docker-compose up -d
   ```

3. **Check build output**:

   ```bash
   ls -la apps/remix/build/server/hono/packages/lib/utils/
   # Should see get-email-translations.js

   grep "getDocumentCompletedTranslations" apps/remix/build/server/hono/packages/lib/utils/get-email-translations.js
   # Should see the function definition
   ```
