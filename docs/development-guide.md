---
doc_type: development-guide
project: clubedaweb
generated: 2026-05-14
---

# Development Guide — clubedaweb

> Read `_bmad-output/project-context.md` **before writing code** — it captures the canonical rules. This guide is the operational onboarding.

## Prerequisites

- **Node.js 20.x** (required by `@aws-sdk/client-s3`)
- **PostgreSQL 15** (docker-compose ships one)
- **npm** (project ships `package-lock.json`. The Dockerfile uses Yarn classic inside the container, but local dev uses npm.)
- **Docker / docker-compose** (optional but easiest local path)

## Environment

The project reads `.env` via `dotenv`. A `.env.example` is not currently committed — create `.env` with at minimum:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clubedaweb?schema=public

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-string>

# AWS S3 (for uploads)
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...

# OpenAI (AI features)
OPENAI_API_KEY=...

# Evolution API (WhatsApp)
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...

# Email (SMTP/IMAP)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

# Cron shared secret (verify per route in app/api/cron/*)
CRON_SECRET=...
```

> Inspect individual `lib/*.ts` modules for any env var they reference — there is no central env validation module. **Never commit `.env`.**

`lib/db.ts` auto-appends `connection_limit=5` to `DATABASE_URL` if not already present. The project relies on a low pool — do not bump without measuring.

## Local Setup

### Option A — Docker (fastest)

```bash
docker-compose up -d
# Postgres exposes 5432; app exposes 3001 (host) → 3000 (container).
# On startup, the container runs:
#   yarn prisma migrate deploy 2>/dev/null || yarn prisma db push --accept-data-loss
#   yarn dev
```

### Option B — Native

```bash
npm install
npx prisma generate
npx prisma db push                  # NO migrations folder; schema is push-based
npx prisma db seed                  # safe seed (scripts/safe-seed.ts)
npm run dev                          # starts at http://localhost:3000
```

## NPM Scripts

| Command                | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Next.js dev server                                      |
| `npm run build`        | `prisma generate && next build`                         |
| `npm start`            | Run the built app                                       |
| `npm run lint`         | ESLint (CI bypasses this — local-only gate)             |
| `npm test`             | Full Jest suite                                         |
| `npm run test:api`     | Only `__tests__/api`                                    |
| `npm run test:watch`   | Interactive watch mode                                  |
| `npm run test:coverage`| Coverage report                                         |

## Pre-Commit Gate (CI does NOT enforce these)

`next.config.js` has `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true`. Lint + type errors **will not fail CI builds**. Run these locally before committing:

```bash
npx tsc --noEmit       # type-check
npm run lint           # lint
npm test               # or at least `npm run test:api` for endpoint changes
```

For schema changes:
```bash
# No migrations/ folder exists — for now, just db push.
npx prisma db push
# When introducing destructive changes, plan a migration strategy first.
```

## Code Conventions Quick Reference

(All of these are expanded in `_bmad-output/project-context.md`.)

- **Imports** via `@/...` alias only. Never `../../../`.
- **Prisma** via `import { prisma } from '@/lib/db'`. Never `new PrismaClient()`.
- **Client components** declare `"use client"` as the first non-comment line.
- **Server-only modules** (`lib/db`, `lib/auth-options`, `lib/s3`, `lib/email`) MUST NOT be imported into client components.
- **API errors** use typed errors from `@/lib/api-errors`, wrapped by `handleAPIError`.
- **Validation** uses Zod from `lib/validation-schemas.ts` (Yup/Formik are legacy).
- **Logging** via `lib/logger.ts`. No `console.log` in shipping code.
- **Sanitize HTML** with `sanitizeHtml` / `sanitizeEmailHtml` for user input.
- **shadcn primitives** — add via shadcn CLI; don't hand-roll.
- **Tailwind tokens** — use `bg-background`, `text-foreground`, etc.; avoid hex codes for theme-aware surfaces.
- **No new state/toast/fetch libraries** — the project already has 3+ of each.

## Testing Conventions

- Location: `__tests__/api/*.test.ts` (endpoints) and `__tests__/lib/*.test.ts` (units).
- `__tests__/api/setup.ts` and `__tests__/api/mocks.ts` are **not** test files (skipped via `testPathIgnorePatterns`).
- Always mock Prisma (use `mockPrisma` from `__tests__/api/mocks.ts`); never hit a real DB.
- Mock NextAuth by overriding `getServerSession` per test.
- Existing endpoint test files include placeholder stubs (`expect(true).toBe(true)`) — **replace stubs with real assertions when you touch the corresponding endpoint.**
- Priority of assertions: validation 400 → auth 401/403 → rate-limit 429 → happy-path shape → error-mapping (NotFoundError → 404, etc.).

## Working on the WhatsApp / AI / Cron Subsystems

- All Evolution API calls go through `lib/evolution-api.ts` — never call the Evolution HTTP endpoint directly.
- All OpenAI calls go through `lib/ai-agent.ts`. Each AI call should record usage at `app/api/gestor/ai-usage`.
- Cron endpoints in `app/api/cron/*` expect a shared-secret header (read the handler for the exact header name).

## Maintenance Scripts

`scripts/*.ts` are one-off `tsx` scripts. Run with:

```bash
npx tsx scripts/<name>.ts
```

Do **not** add them to `package.json` unless they're idempotent. `scripts/safe-seed.ts` is the seeder wired to `prisma.seed`; `scripts/seed.ts` is destructive.

## Common Tasks Cookbook

### Add an endpoint
See [api-contracts.md → "Adding a New Endpoint — Checklist"](./api-contracts.md).

### Add a UI component
See [component-inventory.md → "Adding a New Component — Checklist"](./component-inventory.md).

### Add a Prisma model
1. Edit `prisma/schema.prisma`.
2. `npx prisma db push`
3. `npx prisma generate` (also runs implicitly via `prisma migrate dev` if you adopt migrations later).
4. Add Zod schema(s) to `lib/validation-schemas.ts`.
5. Update any seeder if applicable.

### Reset the admin user
```bash
npx tsx scripts/reset-admin.ts
```

### Migrate legacy images to S3
```bash
npx tsx scripts/migrate-images-to-s3.ts
```

## Troubleshooting

| Symptom                                                       | Likely cause / fix                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `PrismaClientInitializationError`                              | `.env` missing `DATABASE_URL` or Postgres unreachable                                  |
| 401 from `/api/gestor/*` in development                        | Sign in at `/gestor/login`; session is JWT                                            |
| 403 from admin endpoints                                       | `requireRole(request, ["admin"])` — set user `role` accordingly                       |
| New external host blocked in browser                           | Update CSP `connect-src`/`script-src` in `middleware.ts`                              |
| `Cannot find module '@/lib/...'` in tests                      | Check `jest.config.js` `moduleNameMapper`; use the `@/` alias in tests                |
| Prisma generate fails with output-path errors                  | Don't move `prisma/schema.prisma`; Dockerfile mirrors the legacy `output` path        |
| Browser bundle suddenly huge                                   | Verify `productionBrowserSourceMaps: false` and custom chunk filenames in `next.config.js` |
