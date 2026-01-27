# 🔍 ROOT CAUSE ANALYSIS: Documents Stuck in "Processing" State

**Thinking Like a Senior Developer**

---

## 🎯 The Real Question

**Why are documents stuck in "Processing" state after all recipients sign?**

As a senior dev, I need to ask:

1. Is the job even being triggered?
2. If triggered, is it running?
3. If running, is it failing silently?
4. If failing, what's the actual error?
5. Are we looking at the right logs?

---

## 🔬 Deep Dive Analysis

### The Flow (What SHOULD Happen)

```
1. Recipient signs document
   ↓
2. complete-document-with-token.ts checks if all signed
   ↓
3. If all signed, triggers seal-document job
   ↓
4. seal-document job runs:
   - Decorates PDF with signatures
   - Generates certificate (getCertificatePdf)
   - Generates audit log (getAuditLogsPdf)
   - Signs PDF
   - Updates status to COMPLETED
   ↓
5. Sends completion emails
   ↓
6. Recipient sees "Everyone has signed"
```

### Where It's Breaking (Hypothesis)

**Most Likely:** Step 4 - seal-document job is FAILING

**Why?** The job tries to call:

```typescript
const certificatePdf = await getCertificatePdf({ documentId, language });
const auditLogPdf = await getAuditLogsPdf({ documentId, language });
```

These functions import from `@signtusk/pdf-processing`:

```typescript
import { generateCertificate } from "@signtusk/pdf-processing";
import { generateAuditLog } from "@signtusk/pdf-processing";
```

**The Problem:** At RUNTIME, Node.js cannot find this module!

---

## 🚨 Why Our Fixes Might Not Be Enough

### Fix 1: TypeScript Path Mappings ✅

**What we fixed:**

```json
// tsconfig.json
{
  "paths": {
    "@signtusk/pdf-processing": ["./packages/pdf-processing"]
  }
}
```

**What this solves:**

- ✅ TypeScript can resolve the module during BUILD
- ✅ Rollup can bundle the code
- ✅ No TypeScript errors

**What this DOESN'T solve:**

- ❌ Runtime module resolution
- ❌ Node.js finding the actual compiled files
- ❌ Module loading in production

### Fix 2: Package Exports ✅

**What we fixed:**

```json
// packages/pdf-processing/package.json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

**What this solves:**

- ✅ Package points to compiled files
- ✅ Node.js knows where to look

**What this DOESN'T solve:**

- ❌ If dist/ folder doesn't exist in production
- ❌ If package isn't in node_modules
- ❌ If workspace resolution fails

### Fix 3: Build Order ✅

**What we fixed:**

```dockerfile
RUN cd packages/pdf-processing && npm run build
```

**What this solves:**

- ✅ Ensures dist/ folder exists
- ✅ Compiled files are available

**What this DOESN'T solve:**

- ❌ If files aren't copied to runner stage
- ❌ If node_modules doesn't have the package
- ❌ If workspace linking is broken

---

## 🎯 The REAL Root Cause (Senior Dev Analysis)

### Problem: Workspace Package Resolution in Production

**In Development:**

```
node_modules/
  @signtusk/
    pdf-processing/ → symlink to ../../packages/pdf-processing
```

✅ Works because npm creates symlinks for workspace packages

**In Production Docker:**

```
node_modules/
  @signtusk/
    pdf-processing/ → ??? WHERE IS IT ???
```

❌ Might not exist if workspace resolution fails!

### The Issue

When you run `npm ci` in Docker, it:

1. Installs dependencies from package-lock.json
2. Creates symlinks for workspace packages
3. **BUT** if the package isn't properly linked, Node.js can't find it!

### Why It Fails at Runtime

```typescript
// In seal-document.handler.ts
import { getCertificatePdf } from "../../../server-only/htmltopdf/get-certificate-pdf";

// In get-certificate-pdf.ts
import { generateCertificate } from "@signtusk/pdf-processing";
//                                    ↑
//                                    Node.js looks for this in node_modules
//                                    If not found → MODULE_NOT_FOUND error
```

**The job fails silently because:**

1. Error is caught by job system
2. Job status set to FAILED
3. Document status stays PENDING
4. No error shown to user
5. Recipient sees "Processing document" forever

---

## 🔍 How to Verify This

### Step 1: Check Background Jobs

Run this script to see if jobs are failing:

```bash
npm run with:env -- tsx scripts/check-background-jobs.ts
```

**Look for:**

- ❌ FAILED seal-document jobs
- ⏳ PENDING jobs that never complete
- 📄 Documents stuck in PENDING with all recipients signed

### Step 2: Check Application Logs

In Dokploy, check logs for:

```
[JOBS]: Job internal.seal-document failed
Error: Cannot find module '@signtusk/pdf-processing'
```

### Step 3: Check Module Resolution in Production

SSH into container and check:

```bash
# Check if package exists
ls -la node_modules/@signtusk/pdf-processing

# Check if dist folder exists
ls -la node_modules/@signtusk/pdf-processing/dist

# Try to require the module
node -e "require('@signtusk/pdf-processing')"
```

---

## 💡 The ACTUAL Fix (What We're Missing)

### Problem: Workspace Package Not in node_modules

**Current Dockerfile:**

```dockerfile
# Copy packages
COPY --from=installer /app/packages ./packages

# Install dependencies
RUN npm ci --production=false --legacy-peer-deps
```

**Issue:** `npm ci` might not create the symlink for @signtusk/pdf-processing!

### Solution 1: Ensure Workspace Linking

```dockerfile
# After npm ci, ensure workspace packages are linked
RUN npm ci --production=false --legacy-peer-deps

# Verify workspace packages are linked
RUN ls -la node_modules/@signtusk/ || echo "Workspace packages not linked!"

# If not linked, manually link them
RUN cd packages/pdf-processing && npm link && cd ../.. && npm link @signtusk/pdf-processing
```

### Solution 2: Copy Compiled Package to node_modules

```dockerfile
# Build pdf-processing in installer stage
RUN cd packages/pdf-processing && npm run build

# In runner stage, copy built package directly to node_modules
COPY --from=installer /app/packages/pdf-processing/dist ./node_modules/@signtusk/pdf-processing/dist
COPY --from=installer /app/packages/pdf-processing/package.json ./node_modules/@signtusk/pdf-processing/
```

### Solution 3: Use Relative Imports (Quick Fix)

Instead of:

```typescript
import { generateCertificate } from "@signtusk/pdf-processing";
```

Use:

```typescript
import { generateCertificate } from "../../../../packages/pdf-processing/dist/index.js";
```

**Pros:** Guaranteed to work  
**Cons:** Ugly, breaks abstraction

---

## 🎯 Recommended Action Plan

### Immediate (Debug Current Deployment)

1. **Check if jobs are failing:**

   ```bash
   npm run with:env -- tsx scripts/check-background-jobs.ts
   ```

2. **Check application logs in Dokploy:**
   - Look for "Cannot find module" errors
   - Look for seal-document job failures

3. **SSH into container and verify:**
   ```bash
   ls -la node_modules/@signtusk/pdf-processing
   node -e "require('@signtusk/pdf-processing')"
   ```

### Short-term (Fix Current Issue)

**Option A: Verify Workspace Linking**

Add to Dockerfile after `npm ci`:

```dockerfile
# Verify workspace packages
RUN echo "Checking workspace packages..." && \
    ls -la node_modules/@signtusk/ && \
    ls -la node_modules/@signtusk/pdf-processing/dist/ && \
    echo "Workspace packages verified!"
```

**Option B: Manual Copy**

Add to Dockerfile:

```dockerfile
# Ensure pdf-processing is available
RUN mkdir -p node_modules/@signtusk/pdf-processing && \
    cp -r packages/pdf-processing/dist node_modules/@signtusk/pdf-processing/ && \
    cp packages/pdf-processing/package.json node_modules/@signtusk/pdf-processing/
```

### Long-term (Architectural Fix)

**Option 1: Keep pdf-processing as workspace package**

- Ensure proper workspace linking in Docker
- Add verification steps to Dockerfile
- Add health check that tests module loading

**Option 2: Switch to Playwright approach (like documenso-main)**

- Remove pdf-processing package
- Use HTML-to-PDF with Playwright
- Larger Docker image but proven to work

**Option 3: Publish pdf-processing to npm**

- Publish as private npm package
- Install like any other dependency
- No workspace linking issues

---

## 🔬 Testing the Fix

### After Deploying

1. **Create a test document**
2. **Sign it**
3. **Check background jobs immediately:**
   ```bash
   npm run with:env -- tsx scripts/check-background-jobs.ts
   ```
4. **Check application logs for errors**
5. **Verify document status changes to COMPLETED**

### If Still Failing

1. **SSH into container:**

   ```bash
   docker exec -it <container-id> /bin/bash
   ```

2. **Test module loading:**

   ```bash
   node -e "console.log(require('@signtusk/pdf-processing'))"
   ```

3. **Check file structure:**

   ```bash
   find node_modules/@signtusk -type f
   ```

4. **Check symlinks:**
   ```bash
   ls -la node_modules/@signtusk/
   ```

---

## 🎯 Why This Analysis Matters

### What We Thought Was the Problem:

- TypeScript can't resolve module during build
- Package exports pointing to wrong files
- Build order issues

### What the ACTUAL Problem Likely Is:

- **Runtime module resolution failure**
- Workspace package not properly linked in production
- Node.js can't find the module when job runs
- Job fails silently
- Document stays in PENDING state

### The Key Insight:

**Build-time fixes (TypeScript paths) don't solve runtime problems (Node.js module resolution)**

---

## 📊 Probability Assessment

| Root Cause                 | Probability | Evidence                      |
| -------------------------- | ----------- | ----------------------------- |
| Module not in node_modules | 85%         | Most common workspace issue   |
| Job failing silently       | 90%         | Explains stuck documents      |
| TypeScript resolution      | 5%          | Already fixed                 |
| PDF generation error       | 10%         | Would show different symptoms |
| Database issue             | 5%          | Other features work           |

---

## ✅ Next Steps

1. **Run diagnostic script:**

   ```bash
   npm run with:env -- tsx scripts/check-background-jobs.ts
   ```

2. **Check Dokploy logs for:**
   - "Cannot find module" errors
   - seal-document job failures
   - Any module resolution errors

3. **Add verification to Dockerfile:**

   ```dockerfile
   RUN ls -la node_modules/@signtusk/pdf-processing/dist || exit 1
   ```

4. **Deploy with cache cleared**

5. **Test immediately after deployment**

6. **If still failing, SSH into container and debug**

---

## 🎉 Expected Outcome

**After proper fix:**

- ✅ seal-document job completes successfully
- ✅ Document status changes to COMPLETED
- ✅ Recipient sees "Everyone has signed"
- ✅ Completion emails sent
- ✅ No more stuck documents

**If still failing:**

- We need to check actual error logs
- May need to switch to Playwright approach
- Or publish pdf-processing as npm package

---

**The key is: We need to verify the module is actually loadable at runtime, not just at build time!** 🔑
