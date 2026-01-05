# Document Completion Not Triggered - Diagnosis

## Issue Found

**Document:** `11.offer letter (present employer).pdf`  
**Envelope ID:** `envelope_cchddamykamkxkld`  
**Token:** `St3TgPEP-AjfQZQoAYjWZ`  
**Status:** PENDING  
**All Recipients Signed:** YES ✅  
**seal-document Job Created:** NO ❌

## Root Cause

The `seal-document` job was **never created**, which means `completeDocumentWithToken()` was either:

1. Never called at all
2. Called but the "all recipients signed" check failed
3. Called but threw an error before triggering the job

## What Should Happen

```
User clicks "Complete" button
  ↓
completeDocumentWithToken() called
  ↓
Mark recipient as SIGNED
  ↓
Check: All recipients signed?
  ↓ YES
Trigger seal-document job
  ↓
Job runs and completes document
```

## What's Actually Happening

```
User clicks "Complete" button
  ↓
??? (completeDocumentWithToken may not be called)
  ↓
Recipient marked as SIGNED ✅
  ↓
seal-document job NEVER triggered ❌
  ↓
Document stuck in PENDING
```

## Possible Causes

### 1. Complete Button Not Working

The complete button might not be calling the mutation properly.

**Check:** Look at browser console for errors when clicking "Complete"

### 2. Mutation Called But Failed Silently

The `completeDocumentWithToken` mutation might be throwing an error before reaching the job trigger.

**Check:** Look at server logs for errors

### 3. "All Recipients Signed" Check Failing

The check might be failing even though all recipients are signed.

**Possible reasons:**

- CC recipients not being handled correctly
- Recipient role check failing
- Database query issue

### 4. Job Queue Not Running

The job might be triggered but not picked up by the worker.

**Check:** Is the job worker running?

## Diagnostic Steps

### Step 1: Check if completeDocumentWithToken is Being Called

I added logging to the function. Check your server logs for:

```
[COMPLETE-DOCUMENT] Function called with token: St3TgPEP-AjfQZQoAYjWZ
```

**If you see this:** The function is being called, proceed to Step 2  
**If you don't see this:** The complete button is not calling the mutation

### Step 2: Check if "All Recipients Signed" Check Passes

Look for this log:

```
[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
```

**If you see this:** The check passed, proceed to Step 3  
**If you see "Not all recipients have signed yet":** There's a bug in the check logic

### Step 3: Check if Job is Triggered

Look for this log:

```
[COMPLETE-DOCUMENT] Seal-document job triggered successfully
```

**If you see this:** Job was triggered, check if worker is running  
**If you don't see this:** Job trigger failed

### Step 4: Check for Errors

Look for any error messages in the logs between the function call and the job trigger.

## Quick Test

Try manually triggering the completion:

```bash
npx tsx scripts/test-seal-document.ts St3TgPEP-AjfQZQoAYjWZ
```

This will:

1. Check if all recipients have signed
2. Manually trigger the seal-document job
3. Show any errors

## Comparison with documenso-main

The code is **identical** between root and documenso-main. The issue must be:

1. **Environment difference** - Something in your environment is different
2. **Runtime error** - An error is being thrown but not logged
3. **Database state** - Something in the database is preventing the check from passing

## Next Steps

1. **Check server logs** when you click "Complete" button
2. **Look for the logging** we added
3. **Check browser console** for any errors
4. **Try the manual test** script above

## If Complete Button Doesn't Call the Mutation

This would mean there's an issue with the frontend. Possible causes:

1. **Validation failing** - Some field validation is preventing the mutation
2. **Button disabled** - The button might be disabled for some reason
3. **Error in mutation** - The mutation might be throwing an error in the frontend

**Check:** Browser console for errors when clicking "Complete"

## If Mutation is Called But Job Not Triggered

This would mean there's an issue in the backend logic. Possible causes:

1. **Error before job trigger** - An error is thrown before reaching the job trigger code
2. **Check logic failing** - The "all recipients signed" check is failing incorrectly
3. **Job client issue** - The job client is not working properly

**Check:** Server logs for errors and the logging we added

## Manual Fix for This Document

If you need to unblock this specific document right now:

```bash
# This will manually trigger the seal-document job
npx tsx scripts/test-seal-document.ts St3TgPEP-AjfQZQoAYjWZ
```

But this doesn't fix the root cause - you need to figure out why `completeDocumentWithToken` isn't triggering the job automatically.

---

**Action Required:** Check your server logs when clicking the "Complete" button and report back what you see.
