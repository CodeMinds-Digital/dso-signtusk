# ✅ Complete Resend Document Fix Guide

## Problem Summary

When clicking "Send reminder" in the Resend Document popup, you get:

```
"An unexpected error occurred, please retry."
```

The actual error in logs:

```
Cannot read properties of null (reading 'useRef')
at I18nProvider
at renderWithI18N
```

## Root Cause

React context initialization issue when rendering email templates with `@lingui/react` and `@react-email/render` in server-side rendering.

## ✅ Fix Applied

### 1. Updated `packages/email/render.tsx`

Changed from JSX to `createElement` to properly initialize React context:

```typescript
// Before (causing error):
return ReactEmail.render(
  <I18nProvider i18n={i18n}>
    <BrandingProvider branding={branding}>
      ...
    </BrandingProvider>
  </I18nProvider>,
  otherOptions
);

// After (fixed):
const wrappedElement = createElement(
  I18nProvider,
  { i18n },
  createElement(BrandingProvider, { branding }, ...)
);
return ReactEmail.render(wrappedElement, otherOptions);
```

## 🚀 Deploy the Fix

### Step 1: Rebuild the Application

```bash
# Clean build cache
rm -rf .turbo/cache
rm -rf apps/remix/build
rm -rf packages/email/dist

# Rebuild
npm run build
```

### Step 2: Restart the Application

#### For Local Development:

```bash
# Stop current process
pkill -f "node"

# Start fresh
npm run dev
```

#### For Docker/Production:

```bash
# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### For Dokploy:

1. Go to your Dokploy dashboard
2. Navigate to your application
3. Click "Clear Build Cache"
4. Click "Redeploy"
5. Wait for deployment to complete

### Step 3: Verify the Fix

1. Log in to your application
2. Go to a pending document
3. Click the "..." menu → "Resend Document"
4. Select a recipient who hasn't signed
5. Click "Send reminder"
6. You should see: ✅ "Envelope resent - Your envelope has been resent successfully."

### Step 4: Check Logs

Look for successful email sending:

```
[MAILER] Creating transport: resend
[MAILER] Resend API key present: true
[MAILER] Sending email to: recipient@example.com
[MAILER] Email sent successfully: { messageId: '...' }
```

## 🧪 Test Email Sending

Create a test script to verify:

```bash
cat > test-email-send.ts << 'EOF'
import { mailer } from '@signtusk/email/mailer';

async function testEmail() {
  try {
    const result = await mailer.sendMail({
      to: 'test@example.com',
      from: process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS!,
      subject: 'Test Email',
      text: 'This is a test email',
      html: '<p>This is a test email</p>',
    });
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

testEmail();
EOF

npx tsx test-email-send.ts
```

## 📋 Checklist

- [x] Fixed React context initialization in `packages/email/render.tsx`
- [ ] Rebuilt the application
- [ ] Restarted/redeployed the application
- [ ] Tested resend document functionality
- [ ] Verified email was sent successfully
- [ ] Checked application logs for errors

## 🔍 If Still Not Working

### Check 1: Verify Environment Variables

```bash
# In your running container/process
curl http://localhost:3000/api/test-email

# Should return:
{
  "transport": "resend",
  "hasApiKey": true,
  "apiKeyPrefix": "re_bSSwgHi",
  "fromAddress": "noreply@notify.signtusk.com",
  "fromName": "SignTusk",
  "webappUrl": "http://localhost:3000"
}
```

### Check 2: Verify Resend Domain

```bash
curl -X GET 'https://api.resend.com/domains' \
  -H "Authorization: Bearer re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx"
```

Look for `notify.signtusk.com` with `status: "verified"`.

If not verified, temporarily use:

```env
NEXT_PRIVATE_SMTP_FROM_ADDRESS="onboarding@resend.dev"
```

### Check 3: Test Resend API Directly

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "test@example.com",
    "subject": "Test",
    "text": "Test email"
  }'
```

Should return:

```json
{
  "id": "...",
  "from": "onboarding@resend.dev",
  "to": "test@example.com",
  "created_at": "..."
}
```

### Check 4: Review Application Logs

```bash
# Docker
docker-compose logs -f --tail=100

# Dokploy
# View logs in the Dokploy dashboard

# Local
npm run dev 2>&1 | grep -E "(MAILER|error|resend)"
```

## 🎯 Expected Behavior After Fix

1. Click "Resend Document" → Opens dialog
2. Select recipients → Checkboxes work
3. Click "Send reminder" → Shows loading state
4. Success message appears: "Envelope resent"
5. Dialog closes automatically
6. Email is sent to selected recipients
7. Audit log entry created with type "EMAIL_SENT"

## 📊 Verify in Database

```sql
-- Check recent email audit logs
SELECT
  "createdAt",
  type,
  data->>'recipientEmail' as email,
  data->>'isResending' as is_resend
FROM "DocumentAuditLog"
WHERE type = 'EMAIL_SENT'
ORDER BY "createdAt" DESC
LIMIT 5;
```

Should show entries with `is_resend: true`.

## 🔧 Alternative Solutions

### If React Fix Doesn't Work

Try downgrading Lingui:

```bash
npm install @lingui/react@4.11.4 @lingui/core@4.11.4 @lingui/cli@4.11.4
npm run build
```

### If Resend Continues to Fail

Switch to SMTP:

```env
NEXT_PRIVATE_SMTP_TRANSPORT="smtp-auth"
NEXT_PRIVATE_SMTP_HOST="smtp.gmail.com"
NEXT_PRIVATE_SMTP_PORT=587
NEXT_PRIVATE_SMTP_SECURE="true"
NEXT_PRIVATE_SMTP_USERNAME="your-email@gmail.com"
NEXT_PRIVATE_SMTP_PASSWORD="your-app-password"
NEXT_PRIVATE_SMTP_FROM_ADDRESS="your-email@gmail.com"
```

## 📞 Support

If the issue persists after following all steps:

1. Check the full error stack trace in logs
2. Verify all environment variables are loaded
3. Test email sending directly with curl
4. Check Resend dashboard for any API errors
5. Review the application build logs for any compilation errors

The fix should resolve the React rendering issue. The key was changing from JSX to `createElement` for proper React context initialization during server-side rendering.
