# Deployment Checklist - Serverless Timeout Fix

## Changes Summary

Fixed the "Processing document" infinite loader issue caused by Vercel's 10-second timeout.

### Root Cause

- `seal-document` job takes 15-30 seconds (PDF processing + signing)
- Vercel Hobby plan has 10-second timeout
- Jobs were running inline, blocking HTTP requests
- Timeout killed jobs, leaving documents stuck in PENDING

### Solution

1. **Disabled inline job execution** - Jobs now run via HTTP (async)
2. **Added Vercel Cron** - Processes stuck documents every minute
3. **Increased timeout tolerance** - Better reliability on cold starts

## Files Modified

### 1. `packages/lib/jobs/client/local.ts`

- Line 225: Disabled inline execution (`const isServerless = false`)
- Line 252: Increased timeout from 150ms to 2000ms

### 2. `vercel.json`

- Added cron job configuration:
  ```json
  "crons": [
    {
      "path": "/api/cron/process-pending-documents",
      "schedule": "* * * * *"
    }
  ]
  ```

### 3. `apps/remix/server/router.ts`

- Added import: `import cronRoute from "./api/cron/route"`
- Added route: `app.route("/api/cron", cronRoute)`

## Files Created

### 1. `apps/remix/server/api/cron/route.ts`

- Hono route handler for cron endpoints
- Includes optional cron secret verification

### 2. `apps/remix/server/api/cron/process-pending-documents.ts`

- Main cron job logic
- Finds stuck documents (all signed but status PENDING)
- Checks for stuck jobs (PROCESSING >5 minutes)
- Triggers new seal-document jobs
- Processes up to 10 documents per run

### 3. `SERVERLESS_TIMEOUT_FIX.md`

- Comprehensive documentation
- Problem analysis
- Solution details
- Deployment steps
- Troubleshooting guide

### 4. `DEPLOYMENT_CHECKLIST.md`

- This file

## Pre-Deployment Checklist

- [x] Code changes completed
- [x] TypeScript compilation passes
- [x] No diagnostic errors
- [ ] Code committed to git
- [ ] Ready to push to Vercel

## Deployment Steps

### 1. Commit Changes

```bash
git add .
git commit -m "Fix: Serverless timeout issues with Vercel Cron

- Disable inline job execution to prevent blocking requests
- Add Vercel Cron to process stuck documents every minute
- Increase job timeout tolerance from 150ms to 2000ms
- Create cron endpoint for processing pending documents

Fixes documents stuck in 'Processing document' state"
```

### 2. Push to Vercel

```bash
git push origin main
```

Vercel will automatically:

- Build the application
- Deploy to production
- Configure the cron job

### 3. Verify Deployment

**Check Vercel Dashboard:**

1. Go to your project
2. Click "Cron Jobs" tab
3. Verify `process-pending-documents` is listed
4. Schedule should show: `* * * * *` (every minute)

**Check Logs:**

```bash
vercel logs --follow
```

Look for:

```
[CRON] Starting process-pending-documents job
[CRON] Found X stuck documents
[CRON] Process-pending-documents job completed
```

### 4. Test the Fix

**Create Test Document:**

1. Log in to your app
2. Create a new document
3. Add a recipient
4. Send for signing

**Sign as Recipient:**

1. Open recipient link
2. Add signature/fields
3. Click "Complete"

**Expected Behavior:**

- Should see "Processing document" page
- Within 1 minute, document should complete
- Status should change to COMPLETED
- No infinite loader

**If It Fails:**

- Check Vercel logs for errors
- Check cron job execution in dashboard
- Run diagnostic: `npx tsx scripts/check-completion-flow.ts <token>`

## Post-Deployment Verification

### 1. Check Cron Execution

```bash
# View recent logs
vercel logs --since 5m

# Filter for cron logs
vercel logs --since 5m | grep CRON
```

Expected output:

```
[CRON] Starting process-pending-documents job
[CRON] Found 0 stuck documents
[CRON] Process-pending-documents job completed
```

### 2. Test Cron Endpoint Manually

```bash
curl https://your-domain.com/api/cron/process-pending-documents
```

Expected response:

```json
{
  "success": true,
  "processed": 0,
  "timestamp": "2026-01-05T..."
}
```

### 3. Monitor for Stuck Documents

Run this query in your database:

```sql
-- Find documents stuck in PENDING
SELECT
  e.id,
  e."secondaryId",
  e.status,
  e."createdAt",
  COUNT(r.id) as total_recipients,
  COUNT(CASE WHEN r."signingStatus" = 'SIGNED' OR r.role = 'CC' THEN 1 END) as signed_recipients
FROM "Envelope" e
LEFT JOIN "Recipient" r ON r."envelopeId" = e.id
WHERE e.type = 'DOCUMENT'
  AND e.status = 'PENDING'
GROUP BY e.id, e."secondaryId", e.status, e."createdAt"
HAVING COUNT(r.id) = COUNT(CASE WHEN r."signingStatus" = 'SIGNED' OR r.role = 'CC' THEN 1 END);
```

Should return 0 rows after cron runs.

### 4. Check Job Status

```sql
-- Find recent seal-document jobs
SELECT
  id,
  "jobId",
  status,
  "createdAt",
  "updatedAt",
  "completedAt",
  retried
FROM "BackgroundJob"
WHERE "jobId" = 'internal.seal-document'
ORDER BY "createdAt" DESC
LIMIT 10;
```

Look for:

- Status: COMPLETED (good)
- Status: FAILED (check logs)
- Status: PROCESSING for >5 minutes (will be retried by cron)

## Optional: Add Cron Secret

For additional security:

```bash
# Generate secret
SECRET=$(openssl rand -base64 32)
echo $SECRET

# Add to Vercel
vercel env add CRON_SECRET production
# Paste the secret when prompted

# Redeploy
vercel --prod
```

The cron endpoint will now verify the secret:

```typescript
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return c.json({ error: "Unauthorized" }, 401);
}
```

## Rollback Plan

If issues occur after deployment:

### Quick Rollback

```bash
# Revert to previous deployment
vercel rollback
```

### Manual Rollback

```bash
# Revert code changes
git revert HEAD
git push origin main
```

### Emergency Fix

If documents are stuck:

```bash
# Run manual completion script
npx tsx scripts/force-complete-document.ts <documentId>
```

## Known Limitations

### Current Setup

- **Max processing time**: 10 seconds (Hobby) or 30 seconds (current config)
- **Retry delay**: Up to 1 minute (cron frequency)
- **Concurrent processing**: Limited by Vercel function concurrency

### If Jobs Still Timeout

**Option 1: Upgrade to Vercel Pro**

- Cost: $20/month per member
- Timeout: 60 seconds
- Update `vercel.json`: `"maxDuration": 60`

**Option 2: Use External Job Service**

- Trigger.dev (recommended)
- Inngest
- Upstash QStash
- See `SERVERLESS_ISSUES_FIX.md` for details

**Option 3: Optimize PDF Processing**

- Disable certificate/audit log generation
- Compress PDFs before upload
- Limit page count

## Monitoring Recommendations

### Set Up Alerts

**Vercel Dashboard:**

- Enable email notifications for function errors
- Monitor cron job execution

**Database Monitoring:**

- Alert on documents stuck in PENDING >5 minutes
- Alert on jobs stuck in PROCESSING >10 minutes

### Regular Checks

**Daily:**

- Check Vercel logs for cron errors
- Verify no stuck documents in database

**Weekly:**

- Review job completion rates
- Check average processing times
- Monitor timeout frequency

## Success Criteria

- ✅ Documents complete within 1 minute of signing
- ✅ No infinite "Processing document" loaders
- ✅ Cron job runs every minute without errors
- ✅ No documents stuck in PENDING state
- ✅ seal-document jobs complete or retry automatically

## Support

If issues persist:

1. Check `SERVERLESS_TIMEOUT_FIX.md` for detailed troubleshooting
2. Review Vercel logs: `vercel logs --follow`
3. Run diagnostics: `npx tsx scripts/check-completion-flow.ts <token>`
4. Check database for stuck documents (query above)
5. Verify cron job is running in Vercel dashboard

---

**Ready to Deploy?**

```bash
git add .
git commit -m "Fix: Serverless timeout issues with Vercel Cron"
git push origin main
```

Then verify in Vercel Dashboard → Cron Jobs
