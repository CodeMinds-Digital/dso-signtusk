# Email Testing Plan - Complete Guide

## Test Email Addresses

- **Email 1**: ramalai13@gmail.com
- **Email 2**: lightzspeedindia@gmail.com
- **Email 3**: codemindsdigital@gmail.com

---

## Pre-Testing Checklist

### 1. Fix Invalid Emails First

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso"
npx tsx scripts/fix-invalid-emails-prisma.ts
```

### 2. Verify Application is Running

- URL: https://testone.intotni.com
- Check: Can you access the login page?

### 3. Check Email Settings

- Resend API Key configured: ✅ (re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx)
- Sender email: noreply@notify.signtusk.com
- Application URL: https://testone.intotni.com

---

## Phase 1: Authentication Emails (30 minutes)

### Test 1.1: Signup Confirmation Email ✅ ALREADY WORKING

**Steps:**

1. Go to: https://testone.intotni.com/signup
2. Fill in:
   - Name: Test User 1
   - Email: **ramalai13@gmail.com**
   - Password: TestPassword123!
3. Click "Sign Up"
4. Check inbox: **ramalai13@gmail.com**

**Expected Result:**

- ✅ Email received with subject: "Confirm your email"
- ✅ Email contains verification link
- ✅ Click link → Account verified
- ✅ Redirected to dashboard

**Status**: User confirmed this works ✅

---

### Test 1.2: Password Reset Request Email

**Steps:**

1. Go to: https://testone.intotni.com/signin
2. Click "Forgot Password?"
3. Enter email: **lightzspeedindia@gmail.com**
4. Click "Send Reset Link"
5. Check inbox: **lightzspeedindia@gmail.com**

**Expected Result:**

- ✅ Email received with subject: "Reset your password"
- ✅ Email contains reset link
- ✅ Click link → Redirected to reset password page
- ✅ Can set new password

**Check:**

- [ ] Email received
- [ ] Link works
- [ ] Can reset password

---

### Test 1.3: Password Reset Success Email

**Steps:**

1. After completing Test 1.2 (resetting password)
2. Check inbox: **lightzspeedindia@gmail.com**

**Expected Result:**

- ✅ Email received with subject: "Password reset successful"
- ✅ Email confirms password was changed
- ✅ Email includes security notice

**Check:**

- [ ] Email received
- [ ] Content is correct

---

### Test 1.4: Two-Factor Authentication Email

**Steps:**

1. Login with: **codemindsdigital@gmail.com**
2. Go to Settings → Security
3. Enable 2FA
4. Logout
5. Login again
6. Check inbox: **codemindsdigital@gmail.com**

**Expected Result:**

- ✅ Email received with subject: "Your verification code"
- ✅ Email contains 6-digit code
- ✅ Enter code → Login successful

**Check:**

- [ ] Email received
- [ ] Code works
- [ ] Can login

---

## Phase 2: Document Workflow Emails (45 minutes)

### Test 2.1: Document Signing Request Email

**Steps:**

1. Login as: **ramalai13@gmail.com**
2. Create new document:
   - Click "New Document"
   - Upload a PDF file
   - Title: "Test Contract 1"
3. Add recipient:
   - Email: **lightzspeedindia@gmail.com**
   - Name: Test Recipient 1
   - Role: Signer
4. Add signature field for recipient
5. Click "Send"
6. Check inbox: **lightzspeedindia@gmail.com**

**Expected Result:**

- ✅ Email received with subject: "Please sign this document"
- ✅ Email contains document name: "Test Contract 1"
- ✅ Email contains signing link
- ✅ Click link → Opens document for signing

**Check:**

- [ ] Email received
- [ ] Subject correct
- [ ] Link works
- [ ] Can view document

---

### Test 2.2: Recipient Signed Notification Email

**Steps:**

1. Continue from Test 2.1
2. As **lightzspeedindia@gmail.com**, open signing link
3. Sign the document
4. Check inbox: **ramalai13@gmail.com** (document owner)

**Expected Result:**

- ✅ Email received with subject: "Test Recipient 1 has signed 'Test Contract 1'"
- ✅ Email confirms recipient signed
- ✅ Email shows recipient name and email

**Check:**

- [ ] Email received to owner
- [ ] Subject correct
- [ ] Content accurate

---

### Test 2.3: Document Rejection Emails (2 emails)

**Steps:**

1. Login as: **ramalai13@gmail.com**
2. Create new document:
   - Upload PDF
   - Title: "Test Contract 2"
3. Add recipient:
   - Email: **codemindsdigital@gmail.com**
   - Name: Test Recipient 2
   - Role: Signer
4. Add signature field
5. Click "Send"
6. As **codemindsdigital@gmail.com**, open signing link
7. Click "Reject"
8. Enter reason: "Terms not acceptable"
9. Confirm rejection
10. Check both inboxes

**Expected Result:**

**Email 1 to Recipient (codemindsdigital@gmail.com):**

- ✅ Subject: "Document 'Test Contract 2' - Rejection Confirmed"
- ✅ Confirms rejection
- ✅ Shows rejection reason

**Email 2 to Owner (ramalai13@gmail.com):**

- ✅ Subject: "Document 'Test Contract 2' - Rejected by Test Recipient 2"
- ✅ Notifies of rejection
- ✅ Shows rejection reason

**Check:**

- [ ] Recipient received confirmation
- [ ] Owner received notification
- [ ] Both emails show reason

---

### Test 2.4: Document Cancellation Emails

**Steps:**

1. Login as: **ramalai13@gmail.com**
2. Create new document:
   - Upload PDF
   - Title: "Test Contract 3"
3. Add recipients:
   - **lightzspeedindia@gmail.com** (Signer)
   - **codemindsdigital@gmail.com** (Signer)
4. Add signature fields
5. Click "Send"
6. Wait for recipients to receive emails
7. As owner, go to document
8. Click "Cancel Document"
9. Enter reason: "Project cancelled"
10. Confirm cancellation
11. Check both recipient inboxes

**Expected Result:**

- ✅ Both recipients receive email
- ✅ Subject: "Document 'Test Contract 3' Cancelled"
- ✅ Email shows cancellation reason
- ✅ Email from document owner

**Check:**

- [ ] lightzspeedindia@gmail.com received email
- [ ] codemindsdigital@gmail.com received email
- [ ] Reason shown in both

---

### Test 2.5: Document Completion Email

**Steps:**

1. Login as: **ramalai13@gmail.com**
2. Create new document:
   - Upload PDF
   - Title: "Test Contract 4"
3. Add recipient:
   - Email: **lightzspeedindia@gmail.com**
   - Role: Signer
4. Add signature field
5. Click "Send"
6. As **lightzspeedindia@gmail.com**, sign document
7. Check both inboxes

**Expected Result:**

**Email to Owner (ramalai13@gmail.com):**

- ✅ Subject: "Document 'Test Contract 4' has been completed"
- ✅ Email contains download link
- ✅ All signatures completed

**Email to Recipient (lightzspeedindia@gmail.com):**

- ✅ Subject: "Document 'Test Contract 4' has been completed"
- ✅ Email contains download link
- ✅ Thank you message

**Check:**

- [ ] Owner received email
- [ ] Recipient received email
- [ ] Download links work

---

## Phase 3: Organisation & Team Emails (30 minutes)

### Test 3.1: Organisation Invite Email

**Steps:**

1. Login as: **ramalai13@gmail.com**
2. Create organisation (if not exists)
3. Go to Organisation Settings → Members
4. Click "Invite Member"
5. Enter email: **lightzspeedindia@gmail.com**
6. Select role: Member
7. Click "Send Invitation"
8. Check inbox: **lightzspeedindia@gmail.com**

**Expected Result:**

- ✅ Email received with subject: "You've been invited to join [Organisation Name]"
- ✅ Email contains invitation link
- ✅ Click link → Can accept invitation

**Check:**

- [ ] Email received
- [ ] Link works
- [ ] Can join organisation

---

### Test 3.2: Organisation Member Joined Email

**Steps:**

1. Continue from Test 3.1
2. As **lightzspeedindia@gmail.com**, click invitation link
3. Accept invitation
4. Check inbox: **ramalai13@gmail.com** (organisation admin)

**Expected Result:**

- ✅ Email received with subject: "A new member has joined your organisation"
- ✅ Email shows new member name and email
- ✅ Email sent to all admins

**Check:**

- [ ] Admin received email
- [ ] Member details correct

---

### Test 3.3: Organisation Member Left Email

**Steps:**

1. As **lightzspeedindia@gmail.com**, go to Organisation Settings
2. Click "Leave Organisation"
3. Confirm leaving
4. Check inbox: **ramalai13@gmail.com** (organisation admin)

**Expected Result:**

- ✅ Email received with subject: "A member has left your organisation"
- ✅ Email shows member name and email
- ✅ Email sent to all admins

**Check:**

- [ ] Admin received email
- [ ] Member details correct

---

### Test 3.4: Team Deleted Email

**Steps:**

1. Login as: **ramalai13@gmail.com**
2. Create team with members:
   - Add **lightzspeedindia@gmail.com**
   - Add **codemindsdigital@gmail.com**
3. Delete the team
4. Check both member inboxes

**Expected Result:**

- ✅ Both members receive email
- ✅ Subject: "Team [Team Name] has been deleted"
- ✅ Email explains team deletion

**Check:**

- [ ] lightzspeedindia@gmail.com received email
- [ ] codemindsdigital@gmail.com received email

---

### Test 3.5: Team Email Verification

**Steps:**

1. Login as: **ramalai13@gmail.com**
2. Go to Team Settings
3. Set custom team email: **codemindsdigital@gmail.com**
4. Click "Save"
5. Check inbox: **codemindsdigital@gmail.com**

**Expected Result:**

- ✅ Email received with subject: "Verify your team email"
- ✅ Email contains verification link
- ✅ Click link → Email verified

**Check:**

- [ ] Email received
- [ ] Link works
- [ ] Email verified

---

## Phase 4: Template & Advanced Features (20 minutes)

### Test 4.1: Direct Template Notification

**Steps:**

1. Login as: **ramalai13@gmail.com**
2. Create template
3. Enable "Direct Link"
4. Copy direct link
5. Open link in incognito/private window
6. Fill in recipient: **lightzspeedindia@gmail.com**
7. Create document from template
8. Check inbox: **ramalai13@gmail.com** (template owner)

**Expected Result:**

- ✅ Email received with subject: "A document was created from your template"
- ✅ Email shows document details
- ✅ Email shows recipient email

**Check:**

- [ ] Template owner received email
- [ ] Details correct

---

### Test 4.2: Bulk Send Complete Email

**Steps:**

1. Login as: **ramalai13@gmail.com**
2. Create template
3. Go to Bulk Send
4. Upload CSV with recipients:
   ```
   email,name
   lightzspeedindia@gmail.com,Test User 1
   codemindsdigital@gmail.com,Test User 2
   ```
5. Start bulk send
6. Wait for completion
7. Check inbox: **ramalai13@gmail.com**

**Expected Result:**

- ✅ Email received with subject: "Bulk send completed"
- ✅ Email shows success/failure stats
- ✅ Email shows total sent

**Check:**

- [ ] Email received
- [ ] Stats correct

---

## Testing Summary Checklist

### Phase 1: Authentication (4 tests)

- [ ] 1.1 Signup confirmation ✅ (Already working)
- [ ] 1.2 Password reset request
- [ ] 1.3 Password reset success
- [ ] 1.4 Two-factor authentication

### Phase 2: Document Workflow (5 tests)

- [ ] 2.1 Document signing request
- [ ] 2.2 Recipient signed notification
- [ ] 2.3 Document rejection (2 emails)
- [ ] 2.4 Document cancellation
- [ ] 2.5 Document completion

### Phase 3: Organisation & Team (5 tests)

- [ ] 3.1 Organisation invite
- [ ] 3.2 Member joined
- [ ] 3.3 Member left
- [ ] 3.4 Team deleted
- [ ] 3.5 Team email verification

### Phase 4: Advanced (2 tests)

- [ ] 4.1 Direct template notification
- [ ] 4.2 Bulk send complete

**Total Tests**: 16 email types

---

## Quick Test Script

For automated checking, run:

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso"
npx tsx scripts/test-all-email-triggers.ts
```

---

## Email Inbox Checklist

### ramalai13@gmail.com (Primary Test Account)

Expected emails:

- [ ] Signup confirmation (already received ✅)
- [ ] Recipient signed notifications
- [ ] Rejection notifications
- [ ] Completion notifications
- [ ] Organisation member joined/left
- [ ] Template notifications
- [ ] Bulk send complete

### lightzspeedindia@gmail.com (Secondary Test Account)

Expected emails:

- [ ] Password reset request
- [ ] Password reset success
- [ ] Document signing requests
- [ ] Document cancellations
- [ ] Document completions
- [ ] Organisation invites
- [ ] Team deleted

### codemindsdigital@gmail.com (Tertiary Test Account)

Expected emails:

- [ ] 2FA codes
- [ ] Document signing requests
- [ ] Rejection confirmations
- [ ] Document cancellations
- [ ] Team deleted
- [ ] Team email verification

---

## Troubleshooting During Testing

### Email Not Received?

**Check 1: Spam Folder**

- Gmail sometimes marks automated emails as spam
- Check spam/junk folder

**Check 2: Resend Dashboard**

- Go to: https://resend.com/emails
- Check if email was sent
- Check delivery status

**Check 3: Application Logs**

```bash
# Check for email sending errors
docker logs <container-id> | grep -i "email\|mailer\|resend"
```

**Check 4: Email Settings**

```sql
-- Check document email settings are enabled
SELECT "recipientSigningRequest", "recipientSigned", "documentCompleted", "documentDeleted"
FROM "DocumentMeta"
WHERE "envelopeId" = <your-envelope-id>;
```

### Link Not Working?

**Check 1: URL Configuration**

- Verify NEXT_PUBLIC_WEBAPP_URL is correct
- Should be: https://testone.intotni.com

**Check 2: Token Expiration**

- Some tokens expire after 24 hours
- Generate new token if expired

---

## After Testing

### 1. Document Results

Create a simple table:

| Email Type          | Status     | Notes             |
| ------------------- | ---------- | ----------------- |
| Signup confirmation | ✅ Working | Already confirmed |
| Password reset      | ✅/❌      |                   |
| Signing request     | ✅/❌      |                   |
| ...                 | ...        | ...               |

### 2. Report Issues

For any failing emails, note:

- Email type
- Error message (if any)
- Expected vs actual behavior
- Screenshots

### 3. Monitor Resend Dashboard

- Check delivery rates
- Check bounce rates
- Check spam reports

---

## Estimated Time

- **Phase 1**: 30 minutes
- **Phase 2**: 45 minutes
- **Phase 3**: 30 minutes
- **Phase 4**: 20 minutes
- **Total**: ~2 hours

---

## Success Criteria

✅ **All tests pass** = Email system fully working

⚠️ **Some tests fail** = Specific email types need debugging

❌ **Most tests fail** = Check:

1. Invalid emails in database
2. Email settings disabled
3. Resend API key issues
4. Application configuration

---

**Ready to start testing?** Begin with Phase 1, Test 1.2 (Password Reset) since signup confirmation already works! 🚀
