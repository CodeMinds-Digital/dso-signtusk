# ✅ Resend Document Issue - Complete Solution

## 🔍 Root Cause Identified

Your `.env` file **IS** correctly configured with:

```env
NEXT_PRIVATE_SMTP_TRANSPORT="resend"
NEXT_PRIVATE_RESEND_API_KEY="re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx"
NEXT_PRIVATE_SMTP_FROM_ADDRESS="noreply@notify.signtusk.com"
NEXT_PRIVATE_SMTP_FROM_NAME="SignTusk"
NEXT_PUBLIC_WEBAPP_URL="http://localhost:3000"
```

**BUT** the error "An unexpected error occurred, please retry." is happening because:

### 1. Environment Variables Not Loaded at Runtime

The `.env` file exists but the application isn't reading it properly when running.

### 2. Possible Causes:

- Application not restarted after `.env` changes
- `.env` file not being loaded in production/Docker
- Environment variables not passed to the container
- Build cache using old environment values

## 🚀 Complete Fix

### Step 1: Verify Resend API Key is Valid

1. Go to https://resend.com/api-keys
2. Check if the key `re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx` is active
3. Verify the domain `notify.signtusk.com` is verified in Resend
4. If not verified, you need to:
   - Add DNS records for your domain
   - OR use Resend's test domain: `onboarding@resend.dev`

### Step 2: Update .env with Verified Email

If your domain isn't verified yet, temporarily use:

```env
NEXT_PRIVATE_SMTP_FROM_ADDRESS="onboarding@resend.dev"
```

### Step 3: Restart the Application

#### For Local Development:

```bash
# Stop all running processes
pkill -f "node"
pkill -f "remix"

# Clear any caches
rm -rf .turbo/cache
rm -rf node_modules/.cache
rm -rf apps/remix/.cache
rm -rf apps/remix/build

# Reinstall dependencies (optional but recommended)
npm install

# Start fresh
npm run dev
```

#### For Docker/Production:

```bash
# Rebuild without cache
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Or if using Dokploy
# 1. Go to Dokploy dashboard
# 2. Click "Clear Build Cache"
# 3. Redeploy
```

### Step 4: Verify Email Configuration at Runtime

Create a test endpoint to check if env vars are loaded:

```bash
# Create test file
cat > apps/remix/app/routes/api.test-email.ts << 'EOF'
import { json } from "@remix-run/node";

export async function loader() {
  return json({
    transport: process.env.NEXT_PRIVATE_SMTP_TRANSPORT,
    hasApiKey: !!process.env.NEXT_PRIVATE_RESEND_API_KEY,
    apiKeyPrefix: process.env.NEXT_PRIVATE_RESEND_API_KEY?.substring(0, 10),
    fromAddress: process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS,
    fromName: process.env.NEXT_PRIVATE_SMTP_FROM_NAME,
    webappUrl: process.env.NEXT_PUBLIC_WEBAPP_URL,
  });
}
EOF

# Then visit: http://localhost:3000/api/test-email
# You should see all values populated
```

### Step 5: Test Email Sending Directly

```bash
# Create a test script
npx tsx -e "
import { config } from 'dotenv';
config();

console.log('Environment check:');
console.log('NEXT_PRIVATE_SMTP_TRANSPORT:', process.env.NEXT_PRIVATE_SMTP_TRANSPORT);
console.log('NEXT_PRIVATE_RESEND_API_KEY:', process.env.NEXT_PRIVATE_RESEND_API_KEY ? 'SET' : 'NOT SET');
console.log('NEXT_PRIVATE_SMTP_FROM_ADDRESS:', process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS);

// Test Resend API directly
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.NEXT_PRIVATE_RESEND_API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS,
    to: 'test@example.com',
    subject: 'Test Email',
    text: 'This is a test email'
  })
});

const result = await response.json();
console.log('Resend API response:', result);

if (response.ok) {
  console.log('✅ Email API is working!');
} else {
  console.log('❌ Email API failed:', result);
}
"
```

### Step 6: Check Resend Domain Verification

The most common issue is **unverified domain**. Check:

```bash
curl -X GET 'https://api.resend.com/domains' \
  -H "Authorization: Bearer re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx"
```

If your domain `notify.signtusk.com` is not verified, you'll get errors when sending.

**Quick Fix**: Use Resend's test email temporarily:

```env
NEXT_PRIVATE_SMTP_FROM_ADDRESS="onboarding@resend.dev"
```

### Step 7: Add Better Error Logging

Update the mailer to show actual errors:

```typescript
// In packages/email/mailer.ts - already has logging
// Check application logs for:
// [MAILER] Creating transport: resend
// [MAILER] Resend API key present: true
// [MAILER] Sending email to: recipient@example.com
// [MAILER] Email sent successfully: { ... }
// OR
// [MAILER] Failed to send email: { error details }
```

### Step 8: Check Application Logs

```bash
# For local development
npm run dev 2>&1 | tee logs/app.log

# Then try to resend a document and check logs for:
grep -A 5 "MAILER" logs/app.log
grep -A 5 "redistribute" logs/app.log
grep -A 5 "resend" logs/app.log
```

### Step 9: Verify Database Connection

The diagnostic showed database connection failed. Make sure:

```env
NEXT_PRIVATE_DATABASE_URL="postgresql://postgres:EnUmAfT@2)2%@db.bukcppqfgxomzddugnpe.supabase.co:5432/postgres"
```

The password has special characters `@2)2%` which might need URL encoding:

```env
NEXT_PRIVATE_DATABASE_URL="postgresql://postgres:EnUmAfT%402%292%25@db.bukcppqfgxomzddugnpe.supabase.co:5432/postgres"
```

## 🎯 Most Likely Solution

Based on the error, the issue is **domain verification**. Here's the quickest fix:

1. **Option A: Verify Your Domain** (Recommended for production)
   - Go to https://resend.com/domains
   - Add `notify.signtusk.com`
   - Add the DNS records they provide
   - Wait for verification (can take a few minutes)

2. **Option B: Use Test Email** (Quick fix for testing)

   ```bash
   # Update .env
   sed -i '' 's/NEXT_PRIVATE_SMTP_FROM_ADDRESS=.*/NEXT_PRIVATE_SMTP_FROM_ADDRESS="onboarding@resend.dev"/' .env

   # Restart app
   npm run dev
   ```

3. **Option C: Use Your Own Verified Email**
   If you have a verified domain in Resend:
   ```env
   NEXT_PRIVATE_SMTP_FROM_ADDRESS="noreply@your-verified-domain.com"
   ```

## 🧪 Test After Fix

1. Restart your application
2. Go to a pending document
3. Click "Resend Document"
4. Select a recipient
5. Click "Send reminder"
6. Check logs for success message
7. Check recipient's email inbox

## 📊 Expected Success Logs

```
[MAILER] Creating transport: resend
[MAILER] Resend API key present: true
[MAILER] Resend API key prefix: re_bSSwgHi...
[MAILER] Sending email to: recipient@example.com
[MAILER] From: noreply@notify.signtusk.com
[MAILER] Email sent successfully: { messageId: '...' }
```

## ❌ If Still Failing

Check these in order:

1. **API Key Invalid**

   ```bash
   curl -X GET 'https://api.resend.com/domains' \
     -H "Authorization: Bearer re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx"
   ```

   Should return 200, not 401

2. **Domain Not Verified**
   Response will show domain status

3. **Rate Limit**
   Free tier: 100 emails/day
   Check if you've hit the limit

4. **Environment Not Loaded**
   Add to your app startup:
   ```typescript
   console.log("ENV CHECK:", {
     transport: process.env.NEXT_PRIVATE_SMTP_TRANSPORT,
     hasKey: !!process.env.NEXT_PRIVATE_RESEND_API_KEY,
   });
   ```

## 🔧 Alternative: Use SMTP Instead

If Resend continues to fail, switch to SMTP:

```env
NEXT_PRIVATE_SMTP_TRANSPORT="smtp-auth"
NEXT_PRIVATE_SMTP_HOST="smtp.gmail.com"
NEXT_PRIVATE_SMTP_PORT=587
NEXT_PRIVATE_SMTP_SECURE="true"
NEXT_PRIVATE_SMTP_USERNAME="your-email@gmail.com"
NEXT_PRIVATE_SMTP_PASSWORD="your-app-password"
NEXT_PRIVATE_SMTP_FROM_ADDRESS="your-email@gmail.com"
NEXT_PRIVATE_SMTP_FROM_NAME="SignTusk"
```

For Gmail, you need an [App Password](https://support.google.com/accounts/answer/185833).
