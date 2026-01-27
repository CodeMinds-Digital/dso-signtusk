# Native Module Build - Explained

## What You're Seeing

```dockerfile
RUN npm run build -- --target x86_64-unknown-linux-gnu || \
    echo "⚠️  Build failed, will try to use pre-built module if available"
```

## Is This an Error? ❓

**No, this is intentional!** It's a fallback mechanism.

## How It Works

### Step 1: Try to Build

```dockerfile
npm run build -- --target x86_64-unknown-linux-gnu
```

Attempts to compile the Rust native module for Linux x64.

### Step 2: Fallback (if build fails)

```dockerfile
|| echo "⚠️  Build failed, will try to use pre-built module if available"
```

If the build fails, it prints a warning but **continues** instead of stopping.

### Step 3: Verification (The Important Part!)

```dockerfile
RUN ls -la *.node && \
    (test -f pdf-sign.linux-x64-gnu.node && \
     echo "✅ Native module ready for Linux x64 GNU") || \
    (echo "❌ Native module NOT found!" && exit 1)
```

This checks if the `.node` file exists (either from the build or pre-existing).

**If this step passes**: ✅ Everything is fine!
**If this step fails**: ❌ Build stops with error

## Why This Design?

This allows the build to work in multiple scenarios:

1. **Fresh build**: Compiles from source ✅
2. **Pre-built module exists**: Uses existing file ✅
3. **Build fails AND no pre-built**: Verification fails, build stops ❌

## How to Tell if It's Working

### ✅ Success Indicators

Look for these in your build logs:

```
#47 [installer 34/40] RUN npm run build -- --target x86_64-unknown-linux-gnu
#47 ... (build output)
#47 DONE

#48 [installer 35/40] RUN ls -la *.node
#48 -rw-r--r-- 1 root root 1234567 Jan 26 14:00 pdf-sign.linux-x64-gnu.node
#48 ✅ Native module ready for Linux x64 GNU
#48 DONE
```

### ❌ Failure Indicators

If you see:

```
#47 [installer 34/40] RUN npm run build -- --target x86_64-unknown-linux-gnu
#47 ⚠️  Build failed, will try to use pre-built module if available
#47 DONE

#48 [installer 35/40] RUN ls -la *.node
#48 ❌ Native module NOT found!
#48 ERROR: executor failed
```

Then the build actually failed.

## What to Check

### 1. Did the Build Complete?

Look for the verification step output:

```bash
# In your build logs, search for:
"Native module ready for Linux x64 GNU"
```

If you see this: ✅ Build succeeded (either compiled or used pre-built)

### 2. Check the Runtime Logs

When the app runs, check if the module loads:

```bash
docker logs <container-id> 2>&1 | grep -i "pdf-sign"
```

Should see:

```
✅ [SEAL-DOCUMENT] PDF loaded successfully
```

Should NOT see:

```
❌ Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
```

## Common Scenarios

### Scenario 1: Build Succeeds

```
Step 1: npm run build ✅ Compiles successfully
Step 2: Verification ✅ File exists
Result: ✅ Everything works
```

### Scenario 2: Build Fails, Pre-built Exists

```
Step 1: npm run build ❌ Fails (prints warning)
Step 2: Verification ✅ Pre-built file exists
Result: ✅ Uses pre-built module
```

### Scenario 3: Build Fails, No Pre-built

```
Step 1: npm run build ❌ Fails (prints warning)
Step 2: Verification ❌ No file found
Result: ❌ Build stops with error
```

## Your Situation

Based on your earlier logs showing:

```
[SEAL-DOCUMENT] PDF loaded successfully, pages: 1
[SEAL-DOCUMENT] PDF saved, size: 15448 bytes
```

**Your native module IS working!** ✅

The build either:

1. Compiled successfully, OR
2. Used a pre-built module

Either way, it's working in production.

## Why the `||` Fallback?

This design is useful because:

1. **Faster builds**: If pre-built module exists, skip compilation
2. **Resilience**: Build doesn't fail if Rust compilation has issues but module exists
3. **Flexibility**: Works in different environments (with/without Rust)

## Should You Worry?

**No, if:**

- ✅ Build completes without error
- ✅ Verification step passes
- ✅ App runs and processes PDFs

**Yes, if:**

- ❌ Verification step fails
- ❌ App crashes with "Cannot find module" error
- ❌ PDFs don't process

## Summary

The `|| echo` is **not an error** - it's a safety mechanism.

**What matters**: Did the verification step pass?

If you see `✅ Native module ready for Linux x64 GNU` in your build logs, everything is fine!

---

**Your native module is working (based on earlier logs). The `||` is just a fallback mechanism, not an error!** ✅
