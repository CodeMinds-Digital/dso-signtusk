# Resend Document Error Diagnosis

## Problem

When clicking "Send reminder" button in the resend document popup, users get:

```
"An unexpected error occurred, please retry."
```

## Root Causes

Based on the code analysis, this error occurs when the `redistributeEnvelope` mutation fails. Here are the most likely causes:

### 1. **Missing or Invalid Resend API Key** ⚠️ MOST LIKELY

```typescript
// In packages/email/mailer.ts
if (transport === "resend") {
  if (!apiKey) {
    console.error("[MAILER] ERROR: NEXT_PRIVATE_RESEND_API_KEY is not set!");
  }
  return createTransport(
    ResendTransport.makeTransport({
      apiKey: apiKey || "", // Empty string will cause failures
    })
  );
}
```

**Solution**: Ensure `NEXT_PRIVATE_RESEND_API_KEY` is set correctly in your `.env` file.

### 2. **Email Configuration Issues**

The mailer needs these environment variables:

- `NEXT_PRIVATE_SMTP_TRANSPORT` = "resend"
- `NEXT_PRIVATE_RESEND_API_KEY` = your actual Resend API key
- `NEXT_PRIVATE_SMTP_FROM_ADDRESS` = verified sender email
- `NEXT_PRIVATE_SMTP_FROM_NAME` = sender name
- `NEXT_PUBLIC_WEBAPP_URL` = your app URL

### 3. **Database Transaction Timeout**

```typescript
// In packages/lib/server-only/document/resend-document.ts
await prisma.$transaction(
  async (tx) => {
    await mailer.sendMail({ ... });
    await tx.documentAuditLog.create({ ... });
  },
  { timeout: 30_000 }, // 30 second timeout
);
```

If the email sending takes too long, the transaction times out.

### 4. **Invalid Recipient Data**

The code filters recipients but doesn't validate email addresses properly:

```typescript
const recipientsToRemind = envelope.recipients.filter(
  (recipient) =>
    recipients.includes(recipient.id) &&
    recipient.signingStatus === SigningStatus.NOT_SIGNED
);
```

## Error Flow

1. User clicks "Send reminder" button
2. Frontend calls `redistributeEnvelope` mutation
3. Backend calls `resendDocument` function
4. `resendDocument` tries to send emails via `mailer.sendMail()`
5. If mailer fails (no API key, invalid config, etc.), it throws an error
6. The error is caught in the dialog component's try-catch
7. Generic error message is shown to user

## Diagnostic Steps

### Step 1: Run Diagnostic Script

```bash
npx tsx scripts/diagnose-resend-issue.ts
```

This will check:

- Environment variables
- Database connection
- Pending documents
- Email audit logs
- Email configuration

### Step 2: Check Application Logs

Look for these log messages:

```
[MAILER] Creating transport: resend
[MAILER] Resend API key present: false  ← This indicates the problem
[MAILER] ERROR: NEXT_PRIVATE_RESEND_API_KEY is not set!
```

### Step 3: Verify Resend API Key

1. Go to https://resend.com/api-keys
2. Create or copy your API key
3. Add to `.env`:
   ```env
   NEXT_PRIVATE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```

### Step 4: Test Email Sending

```bash
# Test the mailer directly
npx tsx -e "
import { mailer } from '@signtusk/email/mailer';
await mailer.sendMail({
  to: 'test@example.com',
  from: process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS,
  subject: 'Test',
  text: 'Test email'
});
console.log('✅ Email sent successfully');
"
```

## Quick Fix

### Option 1: Fix Resend Configuration (Recommended)

```env
# .env
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=re_your_actual_api_key_here
NEXT_PRIVATE_SMTP_FROM_ADDRESS=noreply@yourdomain.com
NEXT_PRIVATE_SMTP_FROM_NAME=SignTusk
NEXT_PUBLIC_WEBAPP_URL=https://yourdomain.com
```

### Option 2: Use SMTP Instead

```env
# .env
NEXT_PRIVATE_SMTP_TRANSPORT=smtp-auth
NEXT_PRIVATE_SMTP_HOST=smtp.gmail.com
NEXT_PRIVATE_SMTP_PORT=587
NEXT_PRIVATE_SMTP_SECURE=true
NEXT_PRIVATE_SMTP_USERNAME=your-email@gmail.com
NEXT_PRIVATE_SMTP_PASSWORD=your-app-password
NEXT_PRIVATE_SMTP_FROM_ADDRESS=your-email@gmail.com
NEXT_PRIVATE_SMTP_FROM_NAME=SignTusk
```

### Option 3: Disable Email Temporarily (Development Only)

```env
# .env
NEXT_PRIVATE_SMTP_TRANSPORT=smtp-auth
NEXT_PRIVATE_SMTP_HOST=127.0.0.1
NEXT_PRIVATE_SMTP_PORT=2500
# This will log emails to console instead of sending
```

## After Fixing

1. Restart your application
2. Check logs for:
   ```
   [MAILER] Creating transport: resend
   [MAILER] Resend API key present: true ✅
   ```
3. Try sending a reminder again
4. Check audit logs to confirm email was sent:
   ```sql
   SELECT * FROM "DocumentAuditLog"
   WHERE type = 'EMAIL_SENT'
   ORDER BY "createdAt" DESC
   LIMIT 5;
   ```

## Prevention

Add validation to catch this earlier:

```typescript
// Add to startup checks
if (process.env.NEXT_PRIVATE_SMTP_TRANSPORT === "resend") {
  if (!process.env.NEXT_PRIVATE_RESEND_API_KEY) {
    throw new Error(
      "NEXT_PRIVATE_RESEND_API_KEY is required when using Resend transport"
    );
  }
}
```

## Related Files

- `packages/email/mailer.ts` - Email transport configuration
- `packages/lib/server-only/document/resend-document.ts` - Resend logic
- `packages/trpc/server/document-router/redistribute-document.ts` - API endpoint
- `apps/remix/app/components/dialogs/envelope-redistribute-dialog.tsx` - Frontend dialog
