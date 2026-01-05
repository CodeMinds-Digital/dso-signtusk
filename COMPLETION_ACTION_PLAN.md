# Document Completion Not Working - Action Plan

## Critical Finding

**The `completeDocumentWithToken` function is NOT being called when the recipient clicks "Complete".**

Evidence:

- ✅ Recipient marked as SIGNED (audit log shows `DOCUMENT_RECIPIENT_COMPLETED`)
- ❌ No seal-document job created
- ❌ No logging from `completeDocumentWithToken` (we added logging but it's not appearing)

## Root Cause

The "Complete" button in the signing UI is not calling the `completeDocumentWithToken` mutation.

## Why This Happens

Looking at the code flow:

```
User clicks "Complete" button
  ↓
EnvelopeSignerCompleteDialog component
  ↓
Calls: trpc.recipient.completeDocumentWithToken.useMutation()
  ↓
Should call: completeDocumentWithToken() function
  ↓
Should trigger: seal-document job
```

**But the mutation is not being called!**

## Possible Reasons

### 1. Frontend Validation Failing

The complete dialog might have validation that's preventing the mutation from being called.

**Check:** `apps/remix/app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx`

Look for validation logic that might be blocking the mutation.

### 2. Button Not Wired Correctly

The complete button might not be properly connected to the mutation.

**Check:** Is the button actually calling `handleOnCompleteClick`?

### 3. Mutation Failing Silently

The mutation might be throwing an error that's being caught and not logged.

**Check:** Browser console for errors when clicking "Complete"

### 4. Wrong Component Being Used

The app might be using a different signing flow that doesn't call this mutation.

**Check:** Which signing page component is actually being rendered?

## Immediate Actions

### Action 1: Check Browser Console

When you click the "Complete" button:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Complete" button
4. Look for:
   - Any error messages
   - Network requests to `/api/trpc/recipient.completeDocumentWithToken`
   - Any console.log messages

### Action 2: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Complete" button
4. Look for:
   - POST request to `/api/trpc/recipient.completeDocumentWithToken`
   - If it exists, check the response
   - If it doesn't exist, the mutation is not being called

### Action 3: Add Frontend Logging

Add logging to the complete dialog to see if the function is being called:

**File:** `apps/remix/app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx`

Add at the start of `handleOnCompleteClick`:

```typescript
const handleOnCompleteClick = async (...) => {
  console.log("[FRONTEND] Complete button clicked!");
  console.log("[FRONTEND] Token:", recipient.token);
  console.log("[FRONTEND] Document ID:", mapSecondaryIdToDocumentId(envelope.secondaryId));

  try {
    // existing code...
  } catch (err) {
    console.error("[FRONTEND] Complete failed:", err);
    // existing error handling...
  }
};
```

### Action 4: Check Server Logs

After clicking "Complete", check your server logs for:

```
[COMPLETE-DOCUMENT] Function called with token: St3TgPEP-AjfQZQoAYjWZ
```

If you don't see this, the mutation is not reaching the server.

## Diagnostic Commands

### Check if mutation endpoint exists:

```bash
# Search for the mutation definition
grep -r "completeDocumentWithToken" packages/trpc/server/recipient-router/
```

### Check if mutation is registered:

```bash
# Check the router exports
cat packages/trpc/server/recipient-router/router.ts | grep completeDocumentWithToken
```

### Manually trigger completion:

```bash
# This will manually complete the document
npx tsx -e "
import 'dotenv/config';
import { completeDocumentWithToken } from '@signtusk/lib/server-only/document/complete-document-with-token';

await completeDocumentWithToken({
  token: 'St3TgPEP-AjfQZQoAYjWZ',
  id: { type: 'documentId', id: 9 },
  userId: undefined,
});

console.log('Done!');
process.exit(0);
"
```

## Expected vs Actual Flow

### Expected Flow

```
1. User fills all fields ✅
2. User clicks "Complete" button ✅
3. Frontend calls completeDocumentWithToken mutation ❌ NOT HAPPENING
4. Backend marks recipient as SIGNED ✅ (This happened somehow)
5. Backend checks if all recipients signed ❌ NOT REACHED
6. Backend triggers seal-document job ❌ NOT REACHED
7. Job runs and completes document ❌ NOT REACHED
```

### Actual Flow

```
1. User fills all fields ✅
2. User clicks "Complete" button ✅
3. ??? Something marks recipient as SIGNED ✅
4. Nothing else happens ❌
```

## The Mystery

**How is the recipient being marked as SIGNED if `completeDocumentWithToken` is not being called?**

Possible explanations:

### Theory 1: Different Code Path

There might be another function that marks recipients as SIGNED without calling `completeDocumentWithToken`.

**Check:** Search for other places that update `signingStatus`:

```bash
grep -r "signingStatus.*SIGNED" packages/lib/server-only/
```

### Theory 2: Field Signing Auto-Completes

When the last field is signed, it might automatically mark the recipient as SIGNED without calling the complete function.

**Check:** `packages/trpc/server/field-router/sign-envelope-field.ts`

Look for logic that auto-completes the recipient.

### Theory 3: Old Data

The recipient might have been marked as SIGNED from a previous attempt, and we're looking at stale data.

**Check:** When was the recipient actually signed?

```bash
npx tsx scripts/check-completion-flow.ts St3TgPEP-AjfQZQoAYjWZ
# Look at the "Signed At" timestamp
```

## Next Steps

1. **Check browser console** when clicking "Complete"
2. **Check network tab** for the mutation request
3. **Check server logs** for the logging we added
4. **Search for alternative code paths** that mark recipients as SIGNED
5. **Add frontend logging** to see if the button handler is called

## Quick Fix for This Document

To unblock this specific document right now:

```bash
# Manually trigger the seal-document job
npx tsx scripts/test-seal-document.ts St3TgPEP-AjfQZQoAYjWZ
```

But this doesn't fix the root cause - you need to figure out why the complete mutation isn't being called.

## Files to Investigate

1. `apps/remix/app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx` - Complete button handler
2. `apps/remix/app/components/general/envelope-signing/envelope-signer-header.tsx` - Where complete dialog is rendered
3. `packages/trpc/server/recipient-router/router.ts` - Mutation definition
4. `packages/lib/server-only/document/complete-document-with-token.ts` - Backend logic
5. `packages/trpc/server/field-router/sign-envelope-field.ts` - Field signing logic (might auto-complete)

---

**Status:** Investigation needed
**Priority:** CRITICAL
**Action Required:** Check browser console and network tab when clicking "Complete" button
