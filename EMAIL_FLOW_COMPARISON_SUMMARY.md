# Email Flow Comparison - Quick Reference

## All Email Flows Compared to Confirmation Email ✅

### Confirmation Email Flow (WORKING ✅)

```
User Signs Up
  → POST /signup
  → createUser()
  → jobsClient.triggerJob('send.signup.confirmation.email')
  → Job Handler
  → sendConfirmationToken()
  → sendConfirmationEmail()
  → Create React Element
  → renderEmailWithI18N() ✅ PATCHED HOOKS
  → mailer.sendMail()
  → Email Sent ✅
```

---

## Authentication Emails (Same Pattern)

| Email Type                 | Trigger Point         | Job/Direct | Template            | Status     |
| -------------------------- | --------------------- | ---------- | ------------------- | ---------- |
| **Signup Confirmation**    | POST /signup          | Job        | confirm-email.tsx   | ✅ WORKING |
| **Password Reset Request** | POST /forgot-password | Direct     | forgot-password.tsx | ⏳ Test    |
| **Password Reset Success** | After reset           | Job        | reset-password.tsx  | ⏳ Test    |
| **2FA Email**              | Login with 2FA        | Direct     | access-auth-2fa.tsx | ⏳ Test    |

**All use same rendering system** ✅

---

## Document Workflow Emails (Same Pattern)

| Email Type               | Trigger Point      | Job/Direct | Template                                                  | Recipients         | Status  |
| ------------------------ | ------------------ | ---------- | --------------------------------------------------------- | ------------------ | ------- |
| **Signing Request**      | sendDocument()     | Job        | document-invite.tsx                                       | Recipient          | ⏳ Test |
| **Recipient Signed**     | completeDocument() | Job        | document-recipient-signed.tsx                             | Owner              | ⏳ Test |
| **Rejection (2 emails)** | rejectDocument()   | Job        | document-rejection-confirmed.tsx<br>document-rejected.tsx | Recipient<br>Owner | ⏳ Test |
| **Cancellation**         | After rejection    | Job        | document-cancel.tsx                                       | All recipients     | ⏳ Test |
| **Completion**           | All signed         | Direct     | document-completed.tsx                                    | Owner + All        | ⏳ Test |
| **Pending Reminder**     | Cron job           | Direct     | document-pending.tsx                                      | Unsigned           | ⏳ Test |
| **Recipient Removed**    | Remove recipient   | Direct     | recipient-removed-from-document.tsx                       | Removed            | ⏳ Test |

**All use same rendering system** ✅

---

## Organisation & Team Emails (Same Pattern)

| Email Type            | Trigger Point     | Job/Direct | Template                | Recipients  | Status  |
| --------------------- | ----------------- | ---------- | ----------------------- | ----------- | ------- |
| **Member Joined**     | Accept invitation | Job        | organisation-join.tsx   | All admins  | ⏳ Test |
| **Member Left**       | Leave org         | Job        | organisation-leave.tsx  | All admins  | ⏳ Test |
| **Org Invite**        | Invite member     | Direct     | organisation-invite.tsx | Invitee     | ⏳ Test |
| **Team Deleted**      | Delete team       | Job        | team-delete.tsx         | All members | ⏳ Test |
| **Team Email Verify** | Set team email    | Direct     | confirm-team-email.tsx  | Team email  | ⏳ Test |

**All use same rendering system** ✅

---

## Template & Bulk Emails (Same Pattern)

| Email Type               | Trigger Point        | Job/Direct | Template                                  | Recipients     | Status  |
| ------------------------ | -------------------- | ---------- | ----------------------------------------- | -------------- | ------- |
| **Direct Template Used** | Create from template | Direct     | document-created-from-direct-template.tsx | Template owner | ⏳ Test |
| **Bulk Send Complete**   | Bulk job done        | Direct     | bulk-send-complete.tsx                    | Initiator      | ⏳ Test |

**All use same rendering system** ✅

---

## Key Differences Between Email Types

### 1. Trigger Mechanism

**Job-Based (Background)**:

- Signup confirmation ✅
- Signing request
- Recipient signed
- Rejection emails
- Cancellation emails
- Member joined/left
- Team deleted
- Password reset success

**Direct Send (Immediate)**:

- Password reset request
- 2FA email
- Document completion
- Pending reminder
- Recipient removed
- Org invite
- Team email verify
- Direct template notification
- Bulk send complete

### 2. Number of Recipients

**Single Recipient**:

- Signup confirmation ✅
- Password reset
- 2FA email
- Signing request (per recipient)
- Recipient signed (to owner)
- Org invite
- Team email verify
- Direct template notification
- Bulk send complete

**Multiple Recipients**:

- Rejection (2: recipient + owner)
- Cancellation (all who received/opened)
- Completion (owner + all recipients)
- Member joined/left (all admins)
- Team deleted (all members)

### 3. Email Settings Control

**Controlled by documentMeta**:

- Signing request → `recipientSigningRequest`
- Recipient signed → `recipientSigned`
- Completion → `documentCompleted`
- Cancellation → `documentDeleted`
- Rejection → `recipientSigningRequest`

**Always Sent (No Settings)**:

- Signup confirmation ✅
- Password reset
- 2FA email
- Org invite
- Member joined/left
- Team deleted
- Team email verify

---

## Why Confirmation Email Working = All Should Work

### Shared Components (Used by ALL Emails)

1. **Email Renderer** ✅
   - `packages/email/render-with-i18n-wrapper.tsx`
   - Patched ALL React hooks
   - Used by EVERY email template

2. **I18N System** ✅
   - `packages/lib/utils/render-email-with-i18n.tsx`
   - Handles translations
   - Used by EVERY email

3. **Mailer** ✅
   - `packages/email/mailer.ts`
   - Sends via Resend API
   - Used by EVERY email

4. **Email Context** ✅
   - `packages/lib/server-only/email/get-email-context.ts`
   - Gets branding, language, sender
   - Used by EVERY email

### What Could Still Fail (NOT Rendering)

1. **Invalid Email Addresses** ⚠️
   - Database has null/empty/malformed emails
   - Fix: Run `fix-invalid-emails.sql`

2. **Email Settings Disabled**
   - `documentMeta` settings are false
   - Fix: Enable in document settings

3. **Missing Data**
   - Recipient/user/envelope not found
   - Fix: Ensure proper relationships

4. **Logic Errors**
   - Specific handler has bugs
   - Fix: Debug specific handler

---

## Testing Checklist

### ✅ Phase 1: Confirm Rendering Works

- [x] Signup confirmation email - **WORKING**
- [x] React hooks patched - **DONE**
- [x] I18N system working - **DONE**
- [x] Mailer configured - **DONE**

### ⏳ Phase 2: Test Other Auth Emails

- [ ] Password reset request
- [ ] Password reset success
- [ ] 2FA email

### ⏳ Phase 3: Test Document Emails

- [ ] Signing request
- [ ] Recipient signed notification
- [ ] Rejection emails (both)
- [ ] Cancellation emails
- [ ] Completion email

### ⏳ Phase 4: Test Org/Team Emails

- [ ] Member joined
- [ ] Member left
- [ ] Org invite
- [ ] Team deleted

### ⏳ Phase 5: Test Advanced Emails

- [ ] Direct template notification
- [ ] Bulk send complete
- [ ] Recipient removed
- [ ] Pending reminder

---

## Quick Test Commands

### 1. Fix Invalid Emails First

```bash
npx prisma db execute --file fix-invalid-emails.sql --schema packages/prisma/schema.prisma
```

### 2. Run Automated Tests

```bash
npx tsx scripts/test-all-email-triggers.ts
```

### 3. Check Database Health

```sql
-- Check for invalid emails
SELECT COUNT(*) FROM "User"
WHERE email IS NULL OR email = ''
OR email NOT LIKE '%@%' OR email NOT LIKE '%.%';

-- Should return 0
```

### 4. Check Email Settings

```sql
-- Check document email settings
SELECT
  id,
  "recipientSigningRequest",
  "recipientSigned",
  "documentCompleted",
  "documentDeleted"
FROM "DocumentMeta"
LIMIT 10;

-- All should be true for testing
```

---

## Flow Comparison Table

| Step                    | Confirmation Email ✅    | Other Emails             | Same?     |
| ----------------------- | ------------------------ | ------------------------ | --------- |
| 1. User Action          | Sign up                  | Various actions          | Different |
| 2. Trigger Point        | POST /signup             | Various endpoints        | Different |
| 3. Call triggerJob()    | ✅ Yes                   | ✅ Yes (or direct)       | ✅ Same   |
| 4. Job Handler          | ✅ Yes                   | ✅ Yes (or direct)       | ✅ Same   |
| 5. Fetch Data           | User data                | Various data             | Different |
| 6. Check Conditions     | Email not verified       | Various checks           | Different |
| 7. Get Email Context    | ✅ getEmailContext()     | ✅ getEmailContext()     | ✅ Same   |
| 8. Create React Element | ✅ createElement()       | ✅ createElement()       | ✅ Same   |
| 9. Render with I18N     | ✅ renderEmailWithI18N() | ✅ renderEmailWithI18N() | ✅ Same   |
| 10. Patched Hooks       | ✅ All hooks patched     | ✅ All hooks patched     | ✅ Same   |
| 11. Send via Mailer     | ✅ mailer.sendMail()     | ✅ mailer.sendMail()     | ✅ Same   |
| 12. Update Database     | Token stored             | Various updates          | Different |

**Critical Steps (8-11) are IDENTICAL for ALL emails** ✅

---

## Conclusion

### ✅ What's Working

- Email rendering system (React hooks patched)
- I18N translation system
- Email mailer (Resend API)
- Email context system
- Confirmation email end-to-end

### ⚠️ What Needs Attention

- Invalid emails in database (SQL fix provided)
- Testing remaining email types
- Verifying email settings enabled

### 🎯 Next Steps

1. Fix invalid emails: `npx prisma db execute --file fix-invalid-emails.sql`
2. Run automated tests: `npx tsx scripts/test-all-email-triggers.ts`
3. Manually test critical flows (signing request, completion)
4. Monitor email delivery in Resend dashboard

---

**Bottom Line**: Since confirmation email works and all emails use the same rendering pipeline (steps 8-11), the core system is solid. Any failures will be data-related, not rendering-related.
