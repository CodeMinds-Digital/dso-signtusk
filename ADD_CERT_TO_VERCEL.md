# How to Add Certificate to Vercel - Step by Step

## Method A: Using Vercel CLI (Recommended)

### Step 1: Open Terminal

Open your terminal in the project directory.

### Step 2: Copy Certificate Content

```bash
# This displays the certificate content
cat cert.base64.txt
```

You'll see a long string of characters like:

```
MIIKPAIBAzCCCfwGCSqGSIb3DQEHAaCCCe0EggnpMIIJ5TCCBgwGCSqGSIb3DQEH...
```

**Keep this terminal window open** - you'll need to copy this text.

### Step 3: Add Certificate to Production

```bash
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
```

When prompted:

1. It will ask: **"What's the value of NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS?"**
2. **Copy the entire content** from `cert.base64.txt` (from Step 2)
3. **Paste it** into the terminal
4. Press **Enter**

### Step 4: Add Passphrase to Production

```bash
vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
```

When prompted:

1. It will ask: **"What's the value of NEXT_PRIVATE_SIGNING_PASSPHRASE?"**
2. Just press **Enter** (leave it empty for the example certificate)

### Step 5: Fix Transport Value

First, remove the incorrect value:

```bash
vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT production
```

It will ask: **"Are you sure you want to remove..."** - Type `y` and press Enter

Then add the correct value:

```bash
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
```

When prompted:

1. It will ask: **"What's the value of NEXT_PRIVATE_SIGNING_TRANSPORT?"**
2. Type: `local`
3. Press **Enter**

### Step 6: Repeat for Preview and Development (Optional but Recommended)

For **Preview** environment:

```bash
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS preview
# Paste certificate content

vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE preview
# Press Enter (empty)

vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT preview
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT preview
# Type: local
```

For **Development** environment:

```bash
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS development
# Paste certificate content

vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE development
# Press Enter (empty)

vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT development
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT development
# Type: local
```

### Step 7: Redeploy

```bash
vercel --prod
```

This will trigger a new deployment with the updated environment variables.

### Step 8: Verify

```bash
npx tsx scripts/check-vercel-signing.ts
```

You should see:

```
✓ NEXT_PRIVATE_SIGNING_TRANSPORT: local
✓ NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS: Set (3516 chars)
✓ NEXT_PRIVATE_SIGNING_PASSPHRASE: Set (empty)
```

### Step 9: Clean Up

```bash
rm cert.base64.txt
```

---

## Method B: Using Vercel Dashboard (Visual)

### Step 1: Copy Certificate to Clipboard

```bash
# macOS
cat cert.base64.txt | pbcopy

# Linux
cat cert.base64.txt | xclip -selection clipboard

# Windows (Git Bash)
cat cert.base64.txt | clip
```

### Step 2: Open Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click on your project: **dso-signtusk-remix-vpsy**
3. Click on **Settings** tab (top navigation)
4. Click on **Environment Variables** (left sidebar)

### Step 3: Add Certificate Variable

1. In the "Key" field, type: `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS`
2. In the "Value" field, **paste** the certificate (Cmd+V or Ctrl+V)
3. Check all three environments: ✅ Production ✅ Preview ✅ Development
4. Click **Save**

### Step 4: Add Passphrase Variable

1. Click **Add Another** (or the + button)
2. In the "Key" field, type: `NEXT_PRIVATE_SIGNING_PASSPHRASE`
3. In the "Value" field, **leave it empty** (don't type anything)
4. Check all three environments: ✅ Production ✅ Preview ✅ Development
5. Click **Save**

### Step 5: Fix Transport Variable

1. Find the existing `NEXT_PRIVATE_SIGNING_TRANSPORT` variable
2. Click the **three dots** (⋯) next to it
3. Click **Edit**
4. Change the value to: `local`
5. Make sure all three environments are checked: ✅ Production ✅ Preview ✅ Development
6. Click **Save**

### Step 6: Redeploy

1. Click on **Deployments** tab (top navigation)
2. Find the latest deployment
3. Click the **three dots** (⋯) next to it
4. Click **Redeploy**
5. Confirm by clicking **Redeploy** again

### Step 7: Verify

Wait for deployment to complete (usually 2-5 minutes), then run:

```bash
npx tsx scripts/check-vercel-signing.ts
```

### Step 8: Clean Up

```bash
rm cert.base64.txt
```

---

## Visual Guide for Vercel Dashboard

### Finding Environment Variables:

```
Dashboard → Your Project → Settings → Environment Variables
```

### Adding a Variable:

```
┌─────────────────────────────────────────────────────┐
│ Key                                                 │
│ NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS           │
├─────────────────────────────────────────────────────┤
│ Value                                               │
│ MIIKPAIBAzCCCfwGCSqGSIb3DQEHAaCCCe0Eggnp...       │
│ (paste the entire certificate content here)        │
├─────────────────────────────────────────────────────┤
│ Environments                                        │
│ ☑ Production  ☑ Preview  ☑ Development            │
├─────────────────────────────────────────────────────┤
│                                    [Save]           │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Value is too long"

**Solution:** The certificate might be too large. Try:

1. Make sure you copied the entire content without extra spaces
2. The certificate should be around 3500 characters
3. If still too large, you may need to use a smaller certificate

### Issue: "Failed to add environment variable"

**Solution:** Make sure you're logged in:

```bash
vercel login
```

### Issue: "Project not found"

**Solution:** Link the project:

```bash
vercel link
```

### Issue: Still getting errors after deployment

**Solution:**

1. Check if variables are set:

   ```bash
   vercel env ls | grep SIGNING
   ```

2. Pull and verify:

   ```bash
   vercel env pull .env.vercel.local
   cat .env.vercel.local | grep SIGNING
   ```

3. Run the checker:
   ```bash
   npx tsx scripts/check-vercel-signing.ts
   ```

---

## What Happens After Adding Certificate?

1. **Next deployment** will include the certificate
2. **Signing process** will work correctly
3. **Documents** will complete and change to "Completed" status
4. **PDFs** will be properly signed and downloadable

---

## Testing After Setup

1. **Create a test document** in production
2. **Send it** to yourself or a test email
3. **Sign the document**
4. **Check the status** - should change to "Completed" within seconds
5. **View the PDF** - should load without errors
6. **Download the PDF** - should be full size (not 1KB)

---

## Need Help?

If you get stuck:

1. **Check configuration:**

   ```bash
   npx tsx scripts/check-vercel-signing.ts
   ```

2. **View logs:**

   ```bash
   vercel logs --follow
   ```

3. **Debug issues:**

   ```bash
   npx tsx scripts/debug-signing-issue.ts
   ```

4. Ask me for help with the specific error message you're seeing!
