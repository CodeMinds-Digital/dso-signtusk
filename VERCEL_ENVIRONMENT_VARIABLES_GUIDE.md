# Vercel Environment Variables Configuration Guide

This guide provides a comprehensive list of environment variables required for deploying SignTusk to Vercel.

## Summary

- **Total Variables**: 93
- **Required for Build**: 1
- **Required for Runtime**: 16
- **Optional for Build**: 4
- **Optional for Runtime**: 68
- **Development Only**: 1
- **Testing Only**: 3

## Configuration Instructions

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the required variables listed below
4. Deploy your application

---

## Required for build process

### `NODE_ENV`

**Description**: Node.js environment (production/development)

**Default Value**: `production`

**Used in**: Build process

**Vercel Configuration**:
```
Name: NODE_ENV
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

## Required for runtime operation

### `AWS_ACCESS_KEY_ID`

**Description**: AWS access key for S3 operations

**Used in**: AWS S3

**Vercel Configuration**:
```
Name: AWS_ACCESS_KEY_ID
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `AWS_REGION`

**Description**: AWS region for S3 bucket

**Default Value**: `us-east-1`

**Used in**: AWS S3

**Vercel Configuration**:
```
Name: AWS_REGION
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `AWS_S3_BUCKET`

**Description**: AWS S3 bucket name

**Used in**: AWS S3

**Vercel Configuration**:
```
Name: AWS_S3_BUCKET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `AWS_SECRET_ACCESS_KEY`

**Description**: AWS secret key for S3 operations

**Used in**: AWS S3

**Vercel Configuration**:
```
Name: AWS_SECRET_ACCESS_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `DATABASE_URL`

**Description**: Primary database connection URL

**Used in**: Database connection

**Vercel Configuration**:
```
Name: DATABASE_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `ENCRYPTION_KEY`

**Description**: 32-character encryption key for data security

**Used in**: Security

**Vercel Configuration**:
```
Name: ENCRYPTION_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `JWT_SECRET`

**Description**: JWT token signing secret

**Used in**: Authentication

**Vercel Configuration**:
```
Name: JWT_SECRET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_DATABASE_URL`

**Description**: Private database URL for server-side operations

**Used in**: Prisma schema

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_DATABASE_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_ENCRYPTION_KEY`

**Description**: Primary encryption key for sensitive data

**Used in**: Security

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_ENCRYPTION_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_TRANSPORT`

**Description**: Email transport method (resend/smtp)

**Default Value**: `resend`

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_TRANSPORT
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_UPLOAD_BUCKET`

**Description**: S3 bucket name for file uploads

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_UPLOAD_BUCKET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PUBLIC_APP_URL`

**Description**: Public application URL for client-side routing

**Used in**: Client-side routing

**Vercel Configuration**:
```
Name: NEXT_PUBLIC_APP_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PUBLIC_UPLOAD_TRANSPORT`

**Description**: File upload transport method (s3/local)

**Default Value**: `s3`

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PUBLIC_UPLOAD_TRANSPORT
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PUBLIC_WEBAPP_URL`

**Description**: Public web application URL

**Used in**: Application URLs

**Vercel Configuration**:
```
Name: NEXT_PUBLIC_WEBAPP_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXTAUTH_SECRET`

**Description**: NextAuth.js secret for session encryption

**Used in**: Authentication

**Vercel Configuration**:
```
Name: NEXTAUTH_SECRET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `POSTGRES_PRISMA_URL`

**Description**: PostgreSQL connection URL for Prisma

**Used in**: Database connection

**Vercel Configuration**:
```
Name: POSTGRES_PRISMA_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

## Optional for build process

### `CARGO_BUILD_TARGET`

**Description**: Rust build target

**Used in**: Rust compilation

**Vercel Configuration**:
```
Name: CARGO_BUILD_TARGET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `CARGO_TARGET_DIR`

**Description**: Rust cargo target directory

**Used in**: Rust compilation

**Vercel Configuration**:
```
Name: CARGO_TARGET_DIR
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `RUSTFLAGS`

**Description**: Rust compiler flags

**Used in**: Rust compilation

**Vercel Configuration**:
```
Name: RUSTFLAGS
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `SKIP_ENV_VALIDATION`

**Description**: Skip environment variable validation

**Default Value**: `false`

**Used in**: Build process

**Vercel Configuration**:
```
Name: SKIP_ENV_VALIDATION
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

## Optional for runtime operation

### `AWS_S3_ENDPOINT`

**Description**: Custom S3 endpoint URL

**Used in**: AWS S3

**Vercel Configuration**:
```
Name: AWS_S3_ENDPOINT
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `DATABASE_URL_UNPOOLED`

**Description**: Unpooled database connection

**Used in**: Database connection

**Vercel Configuration**:
```
Name: DATABASE_URL_UNPOOLED
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `DISABLE_PDF_SIGNING`

**Description**: Disable PDF signing functionality

**Default Value**: `false`

**Used in**: PDF processing

**Vercel Configuration**:
```
Name: DISABLE_PDF_SIGNING
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `DOCUMENSO_DISABLE_TELEMETRY`

**Description**: Disable telemetry collection

**Default Value**: `false`

**Used in**: Analytics

**Vercel Configuration**:
```
Name: DOCUMENSO_DISABLE_TELEMETRY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `GOOGLE_APPLICATION_CREDENTIALS`

**Description**: Google Cloud service account credentials

**Used in**: Google Cloud

**Vercel Configuration**:
```
Name: GOOGLE_APPLICATION_CREDENTIALS
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `GOOGLE_VERTEX_API_KEY`

**Description**: Google Vertex AI API key

**Used in**: AI services

**Vercel Configuration**:
```
Name: GOOGLE_VERTEX_API_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `GOOGLE_VERTEX_LOCATION`

**Description**: Google Vertex AI location

**Used in**: AI services

**Vercel Configuration**:
```
Name: GOOGLE_VERTEX_LOCATION
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `GOOGLE_VERTEX_PROJECT_ID`

**Description**: Google Vertex AI project ID

**Used in**: AI services

**Vercel Configuration**:
```
Name: GOOGLE_VERTEX_PROJECT_ID
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `INNGEST_EVENT_KEY`

**Description**: Inngest event key

**Used in**: Job processing

**Vercel Configuration**:
```
Name: INNGEST_EVENT_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_DIRECT_DATABASE_URL`

**Description**: Direct database connection URL (bypassing pooling)

**Used in**: Prisma schema

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_DIRECT_DATABASE_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY`

**Description**: Secondary encryption key for key rotation

**Used in**: Security

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_GOOGLE_CLIENT_ID`

**Description**: Google OAuth client ID

**Used in**: OAuth authentication

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_GOOGLE_CLIENT_ID
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_GOOGLE_CLIENT_SECRET`

**Description**: Google OAuth client secret

**Used in**: OAuth authentication

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_GOOGLE_CLIENT_SECRET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_INNGEST_APP_ID`

**Description**: Inngest application ID

**Used in**: Job processing

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_INNGEST_APP_ID
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_INNGEST_EVENT_KEY`

**Description**: Private Inngest event key

**Used in**: Job processing

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_INNGEST_EVENT_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_JOBS_PROVIDER`

**Description**: Background job processing provider

**Used in**: Job processing

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_JOBS_PROVIDER
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_MAILCHANNELS_API_KEY`

**Description**: MailChannels API key

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_MAILCHANNELS_API_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_MAILCHANNELS_DKIM_DOMAIN`

**Description**: MailChannels DKIM domain

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_MAILCHANNELS_DKIM_DOMAIN
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_MAILCHANNELS_DKIM_PRIVATE_KEY`

**Description**: MailChannels DKIM private key

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_MAILCHANNELS_DKIM_PRIVATE_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_MAILCHANNELS_DKIM_SELECTOR`

**Description**: MailChannels DKIM selector

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_MAILCHANNELS_DKIM_SELECTOR
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_MAILCHANNELS_ENDPOINT`

**Description**: MailChannels endpoint URL

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_MAILCHANNELS_ENDPOINT
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_OIDC_CLIENT_ID`

**Description**: OIDC client ID

**Used in**: OIDC authentication

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_OIDC_CLIENT_ID
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_OIDC_CLIENT_SECRET`

**Description**: OIDC client secret

**Used in**: OIDC authentication

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_OIDC_CLIENT_SECRET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_OIDC_PROMPT`

**Description**: OIDC authentication prompt

**Used in**: OIDC authentication

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_OIDC_PROMPT
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_OIDC_PROVIDER_LABEL`

**Description**: OIDC provider display label

**Used in**: OIDC authentication

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_OIDC_PROVIDER_LABEL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_OIDC_SKIP_VERIFY`

**Description**: Skip OIDC certificate verification

**Default Value**: `false`

**Used in**: OIDC authentication

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_OIDC_SKIP_VERIFY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_OIDC_WELL_KNOWN`

**Description**: OIDC well-known endpoint

**Used in**: OIDC authentication

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_OIDC_WELL_KNOWN
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_RESEND_API_KEY`

**Description**: Resend API key for email delivery

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_RESEND_API_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_APIKEY`

**Description**: SMTP API key

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_APIKEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_APIKEY_USER`

**Description**: SMTP API key user

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_APIKEY_USER
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_FROM_ADDRESS`

**Description**: Email sender address

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_FROM_ADDRESS
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_FROM_NAME`

**Description**: Email sender name

**Default Value**: `SignTusk`

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_FROM_NAME
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_HOST`

**Description**: SMTP server hostname

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_HOST
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_PASSWORD`

**Description**: SMTP password

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_PASSWORD
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_PORT`

**Description**: SMTP server port

**Default Value**: `587`

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_PORT
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_SECURE`

**Description**: Use secure SMTP connection

**Default Value**: `true`

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_SECURE
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_SERVICE`

**Description**: SMTP service provider

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_SERVICE
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_UNSAFE_IGNORE_TLS`

**Description**: Ignore TLS certificate errors

**Default Value**: `false`

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_UNSAFE_IGNORE_TLS
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_SMTP_USERNAME`

**Description**: SMTP username

**Used in**: Email service

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_SMTP_USERNAME
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_STRIPE_API_KEY`

**Description**: Stripe secret API key for payments

**Used in**: Payment processing

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_STRIPE_API_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET`

**Description**: Stripe webhook secret for event verification

**Used in**: Payment processing

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_TELEMETRY_HOST`

**Description**: Telemetry service host

**Used in**: Analytics

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_TELEMETRY_HOST
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_TELEMETRY_KEY`

**Description**: Telemetry service key

**Used in**: Analytics

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_TELEMETRY_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID`

**Description**: Upload service access key

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_DOMAIN`

**Description**: CDN distribution domain

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_UPLOAD_DISTRIBUTION_DOMAIN
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_CONTENTS`

**Description**: CDN distribution key contents

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_CONTENTS
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_ID`

**Description**: CDN distribution key ID

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_ID
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_UPLOAD_ENDPOINT`

**Description**: Custom upload endpoint

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_UPLOAD_ENDPOINT
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE`

**Description**: Force path-style S3 URLs

**Default Value**: `false`

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_UPLOAD_REGION`

**Description**: Upload service region

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_UPLOAD_REGION
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY`

**Description**: Upload service secret key

**Used in**: File upload

**Vercel Configuration**:
```
Name: NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PUBLIC_DISABLE_SIGNUP`

**Description**: Disable new user registration

**Default Value**: `false`

**Used in**: Security

**Vercel Configuration**:
```
Name: NEXT_PUBLIC_DISABLE_SIGNUP
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PUBLIC_DOCS_URL`

**Description**: Documentation site URL

**Used in**: External links

**Vercel Configuration**:
```
Name: NEXT_PUBLIC_DOCS_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PUBLIC_MARKETING_URL`

**Description**: Marketing site URL

**Used in**: External links

**Vercel Configuration**:
```
Name: NEXT_PUBLIC_MARKETING_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PUBLIC_POSTHOG_HOST`

**Description**: PostHog analytics host URL

**Default Value**: `https://app.posthog.com`

**Used in**: Analytics

**Vercel Configuration**:
```
Name: NEXT_PUBLIC_POSTHOG_HOST
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PUBLIC_POSTHOG_KEY`

**Description**: PostHog analytics project key

**Used in**: Analytics

**Vercel Configuration**:
```
Name: NEXT_PUBLIC_POSTHOG_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Description**: Stripe publishable key for client-side

**Used in**: Payment processing

**Vercel Configuration**:
```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `PDF_EXTERNAL_SERVICE_URL`

**Description**: External PDF service URL

**Used in**: PDF processing

**Vercel Configuration**:
```
Name: PDF_EXTERNAL_SERVICE_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `PDF_GENERATION_METHOD`

**Description**: PDF generation method

**Default Value**: `local`

**Used in**: PDF processing

**Vercel Configuration**:
```
Name: PDF_GENERATION_METHOD
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `PORT`

**Description**: Server port number

**Default Value**: `3000`

**Used in**: Server startup

**Vercel Configuration**:
```
Name: PORT
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `POSTGRES_URL`

**Description**: Alternative PostgreSQL URL

**Used in**: Database connection

**Vercel Configuration**:
```
Name: POSTGRES_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `POSTGRES_URL_NON_POOLING`

**Description**: Non-pooling PostgreSQL URL

**Used in**: Database connection

**Vercel Configuration**:
```
Name: POSTGRES_URL_NON_POOLING
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `RATE_LIMIT_ENABLED`

**Description**: Enable API rate limiting

**Default Value**: `true`

**Used in**: Security

**Vercel Configuration**:
```
Name: RATE_LIMIT_ENABLED
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `REDIS_URL`

**Description**: Redis connection URL for caching and sessions

**Used in**: Caching

**Vercel Configuration**:
```
Name: REDIS_URL
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `SESSION_SECRET`

**Description**: Session encryption secret

**Used in**: Authentication

**Vercel Configuration**:
```
Name: SESSION_SECRET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `STORAGE_LOCAL_PATH`

**Description**: Local storage path

**Default Value**: `./uploads`

**Used in**: File storage

**Vercel Configuration**:
```
Name: STORAGE_LOCAL_PATH
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `STORAGE_PROVIDER`

**Description**: Storage provider type

**Default Value**: `local`

**Used in**: File storage

**Vercel Configuration**:
```
Name: STORAGE_PROVIDER
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

### `WEBHOOK_SECRET`

**Description**: Webhook signature verification secret

**Used in**: Security

**Vercel Configuration**:
```
Name: WEBHOOK_SECRET
Value: [YOUR_VALUE_HERE]
Environment: Production, Preview, Development
```

---

## Development and Testing Variables (Not needed for Vercel)

These variables are only used in development or testing environments and should not be configured in Vercel:

### Development environment only

- `CI`: Continuous Integration environment flag

### Testing environment only

- `E2E_TEST_AUTHENTICATE_USER_EMAIL`: E2E test user email
- `E2E_TEST_AUTHENTICATE_USER_PASSWORD`: E2E test user password
- `E2E_TEST_AUTHENTICATE_USERNAME`: E2E test authentication username

