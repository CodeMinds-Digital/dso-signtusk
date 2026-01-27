# Resend Document / Send Reminder Fix

## Issue

When clicking "Send reminder" button in the resend document popup, users get:

```
Something went wrong
This envelope could not be resent at this time. please try again.
```

## Root Causes

### 1. Email Configuration Issue

The `.env` file has conflicting email settings:

```env
# Commented out SMTP settings
# NEXT_PRIVATE_SMTP_TRANSPORT="smtp-auth"
# NEXT_PRIVATE_SMTP_HOST="127.0.0.1"
# ...

# But then has these active settings
NEXT_PRIVATE_RESEND_API_KEY="re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx"
NEXT_PRIVATE_SMTP_FROM_ADDRESS="noreply@notify.signtusk.com"
NEXT_PRIVATE_SMTP_FROM_NAME="SignTusk"
NEXT_PRIVATE_SMTP_HOST="resend"  # ❌ Wrong - should not be "resend"
NEXT_PRIVATE_SMTP_TRANSPORT="resend"  # ✅ Correct
```

### 2. Invalid SMTP_HOST Value

`NEXT_PRIVATE_SMTP_HOST="resend"` is incorrect. When using Resend transport, this variable should not be set or should be empty.

### 3. Duplicate SIGNING_TRANSPORT

```env
NEXT_PRIVATE_SIGNING_TRANSPORT="local"
NEXT_PRIVATE_SIGNING_TRANSPORT="EnUmAfT@2)2%"  # ❌ Duplicate, wrong value
```

## The Fix

Update your `.env` file with the correct email configuration:

```env
# Email Configuration - Using Resend
NEXT_PRIVATE_SMTP_TRANSPORT="resend"
NEXT_PRIVATE_RESEND_API_KEY="re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx"
NEXT_PRIVATE_SMTP_FROM_ADDRESS="noreply@notify.signtusk.com"
NEXT_PRIVATE_SMTP_FROM_NAME="SignTusk"

# Remove or comment out these when using Resend:
# NEXT_PRIVATE_SMTP_HOST=""
# NEXT_PRIVATE_SMTP_PORT=""
# NEXT_PRIVATE_SMTP_USERNAME=""
# NEXT_PRIVATE_SMTP_PASSWORD=""
```

## How Email Sending Works

### Flow:

1. User clicks "Send reminder" → `DocumentResendDialog`
2. Calls tRPC mutation → `document.redistribute`
3. Calls server function → `resendDocument()`
4. Sends email via → `mailer.sendMail()`
5. Uses transport → Resend API

### Mailer Transport Selection:

```typescript
// packages/email/mailer.ts
const transport = env("NEXT_PRIVATE_SMTP_TRANSPORT") ?? "smtp-auth";

if (transport === "resend") {
  return createTransport(
    ResendTransport.makeTransport({
      apiKey: env("NEXT_PRIVATE_RESEND_API_KEY") || "",
    })
  );
}
```

## Verification Steps

### 1. Check Environment Variables

```bash
# In your deployment environment (Dokploy)
echo $NEXT_PRIVATE_SMTP_TRANSPORT
# Should output: resend

echo $NEXT_PRIVATE_RESEND_API_KEY
# Should output: re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx

echo $NEXT_PRIVATE_SMTP_FROM_ADDRESS
# Should output: noreply@notify.signtusk.com
```

### 2. Check Application Logs

Look for these log messages when sending reminder:

```
[MAILER] Creating transport: resend
[MAILER] Resend API key present: true
[MAILER] Resend API key prefix: re_bSSwgHi...
[MAILER] Sending email to: recipient@example.com
[MAILER] From: noreply@notify.signtusk.com
[MAILER] Email sent successfully: { ... }
```

### 3. Test Resend API Key

```bash
# Test if your Resend API key is valid
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@notify.signtusk.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test"
  }'
```

## Common Errors and Solutions

### Error: "NEXT_PRIVATE_RESEND_API_KEY is not set"

**Solution**: Ensure the API key is set in your environment variables

### Error: "Invalid API key"

**Solution**:

1. Check if the API key is correct
2. Verify the domain `notify.signtusk.com` is verified in Resend dashboard
3. Check if the API key has the correct permissions

### Error: "Domain not verified"

**Solution**:

1. Go to Resend dashboard
2. Add and verify `notify.signtusk.com` domain
3. Or use a verified domain like `onboarding@resend.dev` for testing

### Error: "Rate limit exceeded"

**Solution**:

1. Check your Resend plan limits
2. Wait for rate limit to reset
3. Upgrade plan if needed

## Testing the Fix

### 1. Update Environment Variables

In Dokploy:

1. Go to your application settings
2. Update environment variables:
   ```
   NEXT_PRIVATE_SMTP_TRANSPORT=resend
   NEXT_PRIVATE_RESEND_API_KEY=re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx
   NEXT_PRIVATE_SMTP_FROM_ADDRESS=noreply@notify.signtusk.com
   NEXT_PRIVATE_SMTP_FROM_NAME=SignTusk
   ```
3. Remove or leave empty:
   ```
   NEXT_PRIVATE_SMTP_HOST=
   NEXT_PRIVATE_SMTP_PORT=
   ```
4. Save and restart the application

### 2. Test Sending Reminder

1. Log in to your application
2. Go to a pending document
3. Click the actions menu (three dots)
4. Click "Resend"
5. Select recipients
6. Click "Send reminder"
7. Should see success message: "Document re-sent successfully"

### 3. Check Recipient Email

1. Check the recipient's email inbox
2. Should receive an email from `noreply@notify.signtusk.com`
3. Subject: "Reminder: Please sign this document"
4. Contains link to sign the document

## Alternative: Use SMTP Instead of Resend

If you prefer to use SMTP (e.g., Gmail, SendGrid, etc.):

```env
NEXT_PRIVATE_SMTP_TRANSPORT="smtp-auth"
NEXT_PRIVATE_SMTP_HOST="smtp.gmail.com"
NEXT_PRIVATE_SMTP_PORT="587"
NEXT_PRIVATE_SMTP_SECURE="true"
NEXT_PRIVATE_SMTP_USERNAME="your-email@gmail.com"
NEXT_PRIVATE_SMTP_PASSWORD="your-app-password"
NEXT_PRIVATE_SMTP_FROM_ADDRESS="your-email@gmail.com"
NEXT_PRIVATE_SMTP_FROM_NAME="SignTusk"
```

## Debugging

### Enable Detailed Logging

The mailer already has console.log statements. Check your application logs:

```bash
# In Dokploy, view application logs
# Look for lines starting with [MAILER]
```

### Check Database Audit Logs

```sql
SELECT * FROM "DocumentAuditLog"
WHERE type = 'EMAIL_SENT'
ORDER BY "createdAt" DESC
LIMIT 10;
```

This will show if emails are being logged even if they fail to send.

## Deploy the Fix

### For Local Development:

```bash
# Update .env file
nano .env

# Restart the application
npm run dev
```

### For Dokploy:

1. Update environment variables in Dokploy dashboard
2. Restart the application
3. Test the resend functionality

## Related Files

- `packages/email/mailer.ts` - Email transport configuration
- `packages/lib/server-only/document/resend-document.ts` - Resend logic
- `packages/trpc/server/document-router/redistribute-document.ts` - tRPC endpoint
- `apps/remix/app/components/dialogs/document-resend-dialog.tsx` - UI component
