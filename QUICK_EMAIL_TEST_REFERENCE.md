# Quick Email Test Reference Card

## Test Accounts

- 🔵 **Account 1**: ramalai13@gmail.com (Primary - Document Owner)
- 🟢 **Account 2**: lightzspeedindia@gmail.com (Secondary - Recipient)
- 🟡 **Account 3**: codemindsdigital@gmail.com (Tertiary - Recipient)

---

## Quick Test Sequence (30 minutes)

### 1️⃣ Password Reset (5 min)

```
1. Go to: https://testone.intotni.com/signin
2. Click "Forgot Password"
3. Enter: lightzspeedindia@gmail.com
4. Check inbox → Click link → Reset password
```

**Expected**: 2 emails (reset request + success confirmation)

---

### 2️⃣ Document Signing Flow (10 min)

```
1. Login as: ramalai13@gmail.com
2. Create document → Upload PDF
3. Add recipient: lightzspeedindia@gmail.com
4. Add signature field → Send
5. Check lightzspeedindia@gmail.com inbox
6. Open link → Sign document
7. Check ramalai13@gmail.com inbox
```

**Expected**: 3 emails (signing request + signed notification + completion)

---

### 3️⃣ Document Rejection (5 min)

```
1. Login as: ramalai13@gmail.com
2. Create document → Add recipient: codemindsdigital@gmail.com
3. Send document
4. As codemindsdigital@gmail.com → Open link → Reject
5. Check both inboxes
```

**Expected**: 2 emails (rejection confirmation + owner notification)

---

### 4️⃣ Document Cancellation (5 min)

```
1. Login as: ramalai13@gmail.com
2. Create document → Add 2 recipients:
   - lightzspeedindia@gmail.com
   - codemindsdigital@gmail.com
3. Send document
4. Cancel document with reason
5. Check both recipient inboxes
```

**Expected**: 2 emails (cancellation to both recipients)

---

### 5️⃣ Organisation Invite (5 min)

```
1. Login as: ramalai13@gmail.com
2. Organisation Settings → Invite Member
3. Enter: lightzspeedindia@gmail.com
4. Check inbox → Accept invitation
5. Check ramalai13@gmail.com inbox
```

**Expected**: 2 emails (invite + member joined notification)

---

## Email Checklist by Account

### 📧 ramalai13@gmail.com

- [x] Signup confirmation (already working ✅)
- [ ] Recipient signed notifications
- [ ] Rejection notifications
- [ ] Completion notifications
- [ ] Member joined notifications
- [ ] Template owner notifications

### 📧 lightzspeedindia@gmail.com

- [ ] Password reset (request + success)
- [ ] Document signing requests
- [ ] Document cancellations
- [ ] Document completions
- [ ] Organisation invites

### 📧 codemindsdigital@gmail.com

- [ ] 2FA codes
- [ ] Document signing requests
- [ ] Rejection confirmations
- [ ] Document cancellations

---

## Quick Commands

### Fix Invalid Emails First

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso"
npx tsx scripts/fix-invalid-emails-prisma.ts
```

### Check Email Status

```bash
npx tsx scripts/test-all-email-triggers.ts
```

### Check Resend Dashboard

https://resend.com/emails

---

## Troubleshooting Quick Fixes

### Email not received?

1. ✅ Check spam folder
2. ✅ Check Resend dashboard
3. ✅ Check application logs
4. ✅ Verify email settings enabled

### Link not working?

1. ✅ Check NEXT_PUBLIC_WEBAPP_URL
2. ✅ Check token not expired
3. ✅ Try generating new link

### TRPC validation error?

1. ✅ Run fix-invalid-emails script
2. ✅ Restart application
3. ✅ Check database for invalid emails

---

## Expected Results Summary

| Test                  | Emails Sent   | Recipients                 |
| --------------------- | ------------- | -------------------------- |
| Password Reset        | 2             | lightzspeedindia@gmail.com |
| Document Signing      | 3             | Both accounts              |
| Document Rejection    | 2             | Both accounts              |
| Document Cancellation | 2             | Both recipients            |
| Organisation Invite   | 2             | Both accounts              |
| **Total**             | **11 emails** | **3 accounts**             |

---

## Success Indicators

✅ **All emails received** = System working perfectly

⚠️ **Some emails missing** = Check specific email type settings

❌ **No emails received** = Check:

- Resend API key
- Database invalid emails
- Application configuration

---

## Time Estimate

- Quick test (5 tests): **30 minutes**
- Full test (16 tests): **2 hours**
- Verification: **15 minutes**

---

## After Testing

1. ✅ Document which emails work
2. ✅ Note any failures
3. ✅ Check Resend dashboard for delivery stats
4. ✅ Report results

---

**Start here**: Test #1 (Password Reset) → Takes 5 minutes! 🚀
