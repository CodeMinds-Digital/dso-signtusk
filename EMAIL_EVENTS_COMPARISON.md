# Email Events Comparison - Root vs documenso-main

## Summary

✅ **Both projects have IDENTICAL email events** - All 9 email job definitions are present in both.

## Complete Email Events List

### 1. **Signup Confirmation Email**

- **Job ID:** `send.signup.confirmation.email`
- **Trigger:** When a user signs up
- **Purpose:** Send email verification link
- **Status:** ✅ Present in both

### 2. **Signing Request Email**

- **Job ID:** `send.signing.requested.email`
- **Trigger:** When a document is sent to a recipient for signing
- **Purpose:** Notify recipient they have a document to sign
- **Status:** ✅ Present in both

### 3. **Recipient Signed Email**

- **Job ID:** `send.recipient.signed.email`
- **Trigger:** When a recipient signs a document
- **Purpose:** Notify document owner that someone signed
- **Status:** ✅ Present in both

### 4. **Document Cancelled Emails**

- **Job ID:** `send.document.cancelled.emails`
- **Trigger:** When a document is cancelled
- **Purpose:** Notify all recipients that document was cancelled
- **Status:** ✅ Present in both

### 5. **Signing Rejection Emails**

- **Job ID:** `send.signing.rejected.emails`
- **Trigger:** When a recipient rejects a document
- **Purpose:** Notify document owner and other recipients
- **Status:** ✅ Present in both

### 6. **Password Reset Success Email**

- **Job ID:** `send.password.reset.success.email`
- **Trigger:** When a user successfully resets their password
- **Purpose:** Confirm password was changed
- **Status:** ✅ Present in both

### 7. **Organisation Member Joined Email**

- **Job ID:** `send.organisation-member-joined.email`
- **Trigger:** When a new member joins an organisation/team
- **Purpose:** Notify existing members
- **Status:** ✅ Present in both

### 8. **Organisation Member Left Email**

- **Job ID:** `send.organisation-member-left.email`
- **Trigger:** When a member leaves an organisation/team
- **Purpose:** Notify remaining members
- **Status:** ✅ Present in both

### 9. **Team Deleted Email**

- **Job ID:** `send.team-deleted.email`
- **Trigger:** When a team is deleted
- **Purpose:** Notify all team members
- **Status:** ✅ Present in both

## Detailed Comparison

| Email Event         | Root Project | documenso-main | Identical? |
| ------------------- | ------------ | -------------- | ---------- |
| Signup Confirmation | ✅           | ✅             | ✅ Yes     |
| Signing Request     | ✅           | ✅             | ✅ Yes     |
| Recipient Signed    | ✅           | ✅             | ✅ Yes     |
| Document Cancelled  | ✅           | ✅             | ✅ Yes     |
| Signing Rejection   | ✅           | ✅             | ✅ Yes     |
| Password Reset      | ✅           | ✅             | ✅ Yes     |
| Member Joined       | ✅           | ✅             | ✅ Yes     |
| Member Left         | ✅           | ✅             | ✅ Yes     |
| Team Deleted        | ✅           | ✅             | ✅ Yes     |

## Email Flow Diagrams

### Document Signing Flow

```
1. Document Created
   ↓
2. Send Signing Request Email
   Job: send.signing.requested.email
   To: Recipient(s)
   ↓
3. Recipient Signs
   ↓
4. Send Recipient Signed Email
   Job: send.recipient.signed.email
   To: Document Owner
   ↓
5. All Recipients Sign
   ↓
6. Document Completed
   (Handled by seal-document job, not email job)
```

### Document Rejection Flow

```
1. Recipient Rejects Document
   ↓
2. Send Rejection Emails
   Job: send.signing.rejected.emails
   To: Document Owner + Other Recipients
```

### Document Cancellation Flow

```
1. Owner Cancels Document
   ↓
2. Send Cancellation Emails
   Job: send.document.cancelled.emails
   To: All Recipients
```

### User Account Flow

```
1. User Signs Up
   ↓
2. Send Confirmation Email
   Job: send.signup.confirmation.email
   To: User
   ↓
3. User Resets Password
   ↓
4. Send Password Reset Success Email
   Job: send.password.reset.success.email
   To: User
```

### Team Management Flow

```
1. Member Joins Team
   ↓
2. Send Member Joined Email
   Job: send.organisation-member-joined.email
   To: Existing Members
   ↓
3. Member Leaves Team
   ↓
4. Send Member Left Email
   Job: send.organisation-member-left.email
   To: Remaining Members
   ↓
5. Team Deleted
   ↓
6. Send Team Deleted Email
   Job: send.team-deleted.email
   To: All Former Members
```

## Missing Email Events (Potential Additions)

Based on common document signing workflows, these email events might be useful to add:

### 1. **Document Completed Email**

- **Suggested Job ID:** `send.document.completed.email`
- **Trigger:** When all recipients have signed
- **Purpose:** Notify all parties that document is complete
- **Status:** ❌ Not present in either project

### 2. **Document Viewed Email**

- **Suggested Job ID:** `send.document.viewed.email`
- **Trigger:** When a recipient views the document
- **Purpose:** Notify owner of document activity
- **Status:** ❌ Not present in either project

### 3. **Reminder Email**

- **Suggested Job ID:** `send.signing.reminder.email`
- **Trigger:** X days after signing request with no action
- **Purpose:** Remind recipient to sign
- **Status:** ❌ Not present in either project

### 4. **Document Expiring Email**

- **Suggested Job ID:** `send.document.expiring.email`
- **Trigger:** X days before document expires
- **Purpose:** Warn recipients document will expire soon
- **Status:** ❌ Not present in either project

### 5. **Document Expired Email**

- **Suggested Job ID:** `send.document.expired.email`
- **Trigger:** When document expires
- **Purpose:** Notify all parties document has expired
- **Status:** ❌ Not present in either project

## Email Templates Location

### Root Project

```
packages/email/templates/
├── confirm-email-html.tsx
├── confirm-email-simple.tsx
├── document-cancelled.tsx
├── document-rejected.tsx
├── password-reset-success.tsx
├── signing-request.tsx
├── recipient-signed.tsx
├── organisation-member-joined.tsx
├── organisation-member-left.tsx
└── team-deleted.tsx
```

### documenso-main

```
documenso-main/packages/email/templates/
├── (same structure as root)
```

## Configuration

### Email Provider Setup

Both projects support multiple email providers:

1. **SMTP** (Default)

   ```env
   NEXT_PRIVATE_SMTP_TRANSPORT=smtp-auth
   NEXT_PRIVATE_SMTP_HOST=smtp.example.com
   NEXT_PRIVATE_SMTP_PORT=587
   NEXT_PRIVATE_SMTP_USERNAME=user
   NEXT_PRIVATE_SMTP_PASSWORD=pass
   ```

2. **Resend**

   ```env
   NEXT_PRIVATE_SMTP_TRANSPORT=resend
   NEXT_PRIVATE_RESEND_API_KEY=re_xxxxx
   ```

3. **SendGrid**
   ```env
   NEXT_PRIVATE_SMTP_TRANSPORT=sendgrid
   NEXT_PRIVATE_SENDGRID_API_KEY=SG.xxxxx
   ```

### Email Sender Configuration

```env
NEXT_PRIVATE_SMTP_FROM_NAME=Signtusk
NEXT_PRIVATE_SMTP_FROM_ADDRESS=noreply@signtusk.com
```

## Testing Email Events

### Trigger Email Manually

```typescript
import { jobs } from "@signtusk/lib/jobs/client";

// Send signing request email
await jobs.triggerJob({
  name: "send.signing.requested.email",
  payload: {
    userId: 1,
    documentId: 123,
    recipientId: 456,
  },
});

// Send recipient signed email
await jobs.triggerJob({
  name: "send.recipient.signed.email",
  payload: {
    documentId: 123,
    recipientId: 456,
  },
});
```

### Check Email Job Status

```sql
-- Check recent email jobs
SELECT
  id,
  name,
  status,
  "createdAt",
  "completedAt",
  payload
FROM "BackgroundJob"
WHERE name LIKE 'send.%'
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Conclusion

✅ **No differences found** - Both projects have identical email event implementations.

All 9 email job definitions are present and identical in both:

1. Signup Confirmation
2. Signing Request
3. Recipient Signed
4. Document Cancelled
5. Signing Rejection
6. Password Reset Success
7. Organisation Member Joined
8. Organisation Member Left
9. Team Deleted

If you're experiencing email issues, it's likely a configuration problem rather than missing email events.

## Troubleshooting Email Issues

### 1. Check Email Configuration

```bash
# Verify SMTP settings
echo $NEXT_PRIVATE_SMTP_HOST
echo $NEXT_PRIVATE_SMTP_PORT
echo $NEXT_PRIVATE_SMTP_FROM_ADDRESS
```

### 2. Check Email Jobs

```bash
# Run diagnostic
npx tsx scripts/debug-signing-issue.ts <envelope-id>
```

### 3. Check Email Logs

```bash
# Check for email-related errors
grep -i "email\|smtp\|mail" logs/*.log
```

### 4. Test Email Sending

Create a test script to verify email configuration:

```typescript
import { sendEmail } from "@signtusk/email/mailer";

await sendEmail({
  to: "test@example.com",
  subject: "Test Email",
  html: "<p>This is a test</p>",
});
```
