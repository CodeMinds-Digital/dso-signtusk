# 🚀 Deploy Resend Fix NOW

## ✅ Fix Applied

Fixed the React rendering error in `packages/email/render.tsx` that was causing:

```
"Cannot read properties of null (reading 'useRef')"
```

## 📝 What Changed

- Updated `packages/email/render.tsx` to use `createElement` instead of JSX
- This properly initializes React context during server-side email rendering
- Fixes the issue with `@lingui/react` I18nProvider

## 🎯 Deploy Steps

### For Dokploy (Production):

1. **Commit the changes:**

```bash
git add packages/email/render.tsx
git commit -m "fix: React context initialization in email rendering"
git push origin main
```

2. **In Dokploy Dashboard:**
   - Go to your application
   - Click "Clear Build Cache" (important!)
   - Click "Redeploy"
   - Wait for build to complete (~5-10 minutes)

3. **Verify deployment:**
   - Check logs for successful startup
   - Test resend document functionality

### For Local Development:

```bash
# Clean and rebuild
rm -rf .turbo/cache apps/remix/build
npm run build

# Restart
pkill -f node
npm run dev
```

### For Docker:

```bash
# Rebuild without cache
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Check logs
docker-compose logs -f
```

## 🧪 Test After Deployment

1. Log in to your application
2. Navigate to a pending document
3. Click "..." menu → "Resend Document"
4. Select a recipient
5. Click "Send reminder"
6. **Expected:** ✅ "Envelope resent successfully"
7. **Before:** ❌ "An unexpected error occurred"

## 📊 Verify Success

Check logs for:

```
[MAILER] Creating transport: resend
[MAILER] Resend API key present: true
[MAILER] Sending email to: recipient@example.com
[MAILER] Email sent successfully
```

## ⚠️ Important Notes

1. **Must clear build cache** - Old compiled code will still have the bug
2. **Environment variables** - Make sure these are set:

   ```env
   NEXT_PRIVATE_SMTP_TRANSPORT=resend
   NEXT_PRIVATE_RESEND_API_KEY=re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx
   NEXT_PRIVATE_SMTP_FROM_ADDRESS=noreply@notify.signtusk.com
   NEXT_PRIVATE_SMTP_FROM_NAME=SignTusk
   ```

3. **Domain verification** - If `notify.signtusk.com` isn't verified in Resend:
   - Temporarily use: `NEXT_PRIVATE_SMTP_FROM_ADDRESS=onboarding@resend.dev`
   - Or verify your domain at https://resend.com/domains

## 🔍 If Still Failing

1. Check if environment variables are loaded:

   ```bash
   # In your container/server
   echo $NEXT_PRIVATE_RESEND_API_KEY
   ```

2. Test Resend API directly:

   ```bash
   curl -X POST 'https://api.resend.com/emails' \
     -H "Authorization: Bearer re_bSSwgHiZ_HswkpPHNQKzMTNKtYYjfCzEx" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "onboarding@resend.dev",
       "to": "test@example.com",
       "subject": "Test",
       "text": "Test"
     }'
   ```

3. Check application logs for any other errors

## 📁 Files Changed

- `packages/email/render.tsx` - Fixed React context initialization

## 🎉 Expected Result

Resend document functionality will work correctly, sending reminder emails to selected recipients without the React rendering error.
