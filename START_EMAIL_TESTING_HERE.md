# 🚀 Start Email Testing Here

## Your Test Email Addresses

- 🔵 ramalai13@gmail.com
- 🟢 lightzspeedindia@gmail.com
- 🟡 codemindsdigital@gmail.com

---

## Step 1: Fix Invalid Emails (5 minutes)

Run this command first:

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso" && npx tsx scripts/fix-invalid-emails-prisma.ts
```

**Expected output:**

```
✅ SUCCESS! All invalid emails have been fixed.
```

---

## Step 2: Quick Test (30 minutes)

### Test A: Password Reset (5 min) 🔥 START HERE

1. Go to: https://testone.intotni.com/signin
2. Click "Forgot Password"
3. Enter: **lightzspeedindia@gmail.com**
4. Click "Send Reset Link"
5. **Check inbox**: lightzspeedindia@gmail.com
6. Click reset link
7. Set new password
8. **Check inbox again** for success confirmation

**Expected**: 2 emails received ✅

---

### Test B: Document Signing (10 min)

1. Login as: **ramalai13@gmail.com**
2. Click "New Document"
3. Upload any PDF file
4. Title: "Test Contract"
5. Click "Add Recipient"
   - Email: **lightzspeedindia@gmail.com**
   - Name: Test User
   - Role: Signer
6. Add signature field (drag to document)
7. Click "Send"
8. **Check inbox**: lightzspeedindia@gmail.com
9. Open signing link
10. Sign the document
11. **Check inbox**: ramalai13@gmail.com

**Expected**: 3 emails total ✅

- Signing request → lightzspeedindia@gmail.com
- Signed notification → ramalai13@gmail.com
- Completion → both accounts

---

### Test C: Document Rejection (5 min)

1. Login as: **ramalai13@gmail.com**
2. Create new document
3. Add recipient: **codemindsdigital@gmail.com**
4. Send document
5. As **codemindsdigital@gmail.com**, open link
6. Click "Reject"
7. Enter reason: "Terms not acceptable"
8. **Check both inboxes**

**Expected**: 2 emails ✅

- Rejection confirmation → codemindsdigital@gmail.com
- Rejection notification → ramalai13@gmail.com

---

## Step 3: Document Results

Use this template: **EMAIL_TESTING_RESULTS_TEMPLATE.md**

Quick checklist:

- [ ] Test A: Password Reset - ✅/❌
- [ ] Test B: Document Signing - ✅/❌
- [ ] Test C: Document Rejection - ✅/❌

---

## Step 4: Full Testing (Optional - 2 hours)

See: **EMAIL_TESTING_PLAN_WITH_TEST_EMAILS.md**

This covers all 16 email types:

- 4 Authentication emails
- 5 Document workflow emails
- 5 Organisation/Team emails
- 2 Advanced feature emails

---

## Quick Reference

### All Documentation Files

1. **START_EMAIL_TESTING_HERE.md** ⭐ (This file - Start here!)
2. **QUICK_EMAIL_TEST_REFERENCE.md** - Quick reference card
3. **EMAIL_TESTING_PLAN_WITH_TEST_EMAILS.md** - Complete testing plan
4. **EMAIL_TESTING_RESULTS_TEMPLATE.md** - Results template
5. **EMAIL_TRIGGERS_COMPLETE_FLOW.md** - Technical flow details
6. **EMAIL_FLOW_COMPARISON_SUMMARY.md** - Flow comparison
7. **EMAIL_TESTING_GUIDE.md** - General testing guide

### Scripts

1. **scripts/fix-invalid-emails-prisma.ts** - Fix invalid emails
2. **scripts/test-all-email-triggers.ts** - Automated tests
3. **fix-invalid-emails-dokploy.sh** - Bash fix script

---

## Troubleshooting

### Email not received?

1. **Check spam folder** - Gmail may filter automated emails
2. **Check Resend dashboard** - https://resend.com/emails
3. **Check application logs**:
   ```bash
   docker logs <container-id> | grep -i "email\|mailer"
   ```
4. **Verify email settings** in document meta

### Link not working?

1. Check NEXT_PUBLIC_WEBAPP_URL is correct
2. Token may have expired (generate new one)
3. Check application is running

### TRPC validation error?

1. Run the fix script again
2. Restart application
3. Check for new invalid emails

---

## Success Criteria

✅ **All 3 quick tests pass** = Core email system working

⚠️ **Some tests fail** = Specific email types need debugging

❌ **All tests fail** = Check:

- Resend API key configured
- Database connection working
- Application running correctly

---

## Expected Timeline

- **Step 1** (Fix emails): 5 minutes
- **Step 2** (Quick tests): 30 minutes
- **Step 3** (Document): 10 minutes
- **Step 4** (Full testing): 2 hours (optional)

**Total for quick validation**: ~45 minutes

---

## After Testing

### If All Tests Pass ✅

1. Document results in template
2. Monitor Resend dashboard for delivery rates
3. Set up email monitoring/alerts
4. Add database constraints to prevent invalid emails

### If Some Tests Fail ⚠️

1. Document which emails failed
2. Check specific email settings
3. Review application logs
4. Debug specific handlers
5. Re-test after fixes

### If All Tests Fail ❌

1. Verify Resend API key is correct
2. Check DATABASE_URL is correct
3. Verify application is running
4. Check for configuration issues
5. Review environment variables

---

## Support Resources

### Check Email Status

```bash
npx tsx scripts/test-all-email-triggers.ts
```

### Check Database Connection

```bash
npx prisma db pull --schema packages/prisma/schema.prisma
```

### Check Application Logs

```bash
docker logs <container-id> --tail 100
```

### Resend Dashboard

https://resend.com/emails

---

## Ready to Start? 🚀

**Run this command first:**

```bash
export DATABASE_URL="postgresql://admin:hl44uy2yogavlaql@dsosigntusk-dsodb-hwrqbp:5432/dso" && npx tsx scripts/fix-invalid-emails-prisma.ts
```

**Then start with Test A (Password Reset)** - Takes only 5 minutes!

---

## Questions?

- See **EMAIL_TESTING_PLAN_WITH_TEST_EMAILS.md** for detailed steps
- See **QUICK_EMAIL_TEST_REFERENCE.md** for quick reference
- See **EMAIL_TRIGGERS_COMPLETE_FLOW.md** for technical details

---

**Good luck with testing!** 🎉

Remember: Signup confirmation already works ✅, so the core system is solid!
