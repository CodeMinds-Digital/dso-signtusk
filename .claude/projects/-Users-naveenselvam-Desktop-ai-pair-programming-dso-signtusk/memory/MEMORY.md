# SignTusk Project Memory

## Stack
- Remix (React Router v7) + React 18 monorepo in `documenso-main/`
- Package manager: npm, monorepo tool: Turbo
- UI: Radix UI primitives + Tailwind CSS + CSS variables (HSL)
- DB: Prisma + PostgreSQL

## Key Paths
- Main app: `documenso-main/apps/remix/`
- UI primitives: `documenso-main/packages/ui/primitives/`
- Theme tokens: `documenso-main/packages/ui/styles/theme.css`
- Authenticated layout: `apps/remix/app/routes/_authenticated+/_layout.tsx`
- Unauthenticated layout: `apps/remix/app/routes/_unauthenticated+/_layout.tsx`
- Meta/SEO: `apps/remix/app/utils/meta.ts`

## SignTusk UI Architecture (post-redesign, ui-redesign branch)
- **Authenticated app**: Left sidebar layout (`h-screen overflow-hidden` + flex row)
  - Desktop sidebar: `app-sidebar.tsx` (collapsible, 224px / 64px collapsed)
  - Mobile: drawer from left via `app-sidebar-mobile.tsx`
  - Old `app-header.tsx` / `app-nav-desktop.tsx` still exist but are REPLACED by sidebar in `_layout.tsx`
- **Unauthenticated pages**: Split-panel (brand left 44%, form right)
  - Defined in `_unauthenticated+/_layout.tsx`
  - No centered-card-on-pattern; full viewport layout
- **Logo**: `branding-logo.tsx` — SVG wordmark "SIGNTUSK" + tusk icon mark
  - Also exports `BrandingLogoIcon` for collapsed sidebar
- **Design tokens**: `--radius: 0.625rem` (softer than original 0.5rem)
- **Page header pattern**: `bg-muted/30 border-b` strip at top of each page, `max-w-5xl` content

## Brand Identity Rules
- Never use "Documenso" in any user-facing text
- Title format: `{Page} - SignTusk`
- Primary color (green) kept from original; radius increased
- Link style: `text-primary font-medium underline-offset-4 hover:underline`

## TypeScript Notes
- Monorepo has baseline module resolution errors (packages not built) — these are pre-existing
- `ThemeSwitcher` component does NOT accept `className` prop
- `TS7006` implicit-any errors in layout files are pre-existing (same as original codebase)
