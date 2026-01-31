# Run Email Fix Now - Quick Commands

## Your Database Connection (Updated)

```
postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso
```

---

## Option 1: Run Prisma Fix Script (Recommended - Easiest)

This is the easiest method and works from your local machine.

### Step 1: Set the database URL

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso"
```

### Step 2: Run the fix script

```bash
npx tsx scripts/fix-invalid-emails-prisma.ts
```

That's it! The script will:

- ✅ Check for invalid emails
- ✅ Show you what will be fixed
- ✅ Fix them automatically
- ✅ Verify the fix worked

---

## Option 2: Use Prisma CLI (Quick One-Liner)

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso" && \
npx prisma db execute --file fix-invalid-emails.sql --schema packages/prisma/schema.prisma
```

---

## Option 3: From Dokploy Container

If you're inside the Dokploy container:

```bash
# Run the bash script
./fix-invalid-emails-dokploy.sh
```

---

## After Running the Fix

### 1. Verify it worked

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso"
npx tsx scripts/fix-invalid-emails-prisma.ts
```

Should show:

```
✅ No invalid emails found! Database is clean.
```

### 2. Restart your application in Dokploy

This clears any caches and picks up the fixed data.

### 3. Test email functionality

- Try sending a document
- Check for TRPC validation errors
- Test other email flows

---

## Expected Output

### When Running Fix:

```
==================================================
Fix Invalid Emails - Prisma Method
==================================================

🔗 Connecting to database...

✅ Connected to database

📊 Step 1: Checking for invalid emails in User table...

Found 5 users with invalid emails

Invalid users:
┌─────────┬────┬──────────┬───────┬───────────────┬─────────────────────┐
│ (index) │ id │   name   │ email │ emailVerified │      createdAt      │
├─────────┼────┼──────────┼───────┼───────────────┼─────────────────────┤
│    0    │ 12 │ 'Test'   │  ''   │     null      │ 2024-01-15T10:30:00 │
└─────────┴────┴──────────┴───────┴───────────────┴─────────────────────┘

🔧 Fixing invalid user emails...

✅ Fixed user 12:  → invalid_12@placeholder.local

✅ Fixed 5 out of 5 users

==================================================
✅ Step 3: Verifying fix...
==================================================

📊 Verification Results:
   - Invalid users remaining: 0
   - Invalid recipients remaining: 0

✅ SUCCESS! All invalid emails have been fixed.

==================================================
📊 Summary:
==================================================
   - Invalid users found: 5
   - Invalid users fixed: 5
   - Invalid recipients found: 0
   - Invalid recipients fixed: 0
   - Status: ✅ FIXED
```

---

## Troubleshooting

### If you get "Connection refused":

```bash
# Make sure you're using the internal Dokploy URL
# Try from within the Dokploy network or container
```

### If you get "Permission denied":

```bash
# Verify the password is correct
# Check you're using the admin user
```

### If script hangs:

```bash
# Press Ctrl+C and try again
# Check database is running: docker ps | grep postgres
```

---

## Quick Copy-Paste Commands

### Full Fix (One Command):

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso" && npx tsx scripts/fix-invalid-emails-prisma.ts
```

### Verify Only (Check without fixing):

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso" && npx tsx scripts/fix-invalid-emails-prisma.ts
```

### Alternative SQL Method:

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso" && npx prisma db execute --file fix-invalid-emails.sql --schema packages/prisma/schema.prisma
```

---

## What Gets Fixed

### User Table:

- `email = null` → `invalid_{id}@placeholder.local`
- `email = ''` → `invalid_{id}@placeholder.local`
- `email = 'notanemail'` → `invalid_{id}@placeholder.local`

### Recipient Table:

- `email = null` → `invalid_recipient_{id}@placeholder.local`
- `email = ''` → `invalid_recipient_{id}@placeholder.local`
- `email = 'notanemail'` → `invalid_recipient_{id}@placeholder.local`

---

## After Fix Checklist

- [ ] Run the fix script
- [ ] Verify no invalid emails remain
- [ ] Restart application in Dokploy
- [ ] Test document sending
- [ ] Check for TRPC errors in logs
- [ ] Test other email flows (see EMAIL_TESTING_GUIDE.md)

---

## Next Steps

Once invalid emails are fixed, you can:

1. ✅ Test all email triggers (see EMAIL_TESTING_GUIDE.md)
2. ✅ Run automated tests (npx tsx scripts/test-all-email-triggers.ts)
3. ✅ Monitor email delivery in Resend dashboard
4. ✅ Add database constraints to prevent future invalid emails

---

**Ready to run?** Just copy-paste this command:

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso" && npx tsx scripts/fix-invalid-emails-prisma.ts
```
