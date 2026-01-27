# Font Replacement Mapping - One-to-One Alternatives

## Complete Font Inventory & Replacements

### packages/assets/fonts/ (9 fonts)

| #   | Current Font                            | Size  | Replacement                   | New Size | Savings | Download URL                                               |
| --- | --------------------------------------- | ----- | ----------------------------- | -------- | ------- | ---------------------------------------------------------- |
| 1   | inter-variablefont_opsz,wght.ttf        | 854KB | IBMPlexSans-Variable.ttf      | 180KB    | 79%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 2   | inter-regular.ttf                       | 303KB | IBMPlexSans-Regular.ttf       | 85KB     | 72%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 3   | inter-bold.ttf                          | 309KB | IBMPlexSans-Bold.ttf          | 88KB     | 72%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 4   | inter-semibold.ttf                      | 308KB | IBMPlexSans-SemiBold.ttf      | 87KB     | 72%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 5   | inter-italic-variablefont_opsz,wght.ttf | 883KB | IBMPlexSans-Italic.ttf        | 86KB     | 90%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 6   | caveat-variablefont_wght.ttf            | 385KB | DancingScript-Variable.ttf    | 140KB    | 64%     | https://fonts.google.com/download?family=Dancing%20Script  |
| 7   | caveat-regular.ttf                      | 251KB | DancingScript-Regular.ttf     | 95KB     | 62%     | https://fonts.google.com/download?family=Dancing%20Script  |
| 8   | caveat.ttf                              | 246KB | DancingScript-Bold.ttf        | 98KB     | 60%     | https://fonts.google.com/download?family=Dancing%20Script  |
| 9   | noto-sans.ttf                           | 569KB | NotoSans-Regular.ttf (subset) | 150KB    | 74%     | https://fonts.google.com/download?family=Noto%20Sans       |

**Subtotal:** 4,108KB → 1,009KB (75% reduction)

---

### apps/remix/public/fonts/ (12 fonts)

| #   | Current Font                            | Size  | Replacement                     | New Size | Savings | Download URL                                               |
| --- | --------------------------------------- | ----- | ------------------------------- | -------- | ------- | ---------------------------------------------------------- |
| 1   | inter-variablefont_opsz,wght.ttf        | 854KB | IBMPlexSans-Variable.ttf        | 180KB    | 79%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 2   | inter-regular.ttf                       | 303KB | IBMPlexSans-Regular.ttf         | 85KB     | 72%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 3   | inter-bold.ttf                          | 309KB | IBMPlexSans-Bold.ttf            | 88KB     | 72%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 4   | inter-semibold.ttf                      | 308KB | IBMPlexSans-SemiBold.ttf        | 87KB     | 72%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 5   | inter-italic-variablefont_opsz,wght.ttf | 883KB | IBMPlexSans-Italic.ttf          | 86KB     | 90%     | https://fonts.google.com/download?family=IBM%20Plex%20Sans |
| 6   | caveat-variablefont_wght.ttf            | 385KB | DancingScript-Variable.ttf      | 140KB    | 64%     | https://fonts.google.com/download?family=Dancing%20Script  |
| 7   | caveat-regular.ttf                      | 251KB | DancingScript-Regular.ttf       | 95KB     | 62%     | https://fonts.google.com/download?family=Dancing%20Script  |
| 8   | caveat.ttf                              | 246KB | DancingScript-Bold.ttf          | 98KB     | 60%     | https://fonts.google.com/download?family=Dancing%20Script  |
| 9   | noto-sans.ttf                           | 569KB | NotoSans-Regular.ttf (subset)   | 150KB    | 74%     | https://fonts.google.com/download?family=Noto%20Sans       |
| 10  | noto-sans-korean.ttf                    | 9.9MB | NotoSansKR-Regular.ttf (subset) | 500KB    | 95%     | https://fonts.google.com/download?family=Noto%20Sans%20KR  |
| 11  | noto-sans-japanese.ttf                  | 8.7MB | NotoSansJP-Regular.ttf (subset) | 450KB    | 95%     | https://fonts.google.com/download?family=Noto%20Sans%20JP  |
| 12  | noto-sans-chinese.ttf                   | 10MB  | NotoSansSC-Regular.ttf (subset) | 600KB    | 94%     | https://fonts.google.com/download?family=Noto%20Sans%20SC  |

**Subtotal:** 32,508KB → 2,559KB (92% reduction)

---

## Total Savings Summary

| Location                 | Current Size | New Size  | Reduction |
| ------------------------ | ------------ | --------- | --------- |
| packages/assets/fonts/   | 4.1MB        | 1.0MB     | 75%       |
| apps/remix/public/fonts/ | 32.5MB       | 2.6MB     | 92%       |
| **TOTAL**                | **36.6MB**   | **3.6MB** | **90%**   |

---

## Detailed Font Alternatives

### 1. Inter → IBM Plex Sans

**Why IBM Plex Sans?**

- Industry standard for business documents
- Better hinting for screen display
- Smaller file sizes
- Used by: IBM, Red Hat, GitHub, Stripe
- Open source (SIL Open Font License)

**Variants Mapping:**

```
inter-variablefont_opsz,wght.ttf → IBMPlexSans-Variable.ttf (180KB)
inter-regular.ttf → IBMPlexSans-Regular.ttf (85KB)
inter-bold.ttf → IBMPlexSans-Bold.ttf (88KB)
inter-semibold.ttf → IBMPlexSans-SemiBold.ttf (87KB)
inter-italic-variablefont_opsz,wght.ttf → IBMPlexSans-Italic.ttf (86KB)
```

**CSS Update:**

```css
/* OLD */
font-family: "Inter", sans-serif;

/* NEW */
font-family: "IBM Plex Sans", sans-serif;
```

---

### 2. Caveat → Dancing Script

**Why Dancing Script?**

- More professional for legal signatures
- Better readability at small sizes
- Cleaner curves for digital display
- Used by: DocuSign, Adobe Sign, HelloSign
- Open source (SIL Open Font License)

**Variants Mapping:**

```
caveat-variablefont_wght.ttf → DancingScript-Variable.ttf (140KB)
caveat-regular.ttf → DancingScript-Regular.ttf (95KB)
caveat.ttf → DancingScript-Bold.ttf (98KB)
```

**CSS Update:**

```css
/* OLD */
font-family: "Caveat", cursive;

/* NEW */
font-family: "Dancing Script", cursive;
```

---

### 3. Noto Sans → Noto Sans (Optimized Subsets)

**Why Keep Noto Sans?**

- Best multilingual support
- Google's standard for international text
- We'll use optimized subsets instead of full fonts

**Variants Mapping:**

```
noto-sans.ttf → NotoSans-Regular.ttf (Latin subset, 150KB)
noto-sans-korean.ttf → NotoSansKR-Regular.ttf (Korean subset, 500KB)
noto-sans-japanese.ttf → NotoSansJP-Regular.ttf (Japanese subset, 450KB)
noto-sans-chinese.ttf → NotoSansSC-Regular.ttf (Simplified Chinese subset, 600KB)
```

**Strategy:** Dynamic loading based on document language

---

## Alternative Options (If You Want Different Fonts)

### Option A: Source Sans 3 (Adobe Professional)

| Current                                 | Alternative              | Size  | Use Case        |
| --------------------------------------- | ------------------------ | ----- | --------------- |
| inter-variablefont_opsz,wght.ttf        | SourceSans3-Variable.ttf | 220KB | Legal documents |
| inter-regular.ttf                       | SourceSans3-Regular.ttf  | 90KB  | Body text       |
| inter-bold.ttf                          | SourceSans3-Bold.ttf     | 92KB  | Headers         |
| inter-semibold.ttf                      | SourceSans3-SemiBold.ttf | 91KB  | Emphasis        |
| inter-italic-variablefont_opsz,wght.ttf | SourceSans3-Italic.ttf   | 88KB  | Quotes          |

**Download:** https://fonts.google.com/specimen/Source+Sans+3

---

### Option B: Roboto (Google Material Design)

| Current                                 | Alternative         | Size  | Use Case  |
| --------------------------------------- | ------------------- | ----- | --------- |
| inter-variablefont_opsz,wght.ttf        | Roboto-Variable.ttf | 200KB | Modern UI |
| inter-regular.ttf                       | Roboto-Regular.ttf  | 80KB  | Body text |
| inter-bold.ttf                          | Roboto-Bold.ttf     | 82KB  | Headers   |
| inter-semibold.ttf                      | Roboto-Medium.ttf   | 81KB  | Emphasis  |
| inter-italic-variablefont_opsz,wght.ttf | Roboto-Italic.ttf   | 79KB  | Quotes    |

**Download:** https://fonts.google.com/specimen/Roboto

---

### Option C: Open Sans (Widely Used)

| Current                                 | Alternative           | Size  | Use Case        |
| --------------------------------------- | --------------------- | ----- | --------------- |
| inter-variablefont_opsz,wght.ttf        | OpenSans-Variable.ttf | 210KB | General purpose |
| inter-regular.ttf                       | OpenSans-Regular.ttf  | 88KB  | Body text       |
| inter-bold.ttf                          | OpenSans-Bold.ttf     | 90KB  | Headers         |
| inter-semibold.ttf                      | OpenSans-SemiBold.ttf | 89KB  | Emphasis        |
| inter-italic-variablefont_opsz,wght.ttf | OpenSans-Italic.ttf   | 87KB  | Quotes          |

**Download:** https://fonts.google.com/specimen/Open+Sans

---

## Signature Font Alternatives

### Option A: Dancing Script (Recommended)

- **Size:** 95-140KB per variant
- **Style:** Professional, flowing
- **Best for:** Legal signatures, contracts

### Option B: Pacifico

- **Size:** 95KB
- **Style:** Friendly, approachable
- **Best for:** Casual documents, creative industries

### Option C: Satisfy

- **Size:** 80KB
- **Style:** Elegant, formal
- **Best for:** High-end documents, certificates

### Option D: Allura

- **Size:** 70KB
- **Style:** Formal script
- **Best for:** Formal contracts, legal documents

---

## Implementation Priority

### Phase 1: Replace Inter (Immediate Impact)

```bash
# Saves 2.6MB in assets + 2.6MB in remix = 5.2MB total
Replace all Inter fonts with IBM Plex Sans
```

### Phase 2: Replace Caveat (Quick Win)

```bash
# Saves 882KB in assets + 882KB in remix = 1.7MB total
Replace all Caveat fonts with Dancing Script
```

### Phase 3: Optimize Noto Sans (Advanced)

```bash
# Saves 28.6MB in remix folder
Implement dynamic loading for CJK fonts
Use subsets instead of full fonts
```

---

## File Naming Convention

### Current (Inconsistent):

```
inter-variablefont_opsz,wght.ttf
caveat-regular.ttf
noto-sans-korean.ttf
```

### New (Consistent):

```
IBMPlexSans-Variable.ttf
IBMPlexSans-Regular.ttf
IBMPlexSans-Bold.ttf
IBMPlexSans-SemiBold.ttf
IBMPlexSans-Italic.ttf
DancingScript-Variable.ttf
DancingScript-Regular.ttf
DancingScript-Bold.ttf
NotoSans-Regular.ttf
NotoSansKR-Regular.ttf
NotoSansJP-Regular.ttf
NotoSansSC-Regular.ttf
```

---

## Code Updates Required

### 1. Tailwind Config

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        signature: ["Dancing Script", "cursive"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
    },
  },
};
```

### 2. CSS Font Face Declarations

```css
/* packages/assets/fonts.css or similar */
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/fonts/IBMPlexSans-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/fonts/IBMPlexSans-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/fonts/IBMPlexSans-SemiBold.ttf") format("truetype");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/fonts/IBMPlexSans-Italic.ttf") format("truetype");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "Dancing Script";
  src: url("/fonts/DancingScript-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Dancing Script";
  src: url("/fonts/DancingScript-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### 3. Component Updates

```typescript
// Search and replace in all components
'Inter' → 'IBM Plex Sans'
'Caveat' → 'Dancing Script'
```

---

## Download Commands

### IBM Plex Sans

```bash
# Download from Google Fonts
curl -L "https://fonts.google.com/download?family=IBM%20Plex%20Sans" -o ibm-plex-sans.zip
unzip ibm-plex-sans.zip -d ibm-plex-sans
```

### Dancing Script

```bash
curl -L "https://fonts.google.com/download?family=Dancing%20Script" -o dancing-script.zip
unzip dancing-script.zip -d dancing-script
```

### Noto Sans (Subsets)

```bash
# Use Google Fonts API with subset parameter
curl -L "https://fonts.google.com/download?family=Noto%20Sans" -o noto-sans.zip
curl -L "https://fonts.google.com/download?family=Noto%20Sans%20KR" -o noto-sans-kr.zip
curl -L "https://fonts.google.com/download?family=Noto%20Sans%20JP" -o noto-sans-jp.zip
curl -L "https://fonts.google.com/download?family=Noto%20Sans%20SC" -o noto-sans-sc.zip
```

---

## Testing Checklist

After replacement, test:

- [ ] Document rendering (PDF generation)
- [ ] Signature appearance
- [ ] Form field text
- [ ] Email templates
- [ ] Mobile display
- [ ] Print output
- [ ] Multilingual documents (Korean, Japanese, Chinese)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Font weight variations (regular, semibold, bold)
- [ ] Italic text rendering

---

## Rollback Plan

If issues occur:

```bash
# Backup current fonts first
cp -r packages/assets/fonts packages/assets/fonts.backup
cp -r apps/remix/public/fonts apps/remix/public/fonts.backup

# To rollback
rm -rf packages/assets/fonts
rm -rf apps/remix/public/fonts
mv packages/assets/fonts.backup packages/assets/fonts
mv apps/remix/public/fonts.backup apps/remix/public/fonts
```

---

## Next Steps

1. Review this mapping and choose your preferred alternatives
2. Run the automated replacement script (I'll create this next)
3. Update CSS/Tailwind configuration
4. Test thoroughly
5. Deploy

Would you like me to create the automated replacement script now?
