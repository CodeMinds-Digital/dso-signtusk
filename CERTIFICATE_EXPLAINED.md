# Certificate Setup Explained Simply

## What is a Certificate?

Think of it like a **digital signature stamp** that proves the PDF is authentic and hasn't been tampered with.

## Why Do You Need It?

When someone signs a document:

1. Their signature is added to the PDF
2. The PDF is "sealed" with the certificate
3. This proves the document is legally valid

**Without the certificate:** The signing process fails, documents stay "Pending"

## Two Ways to Store Certificates

### Option 1: "local" (What You're Using)

```
┌─────────────────────────────────────────────────┐
│  Your Application (Vercel)                      │
│                                                  │
│  ┌────────────────────────────────────┐        │
│  │ Environment Variable:              │        │
│  │ NEXT_PRIVATE_SIGNING_LOCAL_        │        │
│  │ FILE_CONTENTS = [certificate]      │        │
│  └────────────────────────────────────┘        │
│                                                  │
│  When signing needed:                           │
│  1. Read certificate from env variable          │
│  2. Sign the PDF                                │
│  3. Save signed PDF                             │
└─────────────────────────────────────────────────┘
```

**Pros:**

- ✅ Simple to set up
- ✅ Works in development AND production
- ✅ No extra services needed
- ✅ Free

**Cons:**

- ⚠️ Certificate stored as text (less secure)
- ⚠️ Need to rotate manually

### Option 2: "gcloud-hsm" (Enterprise)

```
┌─────────────────────────────────────────────────┐
│  Your Application (Vercel)                      │
│                                                  │
│  When signing needed:                           │
│  1. Send PDF to Google Cloud ──────────┐       │
│  2. Wait for signed PDF                 │       │
│  3. Receive signed PDF ←────────────────┘       │
│  4. Save signed PDF                             │
└─────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│  Google Cloud HSM                               │
│  (Hardware Security Module)                     │
│                                                  │
│  Certificate stored in secure hardware          │
│  Never leaves Google's servers                  │
└─────────────────────────────────────────────────┘
```

**Pros:**

- ✅ Very secure (hardware-based)
- ✅ Automatic rotation
- ✅ Audit logs
- ✅ Compliance-ready (SOC2, HIPAA)

**Cons:**

- ❌ Complex setup
- ❌ Costs money (~$1-5/month)
- ❌ Requires Google Cloud account

## Current Situation

### What You Have Now:

```
Local Development (.env file):
✅ NEXT_PRIVATE_SIGNING_TRANSPORT = "local"
✅ NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH = "./apps/remix/example/cert.p12"
✅ Certificate file exists

Vercel Production:
❌ NEXT_PRIVATE_SIGNING_TRANSPORT = "EnUmAfT@2)2%" (WRONG!)
❌ NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS = (MISSING!)
❌ NEXT_PRIVATE_SIGNING_PASSPHRASE = (MISSING!)
```

### What You Need:

```
Vercel Production:
✅ NEXT_PRIVATE_SIGNING_TRANSPORT = "local"
✅ NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS = [base64 certificate]
✅ NEXT_PRIVATE_SIGNING_PASSPHRASE = "" (empty)
```

## Why Base64?

In Vercel (serverless), you can't use files. So we convert the certificate to text:

```
Certificate File (.p12)          Base64 Text
┌──────────────┐                ┌────────────────────────────┐
│ Binary data  │  ──convert──>  │ MIIKPAIBAzCCCfwGCSqGSIb... │
│ (2637 bytes) │                │ (3516 characters)          │
└──────────────┘                └────────────────────────────┘
     ↓                                      ↓
Can't use in Vercel              Can store as env variable
```

## The Fix Process

### Step 1: Convert Certificate (Already Done!)

```bash
base64 -i apps/remix/example/cert.p12 > cert.base64.txt
```

Result: `cert.base64.txt` contains the certificate as text

### Step 2: Add to Vercel

**Using CLI:**

```bash
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
# Paste the content from cert.base64.txt
```

**Using Dashboard:**

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Add the variable with the certificate content

### Step 3: Fix Transport Value

```bash
vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT production
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
# Type: local
```

### Step 4: Deploy

```bash
vercel --prod
```

## How It Works After Fix

### Before (Broken):

```
User signs document
    ↓
Try to sign PDF
    ↓
❌ Certificate not found!
    ↓
Job fails silently
    ↓
Document stays "Pending"
```

### After (Fixed):

```
User signs document
    ↓
Trigger seal-document job
    ↓
Load certificate from env variable
    ↓
✅ Sign PDF successfully
    ↓
Save signed PDF
    ↓
Update status to "Completed"
    ↓
✅ User can view/download signed PDF
```

## Security Notes

### Is "local" Secure Enough?

**For most businesses: YES**

The certificate is:

- ✅ Encrypted in transit (HTTPS)
- ✅ Stored securely by Vercel
- ✅ Only accessible to your application
- ✅ Not visible in logs or to users

**When you need "gcloud-hsm":**

- You handle sensitive data (medical, financial)
- You need compliance certifications (SOC2, HIPAA)
- You have regulatory requirements
- You want hardware-level security

### Current Certificate

The certificate in `apps/remix/example/cert.p12` is an **example certificate** for testing.

**For production, you should:**

1. Generate a proper certificate
2. Use a certificate from a trusted authority
3. Set expiration reminders
4. Have a rotation process

**But for now:** The example certificate will work fine to fix the immediate issue.

## Quick Reference

### What Each Variable Does:

| Variable                                   | Purpose                         | Value                       |
| ------------------------------------------ | ------------------------------- | --------------------------- |
| `NEXT_PRIVATE_SIGNING_TRANSPORT`           | Tells app where certificate is  | `"local"` or `"gcloud-hsm"` |
| `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` | The certificate itself (base64) | Long string of characters   |
| `NEXT_PRIVATE_SIGNING_PASSPHRASE`          | Password for certificate        | Empty for example cert      |

### Where to Set Them:

| Environment       | Where                   | How                     |
| ----------------- | ----------------------- | ----------------------- |
| Local Development | `.env` file             | Already done ✅         |
| Vercel Production | Vercel Dashboard or CLI | **You need to do this** |

## Summary

1. **"local"** = certificate stored with your app (simple, works everywhere)
2. **"gcloud-hsm"** = certificate in Google Cloud (complex, more secure)
3. **Use "local"** for now - it's perfectly fine
4. **The certificate** needs to be added to Vercel as an environment variable
5. **Follow the steps** in `ADD_CERT_TO_VERCEL.md`

## Next Steps

1. Read `ADD_CERT_TO_VERCEL.md` for detailed instructions
2. Choose Method A (CLI) or Method B (Dashboard)
3. Add the three environment variables
4. Redeploy
5. Test signing a document

That's it! 🎉
