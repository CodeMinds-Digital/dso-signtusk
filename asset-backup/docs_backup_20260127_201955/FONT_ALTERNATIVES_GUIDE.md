# 🔤 Font Alternatives Guide - Quick Reference

## Current Fonts vs. Alternatives

### 1. Inter → System Fonts (Best Performance)

**Current:** Inter Variable Font (854KB)

**Alternative:** System Font Stack (0KB)

```css
font-family:
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, sans-serif;
```

**Comparison:**
| Font | Size | Load Time | Rendering | Compatibility |
|------|------|-----------|-----------|---------------|
| Inter | 854KB | ~200ms | Custom | 100% |
| System | 0KB | 0ms | Native | 100% |

**Recommendation:** ⭐⭐⭐⭐⭐ Use system fonts for best performance

---

### 2. Inter → Roboto (Google Fonts)

**Alternative:** Roboto (170KB for Regular + Bold)

```html
<link
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;700&display=swap"
  rel="stylesheet"
/>
```

```css
font-family: "Roboto", sans-serif;
```

**Visual Comparison:**

- **Inter:** Modern, slightly condensed, tech-focused
- **Roboto:** Friendly, geometric, Material Design

**Recommendation:** ⭐⭐⭐⭐ Great alternative, widely used

---

### 3. Inter → Open Sans (Google Fonts)

**Alternative:** Open Sans (160KB for Regular + Bold)

```html
<link
  href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap"
  rel="stylesheet"
/>
```

```css
font-family: "Open Sans", sans-serif;
```

**Visual Comparison:**

- **Inter:** Neutral, modern
- **Open Sans:** Humanist, highly readable

**Recommendation:** ⭐⭐⭐⭐⭐ Excellent readability

---

### 4. Caveat → Dancing Script (Signature Font)

**Current:** Caveat Variable Font (385KB)

**Alternative:** Dancing Script (60KB)

```html
<link
  href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

```css
font-family: "Dancing Script", cursive;
```

**Visual Comparison:**

- **Caveat:** Casual handwriting, informal
- **Dancing Script:** Elegant cursive, formal

**Recommendation:** ⭐⭐⭐⭐ More elegant, smaller file

---

### 5. Caveat → Pacifico (Signature Font)

**Alternative:** Pacifico (45KB)

```html
<link
  href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
  rel="stylesheet"
/>
```

```css
font-family: "Pacifico", cursive;
```

**Visual Comparison:**

- **Caveat:** Handwritten, natural
- **Pacifico:** Brush script, bold

**Recommendation:** ⭐⭐⭐ Bold and distinctive

---

### 6. Noto Sans CJK → Google Fonts Subsets

**Current:** Noto Sans CJK (29.2MB total!)

**Alternative:** Google Fonts with Language Subsets

```html
<!-- Load only when needed -->
<link
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

**Dynamic Loading:**

```typescript
// Load CJK fonts only when needed
const loadCJKFont = (language: "zh" | "ja" | "ko") => {
  const fontMap = {
    zh: "Noto+Sans+SC", // Simplified Chinese
    ja: "Noto+Sans+JP", // Japanese
    ko: "Noto+Sans+KR", // Korean
  };

  const link = document.createElement("link");
  link.href = `https://fonts.googleapis.com/css2?family=${fontMap[language]}:wght@400;700&display=swap`;
  link.rel = "stylesheet";
  document.head.appendChild(link);
};
```

**Recommendation:** ⭐⭐⭐⭐⭐ Load on demand, massive savings

---

## 🎯 Recommended Font Stack

### Option 1: Maximum Performance (System Fonts)

```css
:root {
  /* UI Font - 0KB */
  --font-sans:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;

  /* Signature Font - Use CSS cursive */
  --font-signature: cursive;

  /* Multilingual - System fallbacks */
  --font-noto: system-ui, -apple-system, sans-serif;
}
```

**Total Size:** 0KB
**Load Time:** Instant
**Best for:** Maximum performance, fast loading

---

### Option 2: Balanced (Google Fonts)

```html
<!-- Preconnect for faster loading -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Load fonts -->
<link
  href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Dancing+Script:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

```css
:root {
  /* UI Font - 160KB */
  --font-sans: "Open Sans", -apple-system, BlinkMacSystemFont, sans-serif;

  /* Signature Font - 60KB */
  --font-signature: "Dancing Script", cursive;

  /* Multilingual - Load on demand */
  --font-noto: "Noto Sans", system-ui, sans-serif;
}
```

**Total Size:** ~220KB (vs 32MB current)
**Load Time:** ~100ms
**Best for:** Good balance of style and performance

---

### Option 3: Premium (Keep Inter, Optimize Others)

```css
:root {
  /* UI Font - Keep Inter but optimize */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

  /* Signature Font - Use lighter alternative */
  --font-signature: "Dancing Script", "Caveat", cursive;

  /* Multilingual - Load on demand via Google Fonts */
  --font-noto: "Noto Sans", system-ui, sans-serif;
}
```

**Total Size:** ~1MB (vs 32MB current)
**Load Time:** ~200ms
**Best for:** Keep brand identity, optimize CJK fonts

---

## 📊 Size Comparison

| Font Stack       | Total Size | Load Time | Savings |
| ---------------- | ---------- | --------- | ------- |
| **Current**      | 32MB       | ~5s       | -       |
| **System Fonts** | 0KB        | 0ms       | 100%    |
| **Google Fonts** | 220KB      | ~100ms    | 99.3%   |
| **Hybrid**       | 1MB        | ~200ms    | 96.9%   |

---

## 🚀 Implementation Steps

### Step 1: Update CSS

```css
/* apps/remix/app/app.css */

/* Remove or comment out current @font-face declarations */
/*
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-variablefont_opsz,wght.ttf");
}
*/

/* Add Google Fonts or system fonts */
@layer base {
  :root {
    --font-sans: "Open Sans", -apple-system, BlinkMacSystemFont, sans-serif;
    --font-signature: "Dancing Script", cursive;
    --font-noto: "Noto Sans", system-ui, sans-serif;
  }

  body {
    font-family: var(--font-sans);
  }
}
```

### Step 2: Add Font Links (if using Google Fonts)

```html
<!-- apps/remix/app/root.tsx -->
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Dancing+Script:wght@400;700&display=swap"
    rel="stylesheet"
  />
</head>
```

### Step 3: Remove Font Files (Optional)

```bash
# Backup first
mkdir -p backups/fonts
cp -r apps/remix/public/fonts backups/fonts/

# Remove large font files
rm apps/remix/public/fonts/noto-sans-*.ttf  # Saves 29MB
rm apps/remix/public/fonts/inter-*.ttf      # Saves 2.6MB (if using system fonts)
rm apps/remix/public/fonts/caveat-*.ttf     # Saves 882KB (if using alternative)
```

### Step 4: Update Tailwind Config

```typescript
// packages/tailwind-config or tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans", "system-ui", "sans-serif"],
        signature: ["Dancing Script", "cursive"],
        noto: ["Noto Sans", "system-ui", "sans-serif"],
      },
    },
  },
};
```

### Step 5: Test

```bash
# Build and test
npm run build
npm run dev

# Check font loading in browser DevTools
# Network tab → Filter by "font"
# Should see much smaller sizes
```

---

## 🎨 Visual Comparison Tool

Test fonts before implementing:

1. **Google Fonts:** https://fonts.google.com/specimen/Open+Sans
2. **Font Pair:** https://fontpair.co/
3. **Type Scale:** https://typescale.com/

---

## ✅ Recommended Choice

**For SignTusk/Documenso:**

```css
:root {
  /* UI: Open Sans (excellent readability for documents) */
  --font-sans: "Open Sans", -apple-system, sans-serif;

  /* Signatures: Dancing Script (elegant, professional) */
  --font-signature: "Dancing Script", cursive;

  /* Multilingual: Load on demand */
  --font-noto: "Noto Sans", system-ui, sans-serif;
}
```

**Why:**

- ✅ 99.3% smaller (220KB vs 32MB)
- ✅ Faster loading (~100ms vs ~5s)
- ✅ Better readability for documents
- ✅ Professional appearance
- ✅ Free and widely supported
- ✅ Excellent multilingual support (on demand)

**Total Savings:** ~31.8MB in fonts alone!
