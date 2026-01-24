# QR Code Enhancement Plan for Document Verification

## Current Implementation ✅

Your system already has QR codes for each document:

- **Unique Token**: Each document gets `qrToken` (e.g., `qr_abc123xyz`)
- **Embedded in PDF**: QR code appears on certificate page
- **Public Verification**: Anyone can scan and verify at `/share/qr_token`
- **Library**: Uses `uqr` for QR generation

## Enhancement Options

### Option 1: Custom Branded QR Codes 🎨

Add your logo/branding to QR codes for better recognition.

**Implementation:**

```typescript
// packages/lib/utils/qr-code.ts
import { renderSVG } from "uqr";

export interface CustomQROptions {
  logo?: string; // Base64 logo image
  logoSize?: number; // Logo size (default: 20% of QR)
  color?: string; // QR code color
  backgroundColor?: string; // Background color
  errorCorrection?: "L" | "M" | "Q" | "H"; // Error correction level
}

export function generateCustomQR(url: string, options: CustomQROptions = {}) {
  const {
    logo,
    logoSize = 0.2,
    color = "#000000",
    backgroundColor = "#FFFFFF",
    errorCorrection = "H", // High error correction for logo overlay
  } = options;

  // Generate base QR code
  const qrSvg = renderSVG(url, {
    ecc: errorCorrection,
    border: 2,
  });

  // If no logo, return basic QR
  if (!logo) {
    return qrSvg;
  }

  // Add logo overlay
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(qrSvg, "image/svg+xml");
  const svgElement = svgDoc.documentElement;

  // Calculate logo position (center)
  const viewBox = svgElement.getAttribute("viewBox")?.split(" ") || [
    "0",
    "0",
    "100",
    "100",
  ];
  const width = parseFloat(viewBox[2]);
  const height = parseFloat(viewBox[3]);
  const logoWidth = width * logoSize;
  const logoHeight = height * logoSize;
  const logoX = (width - logoWidth) / 2;
  const logoY = (height - logoHeight) / 2;

  // Add white background for logo
  const bgRect = svgDoc.createElementNS("http://www.w3.org/2000/svg", "rect");
  bgRect.setAttribute("x", String(logoX - 2));
  bgRect.setAttribute("y", String(logoY - 2));
  bgRect.setAttribute("width", String(logoWidth + 4));
  bgRect.setAttribute("height", String(logoHeight + 4));
  bgRect.setAttribute("fill", backgroundColor);
  bgRect.setAttribute("rx", "4");
  svgElement.appendChild(bgRect);

  // Add logo image
  const logoImage = svgDoc.createElementNS(
    "http://www.w3.org/2000/svg",
    "image"
  );
  logoImage.setAttribute("x", String(logoX));
  logoImage.setAttribute("y", String(logoY));
  logoImage.setAttribute("width", String(logoWidth));
  logoImage.setAttribute("height", String(logoHeight));
  logoImage.setAttribute("href", logo);
  svgElement.appendChild(logoImage);

  return new XMLSerializer().serializeToString(svgDoc);
}
```

**Usage in Certificate:**

```typescript
// apps/remix/app/routes/_internal+/[__htmltopdf]+/certificate.tsx
import { generateCustomQR } from '@signtusk/lib/utils/qr-code';

// In component
const qrCode = generateCustomQR(
  `${NEXT_PUBLIC_WEBAPP_URL()}/share/${document.qrToken}`,
  {
    logo: '/logo-icon.png', // Your logo
    logoSize: 0.15,
    errorCorrection: 'H',
  }
);

<div dangerouslySetInnerHTML={{ __html: qrCode }} />
```

---

### Option 2: Enhanced Verification Page 🔍

Add more verification details and security features.

**Features to Add:**

1. **Verification Badge**: Visual indicator of authenticity
2. **Blockchain Hash**: Optional blockchain verification
3. **Audit Trail**: Show signing timeline
4. **Download Options**: Multiple formats (PDF, JSON metadata)
5. **Share Options**: Social sharing, email verification link

**Implementation:**

```typescript
// apps/remix/app/routes/_share+/share.$slug.tsx
export default function SharePage() {
  const { document, token } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Verification Badge */}
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-lg font-semibold text-green-900">
              ✓ Document Verified
            </h2>
            <p className="text-sm text-green-700">
              This document was signed on {formatDate(document.completedAt)}
              and has not been tampered with.
            </p>
          </div>
        </div>
      </div>

      {/* Document Details */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">{document.title}</h3>

        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Document ID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">
              {document.secondaryId}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Completed</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDate(document.completedAt)}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Recipients</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {document.recipientCount} signers
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Verification Token</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">
              {token}
            </dd>
          </div>
        </dl>
      </div>

      {/* Signing Timeline */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Signing Timeline</h3>
        <SigningTimeline recipients={document.recipients} />
      </div>

      {/* Verification QR Code */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Verification QR Code</h3>
        <div className="flex items-center gap-6">
          <div className="h-32 w-32 border-2 border-gray-200 rounded-lg p-2">
            <QRCodeDisplay url={window.location.href} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              Share this QR code to allow others to verify this document.
            </p>
            <div className="flex gap-2">
              <Button onClick={downloadQR}>Download QR</Button>
              <Button variant="outline" onClick={copyLink}>Copy Link</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <DocumentCertificateQRView {...document} token={token} />
    </div>
  );
}
```

---

### Option 3: QR Code Analytics 📊

Track QR code scans for security and analytics.

**Implementation:**

```typescript
// packages/lib/server-only/document/track-qr-scan.ts
import { prisma } from "@signtusk/prisma";

export async function trackQRScan({
  qrToken,
  ipAddress,
  userAgent,
  location,
}: {
  qrToken: string;
  ipAddress: string;
  userAgent: string;
  location?: { country?: string; city?: string };
}) {
  await prisma.documentQRScan.create({
    data: {
      qrToken,
      ipAddress,
      userAgent,
      country: location?.country,
      city: location?.city,
      scannedAt: new Date(),
    },
  });
}

// In your share route loader
export const loader = async ({
  params: { slug },
  request,
}: Route.LoaderArgs) => {
  if (slug.startsWith("qr_")) {
    const document = await getDocumentByAccessToken({ token: slug });

    if (document) {
      // Track the scan
      const ipAddress = getIpAddress(request);
      const userAgent = request.headers.get("user-agent") || "";

      await trackQRScan({
        qrToken: slug,
        ipAddress,
        userAgent,
      });
    }

    return { document, token: slug };
  }
  // ...
};
```

**Add to Prisma Schema:**

```prisma
model DocumentQRScan {
  id        String   @id @default(cuid())
  qrToken   String
  ipAddress String
  userAgent String
  country   String?
  city      String?
  scannedAt DateTime @default(now())

  @@index([qrToken])
  @@index([scannedAt])
}
```

**Analytics Dashboard:**

```typescript
// Show scan analytics in document details
export function QRScanAnalytics({ qrToken }: { qrToken: string }) {
  const { data: scans } = trpc.document.getQRScans.useQuery({ qrToken });

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Verification Activity</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {scans?.totalScans || 0}
          </div>
          <div className="text-sm text-gray-500">Total Scans</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {scans?.uniqueScans || 0}
          </div>
          <div className="text-sm text-gray-500">Unique Visitors</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">
            {scans?.countries || 0}
          </div>
          <div className="text-sm text-gray-500">Countries</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Recent Scans</h4>
        {scans?.recent.map((scan) => (
          <div key={scan.id} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {scan.city}, {scan.country}
            </span>
            <span className="text-gray-400">
              {formatDistanceToNow(scan.scannedAt)} ago
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Option 4: Dynamic QR Codes with Expiry ⏰

Add time-limited verification or access control.

**Implementation:**

```typescript
// packages/lib/server-only/document/generate-temporary-qr.ts
export async function generateTemporaryQRToken({
  documentId,
  expiresIn = 24 * 60 * 60 * 1000, // 24 hours default
  maxScans = null,
}: {
  documentId: number;
  expiresIn?: number;
  maxScans?: number | null;
}) {
  const token = prefixedId("qr_temp");
  const expiresAt = new Date(Date.now() + expiresIn);

  await prisma.temporaryQRToken.create({
    data: {
      token,
      documentId,
      expiresAt,
      maxScans,
      scanCount: 0,
    },
  });

  return token;
}

// Validation
export async function validateTemporaryQRToken(token: string) {
  const qrToken = await prisma.temporaryQRToken.findUnique({
    where: { token },
  });

  if (!qrToken) {
    return { valid: false, reason: "Token not found" };
  }

  if (qrToken.expiresAt < new Date()) {
    return { valid: false, reason: "Token expired" };
  }

  if (qrToken.maxScans && qrToken.scanCount >= qrToken.maxScans) {
    return { valid: false, reason: "Maximum scans reached" };
  }

  // Increment scan count
  await prisma.temporaryQRToken.update({
    where: { token },
    data: { scanCount: { increment: 1 } },
  });

  return { valid: true, documentId: qrToken.documentId };
}
```

---

### Option 5: Multi-Format QR Codes 📱

Generate QR codes in different formats for various use cases.

**Implementation:**

```typescript
// packages/lib/utils/qr-formats.ts
export enum QRFormat {
  VERIFICATION = "verification", // Standard verification link
  VCARD = "vcard", // Contact card with document info
  CALENDAR = "calendar", // Add to calendar event
  WIFI = "wifi", // WiFi credentials (for kiosks)
  EMAIL = "email", // Email with document link
}

export function generateQRContent(
  document: Document,
  format: QRFormat
): string {
  const baseUrl = NEXT_PUBLIC_WEBAPP_URL();

  switch (format) {
    case QRFormat.VERIFICATION:
      return `${baseUrl}/share/${document.qrToken}`;

    case QRFormat.VCARD:
      return `BEGIN:VCARD
VERSION:3.0
FN:${document.title}
ORG:Signtusk
NOTE:Document ID: ${document.secondaryId}
URL:${baseUrl}/share/${document.qrToken}
END:VCARD`;

    case QRFormat.CALENDAR:
      return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Document Signed: ${document.title}
DTSTART:${formatICalDate(document.completedAt)}
DESCRIPTION:View document: ${baseUrl}/share/${document.qrToken}
END:VEVENT
END:VCALENDAR`;

    case QRFormat.EMAIL:
      return `mailto:?subject=Document%20Verification&body=Verify%20document:%20${baseUrl}/share/${document.qrToken}`;

    default:
      return `${baseUrl}/share/${document.qrToken}`;
  }
}
```

---

### Option 6: Printable Verification Cards 🎫

Generate printable cards with QR codes for physical distribution.

**Implementation:**

```typescript
// apps/remix/app/routes/_internal+/[__htmltopdf]+/verification-card.tsx
export default function VerificationCard({ document }: { document: Document }) {
  return (
    <div className="w-[3.5in] h-[2in] border-2 border-gray-300 rounded-lg p-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <img src="/logo.png" alt="Logo" className="h-8" />
        <span className="text-xs font-semibold text-gray-600">
          VERIFICATION CARD
        </span>
      </div>

      {/* Content */}
      <div className="flex gap-4">
        {/* QR Code */}
        <div className="flex-shrink-0">
          <div
            className="h-24 w-24 border border-gray-200 rounded p-1"
            dangerouslySetInnerHTML={{
              __html: renderSVG(
                `${NEXT_PUBLIC_WEBAPP_URL()}/share/${document.qrToken}`,
                { ecc: 'H' }
              ),
            }}
          />
        </div>

        {/* Details */}
        <div className="flex-1 text-xs">
          <h3 className="font-bold text-sm mb-1 truncate">
            {document.title}
          </h3>
          <dl className="space-y-0.5">
            <div>
              <dt className="inline text-gray-500">ID:</dt>
              <dd className="inline ml-1 font-mono">{document.secondaryId}</dd>
            </div>
            <div>
              <dt className="inline text-gray-500">Signed:</dt>
              <dd className="inline ml-1">
                {formatDate(document.completedAt, 'short')}
              </dd>
            </div>
            <div>
              <dt className="inline text-gray-500">Recipients:</dt>
              <dd className="inline ml-1">{document.recipientCount}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-[10px] text-gray-500 text-center">
          Scan QR code to verify document authenticity
        </p>
      </div>
    </div>
  );
}
```

---

## Recommended Implementation Priority

### Phase 1: Quick Wins (1-2 days)

1. ✅ **Enhanced Verification Page** - Better UX for verification
2. ✅ **QR Code Analytics** - Track scans for security

### Phase 2: Branding (3-5 days)

3. 🎨 **Custom Branded QR Codes** - Add logo for recognition
4. 🎫 **Printable Verification Cards** - Physical distribution

### Phase 3: Advanced Features (1-2 weeks)

5. ⏰ **Dynamic QR with Expiry** - Time-limited access
6. 📱 **Multi-Format QR Codes** - Different use cases

---

## Quick Start: Enhanced Verification Page

Here's a minimal enhancement you can add right now:

```typescript
// apps/remix/app/components/general/document/document-verification-badge.tsx
export function DocumentVerificationBadge({
  document
}: {
  document: { completedAt: Date; secondaryId: string }
}) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold text-green-900 mb-1">
            ✓ Document Verified & Authentic
          </h2>
          <p className="text-sm text-green-700 mb-3">
            This document was digitally signed on{' '}
            <span className="font-semibold">
              {formatDate(document.completedAt)}
            </span>
            {' '}and has not been tampered with.
          </p>

          <div className="flex items-center gap-4 text-xs text-green-600">
            <div className="flex items-center gap-1">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Cryptographically Sealed</span>
            </div>
            <div className="flex items-center gap-1">
              <LockIcon className="h-4 w-4" />
              <span>Tamper-Proof</span>
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>Timestamped</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-green-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-700">
            Document ID: <span className="font-mono font-semibold">{document.secondaryId}</span>
          </span>
          <span className="text-green-600">
            Verified by Signtusk
          </span>
        </div>
      </div>
    </div>
  );
}
```

Add to your share page:

```typescript
// apps/remix/app/routes/_share+/share.$slug.tsx
import { DocumentVerificationBadge } from '~/components/general/document/document-verification-badge';

export default function SharePage() {
  const { document, token } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <DocumentVerificationBadge document={document} />
      <DocumentCertificateQRView {...document} token={token} />
    </div>
  );
}
```

---

## Summary

You **already have QR codes** working! Each document automatically gets:

- ✅ Unique QR token
- ✅ QR code embedded in PDF certificate
- ✅ Public verification page
- ✅ No login required to verify

**Recommended Next Steps:**

1. Add the verification badge (5 minutes)
2. Implement QR scan analytics (1-2 hours)
3. Consider custom branded QR codes (1 day)

Would you like me to help implement any of these enhancements?
