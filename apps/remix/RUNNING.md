# Running the Remix App — Step by Step

## Prerequisites

Make sure the following are installed on your machine before starting:

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| PostgreSQL | 14+ | Running locally or via Docker |

---

## 1. Install Dependencies

From the **monorepo root** (not inside `apps/remix`):

```bash
npm install
```

> This installs dependencies for all workspaces including `apps/remix` and all `packages/*`.

---

## 2. Set Up Environment Variables

Copy the example env file inside `apps/remix`:

```bash
cp apps/remix/.env.example apps/remix/.env
```

Then open `apps/remix/.env` and fill in the required values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/signtusk"

# App
NEXT_PUBLIC_WEBAPP_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Mail (use a local SMTP for dev, e.g. Mailhog)
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_FROM="noreply@localhost"
```

> Refer to `.env.example` for the full list of required variables.

---

## 3. Set Up the Database

Run Prisma migrations from the monorepo root:

```bash
npx prisma migrate dev --schema packages/prisma/schema.prisma
```

Optionally seed the database:

```bash
npx prisma db seed --schema packages/prisma/schema.prisma
```

---

## 4. Generate i18n Message Catalogs

The app uses **Lingui** for internationalization. Compile the catalogs before running or building:

```bash
cd apps/remix
npm run messages:compile
```

Or from the monorepo root:

```bash
npm run messages:compile --workspace=@signtusk/remix
```

> This must be run any time `.po` translation files change.

---

## 5. Start the Development Server

From the `apps/remix` directory:

```bash
cd apps/remix
npm run dev
```

Or from the monorepo root:

```bash
npm run dev --workspace=@signtusk/remix
```

The app will be available at **http://localhost:3000** by default.

---

## 6. Run TypeScript Type Check

To check for type errors without building:

```bash
cd apps/remix
npm run typecheck
```

> Fix all TypeScript errors before proceeding to a production build.

---

## 7. Production Build

From `apps/remix`:

```bash
cd apps/remix
npm run build
```

This runs in order:
1. `messages:compile` — compiles Lingui message catalogs
2. `typecheck` — runs `react-router typegen && tsc`
3. `react-router build` — bundles the app for production

If the build fails, the most common causes are:

| Error | Fix |
|-------|-----|
| `Cannot find name 'X'` | Missing import in a route or component file |
| `Type 'string' is not assignable to...` | Type mismatch in packages — check `packages/lib` files |
| `Compiling message catalogs` hangs | Run `npm run messages:compile` manually first |

---

## 8. Start the Production Server

After a successful build:

```bash
cd apps/remix
npm run start
```

---

## Common Scripts Reference

All commands run from `apps/remix` unless noted.

| Script | What it does |
|--------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Full production build (typecheck + bundle) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Run `tsc` type checking only |
| `npm run messages:extract` | Extract new i18n strings from source |
| `npm run messages:compile` | Compile `.po` files to `.js` catalogs |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

---

## Troubleshooting

### `Cannot find name 'Button'` (or any component)
A component is used in a file but not imported. Add the missing import, e.g.:
```tsx
import { Button } from '@signtusk/ui/primitives/button';
```

### `Found X errors in Y files` during typecheck
Run `npm run typecheck` to see the full list. Errors in `../../packages/lib/...` are outside the Remix app — they must be fixed in the relevant package files.

### Database connection error on startup
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `apps/remix/.env`
- Run `npx prisma migrate dev` to apply any pending migrations

### Port already in use
Change the port by setting `PORT=3001` in your `.env` or prefixing the command:
```bash
PORT=3001 npm run dev
```

### Lingui compilation errors
If you see translation-related errors, re-run:
```bash
npm run messages:compile
```

---

## Directory Structure (Key Files)

```
apps/remix/
├── app/
│   ├── routes/          # All React Router routes
│   ├── components/      # Shared UI components
│   └── providers/       # React context providers
├── public/              # Static assets
├── .env                 # Environment variables (not committed)
├── .env.example         # Environment variable template
├── react-router.config.ts
└── package.json
```
