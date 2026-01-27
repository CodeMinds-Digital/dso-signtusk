# 📦 Documenso/SignTusk Assets Inventory

## 🎨 Image Assets

### Favicons & Icons

| File                         | Location             | Size | Purpose              |
| ---------------------------- | -------------------- | ---- | -------------------- |
| `favicon.ico`                | `apps/remix/public/` | 16KB | Browser favicon      |
| `favicon-16x16.png`          | `apps/remix/public/` | 4KB  | Small favicon        |
| `favicon-32x32.png`          | `apps/remix/public/` | 4KB  | Medium favicon       |
| `apple-touch-icon.png`       | `apps/remix/public/` | 16KB | iOS home screen icon |
| `android-chrome-192x192.png` | `apps/remix/public/` | 16KB | Android icon (small) |
| `android-chrome-512x512.png` | `apps/remix/public/` | 52KB | Android icon (large) |

### Logos

| File            | Location                    | Size | Purpose               |
| --------------- | --------------------------- | ---- | --------------------- |
| `logo.png`      | `packages/assets/`          | 32KB | Main application logo |
| `logo_icon.png` | `packages/assets/`          | 12KB | Logo icon only        |
| `logo.png`      | `apps/remix/public/static/` | 8KB  | Static logo (smaller) |

### UI Icons (4KB each)

Located in `apps/remix/public/static/` and `packages/email/static/`:

- `add-user.png` - Add user icon
- `building-2.png` - Organization/building icon
- `clock.png` - Time/pending icon
- `completed.png` - Completion checkmark
- `delete-team.png` - Delete team icon
- `delete-user.png` - Delete user icon (8KB)
- `download.png` - Download icon
- `mail-open-alert.png` - Email alert icon
- `mail-open.png` - Email icon
- `review.png` - Review/approval icon
- `user-plus.png` - Add user icon
- `document.png` - Document icon (16KB)

### SVG Icons

| File                        | Location                    | Size | Purpose                    |
| --------------------------- | --------------------------- | ---- | -------------------------- |
| `microsoft.svg`             | `apps/remix/public/static/` | 4KB  | Microsoft OAuth icon       |
| `early-supporter-badge.svg` | `apps/remix/public/static/` | 4KB  | Badge for early supporters |
| `premium-user-badge.svg`    | `apps/remix/public/static/` | 4KB  | Premium user badge         |
| `next.svg`                  | `packages/assets/`          | 4KB  | Next.js logo               |
| `vercel.svg`                | `packages/assets/`          | 4KB  | Vercel logo                |

### Marketing Images

Located in `packages/assets/images/`:
| File | Size | Purpose |
|------|------|---------|
| `signing-celebration.png` | **20MB** ⚠️ | Celebration image (VERY LARGE) |
| `community-cards.png` | **4.5MB** ⚠️ | Community cards (LARGE) |
| `background-pattern.png` | **1.3MB** ⚠️ | Background pattern (LARGE) |
| `background-blog-og.png` | 900KB | Blog OG image |
| `og-share-frame.png` | 744KB | Social share frame |
| `opengraph-image.jpg` | 696KB | OpenGraph image |
| `og-share-frame2.png` | 460KB | Alternative share frame |
| `card-template-figure.png` | 396KB | Template card figure |
| `card-build-figure.png` | 340KB | Build card figure |
| `connections.png` | 256KB | Connections illustration |
| `card-open-figure.png` | 252KB | Open card figure |
| `background-lw-2.png` | 104KB | Background image |
| `profile-claim-teaser.png` | 88KB | Profile claim teaser |
| `timur.png` | 84KB | Team member photo |
| `card-connections-figure.png` | 60KB | Connections card |
| `Group 1019.png` | 36KB | Group illustration |
| `card-sharing-figure.png` | 32KB | Sharing card |
| `card-fast-figure.png` | 28KB | Fast card |
| `card-widget-figure.png` | 24KB | Widget card |
| `card-smart-figure.png` | 24KB | Smart card |
| `card-paid-figure.png` | 20KB | Paid card |
| `card-beautiful-figure.png` | 16KB | Beautiful card |

## 🔤 Fonts

### Primary Fonts Used

#### 1. **Inter** (Sans-serif - UI/Body Text)

**Location:** `apps/remix/public/fonts/` and `packages/assets/fonts/`

| File                                      | Size  | Purpose                     |
| ----------------------------------------- | ----- | --------------------------- |
| `inter-variablefont_opsz,wght.ttf`        | 854KB | Variable font (all weights) |
| `inter-italic-variablefont_opsz,wght.ttf` | 883KB | Variable italic             |
| `inter-regular.ttf`                       | 303KB | Regular weight              |
| `inter-semibold.ttf`                      | 308KB | Semibold weight             |
| `inter-bold.ttf`                          | 309KB | Bold weight                 |

**Total Inter fonts:** ~2.6MB

**Usage:**

- Primary UI font
- Body text
- Buttons and navigation
- Forms and inputs

#### 2. **Caveat** (Handwriting - Signatures)

**Location:** `apps/remix/public/fonts/` and `packages/assets/fonts/`

| File                           | Size  | Purpose          |
| ------------------------------ | ----- | ---------------- |
| `caveat-variablefont_wght.ttf` | 385KB | Variable font    |
| `caveat-regular.ttf`           | 251KB | Regular weight   |
| `caveat.ttf`                   | 246KB | Standard version |

**Total Caveat fonts:** ~882KB

**Usage:**

- Signature fields
- Handwritten text simulation
- Personal touch elements

#### 3. **Noto Sans** (Multilingual Support)

**Location:** `apps/remix/public/fonts/` and `packages/assets/fonts/`

| File                     | Size         | Purpose             |
| ------------------------ | ------------ | ------------------- |
| `noto-sans-chinese.ttf`  | **10MB** ⚠️  | Chinese characters  |
| `noto-sans-korean.ttf`   | **9.9MB** ⚠️ | Korean characters   |
| `noto-sans-japanese.ttf` | **8.7MB** ⚠️ | Japanese characters |
| `noto-sans.ttf`          | 569KB        | Latin characters    |

**Total Noto Sans fonts:** ~29.2MB ⚠️ **VERY LARGE**

**Usage:**

- International character support
- CJK (Chinese, Japanese, Korean) languages
- Multilingual documents

### Font Configuration

```css
/* From apps/remix/app/app.css */
@font-face {
  font-family: "Inter";
  font-weight: 100 900;
  font-style: normal;
}

@font-face {
  font-family: "Caveat";
  font-weight: 400 600;
  font-style: normal;
}

@font-face {
  font-family: "Noto Sans";
  font-weight: 100 900;
  font-style: normal;
}

:root {
  --font-sans: "Inter";
  --font-signature: "Caveat";
  --font-noto: "Noto Sans";
}
```

## 🔄 Industry-Standard Font Alternatives

### For Inter (Sans-serif UI Font)

#### 1. **System Font Stack** (0KB - Already installed)

```css
font-family:
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, sans-serif;
```

**Pros:** Zero download, instant rendering, native look
**Cons:** Varies by OS

#### 2. **Roboto** (Google Fonts)

- **Size:** ~170KB (Regular + Bold)
- **Similar to:** Inter
- **Best for:** Material Design, Android-style UIs
- **CDN:** `https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;700`

#### 3. **Open Sans** (Google Fonts)

- **Size:** ~160KB (Regular + Bold)
- **Similar to:** Inter
- **Best for:** High readability, professional look
- **CDN:** `https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700`

#### 4. **IBM Plex Sans** (Google Fonts)

- **Size:** ~180KB (Regular + Bold)
- **Similar to:** Inter
- **Best for:** Technical/corporate applications
- **CDN:** `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700`

#### 5. **Source Sans Pro** (Google Fonts)

- **Size:** ~150KB (Regular + Bold)
- **Similar to:** Inter
- **Best for:** Clean, modern interfaces
- **CDN:** `https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700`

### For Caveat (Handwriting/Signature Font)

#### 1. **Pacifico** (Google Fonts)

- **Size:** ~45KB
- **Style:** Brush script, casual
- **CDN:** `https://fonts.googleapis.com/css2?family=Pacifico`

#### 2. **Dancing Script** (Google Fonts)

- **Size:** ~60KB
- **Style:** Elegant cursive
- **CDN:** `https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700`

#### 3. **Satisfy** (Google Fonts)

- **Size:** ~35KB
- **Style:** Handwritten, casual
- **CDN:** `https://fonts.googleapis.com/css2?family=Satisfy`

#### 4. **Kalam** (Google Fonts)

- **Size:** ~50KB
- **Style:** Handwritten, informal
- **CDN:** `https://fonts.googleapis.com/css2?family=Kalam:wght@400;700`

#### 5. **Indie Flower** (Google Fonts)

- **Size:** ~40KB
- **Style:** Handwritten, friendly
- **CDN:** `https://fonts.googleapis.com/css2?family=Indie+Flower`

### For Noto Sans (Multilingual)

#### 1. **Noto Sans (Subset)** (Google Fonts)

- **Size:** ~20-50KB per subset
- **Strategy:** Load only needed language subsets
- **CDN:** `https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&subset=latin`

#### 2. **Source Han Sans** (Adobe)

- **Size:** Variable (can subset)
- **Best for:** CJK languages
- **Alternative to:** Noto Sans CJK

#### 3. **System Fallbacks**

```css
font-family:
  "Noto Sans", "Segoe UI", "Malgun Gothic", "Microsoft YaHei",
  "Apple SD Gothic Neo", sans-serif;
```

## 💡 Optimization Recommendations

### Critical Issues ⚠️

1. **Noto Sans CJK Fonts (29.2MB total)**
   - **Problem:** Extremely large file sizes
   - **Solution:**
     - Use Google Fonts CDN with subsetting
     - Load only when needed (language detection)
     - Use `font-display: swap` for better performance
     - Consider variable fonts

2. **signing-celebration.png (20MB)**
   - **Problem:** Massive image file
   - **Solutions:**
     - Convert to WebP (70-80% smaller)
     - Lazy load
     - Use responsive images
     - Consider SVG animation instead

3. **community-cards.png (4.5MB)**
   - **Problem:** Very large
   - **Solutions:**
     - Convert to WebP
     - Split into separate images
     - Lazy load

4. **background-pattern.png (1.3MB)**
   - **Problem:** Large background
   - **Solutions:**
     - Convert to WebP
     - Use CSS patterns instead
     - Optimize with TinyPNG

### Font Loading Strategy

```css
/* Recommended font-display strategy */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-variablefont_opsz,wght.ttf");
  font-display: swap; /* Show fallback immediately */
  font-weight: 100 900;
}

/* Preload critical fonts */
<link rel="preload" href="/fonts/inter-variablefont_opsz,wght.ttf"
      as="font" type="font/ttf" crossorigin>
```

### Recommended Font Stack

```css
/* Optimized font stack */
:root {
  /* Primary UI - Use system fonts first */
  --font-sans:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter",
    "Helvetica Neue", Arial, sans-serif;

  /* Signatures - Lighter alternative */
  --font-signature: "Dancing Script", "Caveat", cursive;

  /* Multilingual - Load on demand */
  --font-noto: "Noto Sans", system-ui, sans-serif;
}
```

## 📊 Total Asset Sizes

| Category         | Size      | Files     |
| ---------------- | --------- | --------- |
| **Fonts (All)**  | ~32MB     | 20 files  |
| **Images (All)** | ~30MB     | 60+ files |
| **Total Assets** | **~62MB** | 80+ files |

### By Priority:

- **Critical (Always load):** ~2MB (logos, icons, Inter font)
- **Important (Load on demand):** ~5MB (marketing images)
- **Optional (Lazy load):** ~55MB (CJK fonts, large images)

## 🎯 Quick Wins

1. **Replace Inter with system fonts:** Save 2.6MB
2. **Use Google Fonts CDN for Noto Sans:** Save 29MB, load on demand
3. **Convert large PNGs to WebP:** Save 15-20MB
4. **Lazy load marketing images:** Improve initial load time
5. **Use lighter signature font:** Save 800KB

## 📝 Implementation Example

```typescript
// Dynamic font loading
const loadCJKFont = (language: string) => {
  if (['zh', 'ja', 'ko'].includes(language)) {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=Noto+Sans+${language.toUpperCase()}`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
};

// Image optimization
<Image
  src="/images/signing-celebration.webp"
  loading="lazy"
  width={1200}
  height={800}
  alt="Celebration"
/>
```
