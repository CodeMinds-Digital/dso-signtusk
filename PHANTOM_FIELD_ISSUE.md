# Phantom Field Issue - Diagnosis & Fix

## Problem Description

When a document is sent for signing with 2 fields assigned to a recipient:

- ❌ The signing screen shows 3 fields
- ❌ After completing 2 visible fields, the Next button remains disabled
- ❌ UI indicates 1 field is still pending (but not visible)
- ❌ Recipient cannot proceed

## Possible Causes

### 1. Duplicate Fields in Database

The most likely cause - a field was accidentally duplicated during document creation.

**How it happens:**

- Field is created
- Field is copied/duplicated
- Duplicate is not properly removed
- Both fields are assigned to the same recipient

### 2. Invisible Field

A field exists but is not visible due to:

- Zero width or height
- Positioned outside page bounds
- Hidden by CSS or rendering issue

### 3. Orphaned Field

A field exists in the database but is not properly linked to the recipient.

### 4. Field Meta Issue

A field has incorrect `fieldMeta` causing it to be counted but not displayed.

## Diagnosis

### Step 1: Run the Debug Script

```bash
# List recent envelopes
npx tsx scripts/debug-phantom-field.ts

# Debug specific envelope
npx tsx scripts/debug-phantom-field.ts <envelopeId>
```

This will show you:

- All fields assigned to each recipient
- Duplicate fields (same type, position, page)
- Invisible fields (zero size)
- Fields outside page bounds
- Orphaned fields

### Step 2: Check the Output

Look for these warnings:

**⚠️ Duplicate Fields:**

```
⚠️  Found 1 potential duplicate field(s):
  - Field 123 (SIGNATURE) at page 1, position (100, 200)
```

**⚠️ Invisible Fields:**

```
⚠️  Found 1 invisible field(s) (zero size):
  - Field 124 (TEXT): 0x0
```

**⚠️ Orphaned Fields:**

```
⚠️  Orphaned fields detected!
These fields exist but are not assigned to any recipient.
```

### Step 3: Check Database Directly

```sql
-- Find all fields for a specific envelope
SELECT
  f.id,
  f.type,
  f."recipientId",
  f.inserted,
  f.page,
  f."positionX",
  f."positionY",
  f.width,
  f.height,
  r.name as recipient_name,
  r.email as recipient_email
FROM "Field" f
LEFT JOIN "Recipient" r ON r.id = f."recipientId"
WHERE f."envelopeId" = '<envelope-id>'
ORDER BY f."recipientId", f.page, f."positionY";

-- Find duplicate fields (same recipient, type, position)
SELECT
  f1.id as field1_id,
  f2.id as field2_id,
  f1.type,
  f1."recipientId",
  f1.page,
  f1."positionX",
  f1."positionY"
FROM "Field" f1
JOIN "Field" f2 ON
  f1."envelopeId" = f2."envelopeId" AND
  f1."recipientId" = f2."recipientId" AND
  f1.type = f2.type AND
  f1.page = f2.page AND
  ABS(f1."positionX" - f2."positionX") < 5 AND
  ABS(f1."positionY" - f2."positionY") < 5 AND
  f1.id < f2.id
WHERE f1."envelopeId" = '<envelope-id>';
```

## Fixes

### Fix 1: Delete Duplicate Fields

If you found duplicate fields:

```sql
-- Delete the duplicate field (use the higher ID)
DELETE FROM "Field" WHERE id = <duplicate-field-id>;
```

**Important:** Make sure you're deleting the right field! Check which one is the duplicate.

### Fix 2: Delete Invisible Fields

If you found invisible fields:

```sql
-- Delete invisible fields
DELETE FROM "Field"
WHERE "envelopeId" = '<envelope-id>'
AND (width = 0 OR height = 0);
```

### Fix 3: Fix Orphaned Fields

If you found orphaned fields:

```sql
-- Option A: Delete orphaned fields
DELETE FROM "Field"
WHERE "envelopeId" = '<envelope-id>'
AND "recipientId" NOT IN (
  SELECT id FROM "Recipient" WHERE "envelopeId" = '<envelope-id>'
);

-- Option B: Assign to correct recipient
UPDATE "Field"
SET "recipientId" = <correct-recipient-id>
WHERE id = <orphaned-field-id>;
```

### Fix 4: Recreate the Document

If the issue is complex or you can't identify the problem:

1. **Create a new document** with the same content
2. **Carefully add fields** one by one
3. **Verify field count** before sending
4. **Send the new document**

## Prevention

### 1. Validate Field Count Before Sending

Add validation in the document creation flow:

```typescript
// Check for duplicate fields before sending
const duplicateFields = fields.filter(
  (field, index, arr) =>
    arr.findIndex(
      (f) =>
        f.recipientId === field.recipientId &&
        f.type === field.type &&
        f.page === field.page &&
        Math.abs(f.positionX - field.positionX) < 5 &&
        Math.abs(f.positionY - field.positionY) < 5 &&
        f.id !== field.id
    ) !== index
);

if (duplicateFields.length > 0) {
  throw new Error("Duplicate fields detected");
}
```

### 2. Add Field Count Display

Show field count in the UI before sending:

```typescript
// In the send dialog
<div>
  {recipients.map(recipient => (
    <div key={recipient.id}>
      {recipient.name}: {fields.filter(f => f.recipientId === recipient.id).length} fields
    </div>
  ))}
</div>
```

### 3. Add Logging

Log field operations to track when duplicates are created:

```typescript
console.log("[FIELD] Created field:", {
  id: field.id,
  type: field.type,
  recipientId: field.recipientId,
  page: field.page,
  position: { x: field.positionX, y: field.positionY },
});
```

## Testing After Fix

1. **Run the debug script** to verify the fix:

   ```bash
   npx tsx scripts/debug-phantom-field.ts <envelope-id>
   ```

2. **Check field count** matches expected:
   - Should show "No obvious issues detected"
   - Field count should match what you assigned

3. **Test signing** as the recipient:
   - All fields should be visible
   - Field counter should be accurate
   - Next button should enable after completing all fields

## Common Scenarios

### Scenario 1: Field Duplicated During Copy/Paste

**Symptoms:**

- Two identical fields at the same position
- Both have the same type and recipient

**Fix:**

```sql
-- Find and delete the duplicate (higher ID)
DELETE FROM "Field"
WHERE id IN (
  SELECT f2.id
  FROM "Field" f1
  JOIN "Field" f2 ON
    f1."envelopeId" = f2."envelopeId" AND
    f1."recipientId" = f2."recipientId" AND
    f1.type = f2.type AND
    f1.page = f2.page AND
    ABS(f1."positionX" - f2."positionX") < 5 AND
    ABS(f1."positionY" - f2."positionY") < 5 AND
    f1.id < f2.id
  WHERE f1."envelopeId" = '<envelope-id>'
);
```

### Scenario 2: Field Created But Not Visible

**Symptoms:**

- Field count is correct in database
- Field is not visible in UI
- Field has zero size or is outside bounds

**Fix:**

```sql
-- Delete invisible fields
DELETE FROM "Field"
WHERE "envelopeId" = '<envelope-id>'
AND (width <= 0 OR height <= 0 OR "positionX" < 0 OR "positionY" < 0);
```

### Scenario 3: Recipient Changed But Field Not Updated

**Symptoms:**

- Field is assigned to wrong recipient
- Field count doesn't match for each recipient

**Fix:**

```sql
-- Update field recipient
UPDATE "Field"
SET "recipientId" = <correct-recipient-id>
WHERE id = <field-id>;
```

## Monitoring

Add monitoring to catch this issue early:

```typescript
// In the envelope creation/update logic
const fieldCounts = recipients.map((r) => ({
  recipientId: r.id,
  count: fields.filter((f) => f.recipientId === r.id).length,
}));

console.log("[ENVELOPE] Field counts:", fieldCounts);

// Alert if any recipient has more than expected fields
if (fieldCounts.some((fc) => fc.count > 10)) {
  console.warn("[ENVELOPE] Unusually high field count detected");
}
```

## Related Files

- `scripts/debug-phantom-field.ts` - Diagnostic script
- `packages/lib/utils/advanced-fields-helpers.ts` - Field validation logic
- `apps/remix/app/components/general/document-signing/envelope-signing-provider.tsx` - Field filtering logic
- `apps/remix/app/components/general/document-signing/document-signing-page-view-v2.tsx` - UI rendering

## Support

If the issue persists after trying these fixes:

1. **Run the debug script** and save the output
2. **Check browser console** for JavaScript errors
3. **Check server logs** for backend errors
4. **Provide the envelope ID** and debug output for further investigation
