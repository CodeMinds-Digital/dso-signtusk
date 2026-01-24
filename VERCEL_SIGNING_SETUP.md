# Vercel Environment Setup for Document Signing

## Current Status - CRITICAL ISSUE FOUND

✅ `NEXT_PRIVATE_SIGNING_TRANSPORT` is set
❌ `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` is **MISSING** (required for signing)
❌ `NEXT_PRIVATE_SIGNING_PASSPHRASE` is **MISSING**

**This is why documents aren't being signed properly in production!**

## The Problem

In Vercel, you cannot use file paths because the filesystem is read-only. You must provide the certificate as a base64-encoded environment variable.

## Quick Fix

### Step 1: Convert Certificate to Base64

```bash
base64 -i apps/remix/example/cert.p12 | tr -d '\n' > cert.base64.txt
```

### Step 2: Add to Vercel

```bash
# Add certificate contents
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
# Paste contents from cert.base64.txt

vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS preview
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS development

# Add passphrase (empty for example cert)
vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE preview
vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE development

# Fix transport value
vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT production
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
# Enter: local
```

### Step 3: Redeploy

```bash
vercel --prod
```

## Automated Setup

Run the automated setup script:

```bash
npx tsx scripts/setup-vercel-signing.ts
```
