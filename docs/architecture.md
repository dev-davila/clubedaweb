---
doc_type: architecture
project: clubedaweb
generated: 2026-05-14
project_type: web (monolith, single part)
---

# Architecture — clubedaweb

## Executive Summary

`clubedaweb` is a **single-process Next.js 14 monolith** that bundles a public marketing/editorial website, a back-office CMS (`/gestor`), and a constellation of marketing-automation surfaces (WhatsApp via Evolution API, social publishing on 4 platforms, OpenAI-based content + image generation, in-app AI agents, SEO automation for Google + Bing). Persistence is a **single PostgreSQL database** with **64 Prisma models**. All inter-system calls fan out from one process; there is no separate API service or worker tier. Cron-style background work is exposed as HTTP endpoints triggered by an external scheduler.

## Architectural Pattern

| Layer                | Implementation                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| **Edge boundary**    | `middleware.ts` — security headers, CSP, CORS, request log, IP collection                            |
| **Presentation**     | Next.js App Router. Server Components by default; client islands marked `"use client"`               |
| **API / mutation**   | Route handlers at `app/api/**/route.ts` (190 routes). REST-style, JSON in/out                       |
| **Auth**             | NextAuth (JWT strategy, Credentials provider, Prisma adapter), `lib/auth-options.ts`                 |
| **Domain logic**     | `lib/*.ts` modules (flat layout). Sub-folders only where a module spans multiple files               |
| **Persistence**      | Prisma ORM via single shared client (`lib/db.ts`); PostgreSQL 15                                     |
| **Cross-cutting**    | `lib/security/` (block, rate-limit, detection), `lib/cache.ts` (cache-aside), `lib/logger.ts`        |
| **Storage**          | AWS S3 v3 SDK (`lib/s3.ts`)                                                                          |
| **External AI**      | `lib/ai-agent.ts` (OpenAI) — all calls funnel here for usage tracking                                |
| **Messaging**        | `lib/evolution-api.ts` (WhatsApp via Evolution API)                                                  |
| **Background jobs**  | HTTP `app/api/cron/*` endpoints triggered by an external scheduler with a shared secret             |

This is a textbook *layered Next.js app*: Edge middleware → page/handler → lib → ORM → DB, with sidecar integrations.

## Key Architectural Decisions

| Decision                                                                       | Why it matters                                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Single shared Prisma proxy** in `lib/db.ts`                                  | Avoids exhausting connections; auto-appends `connection_limit=5`. **Never `new PrismaClient()`.** |
| **`force-dynamic` on 122/124 gestor routes**                                   | These routes depend on session/IP; static generation would break auth                       |
| **Per-endpoint IP block + rate limit, NOT in middleware**                      | Edge runtime can't `await` DB. Block/rate-limit logic lives in `lib/security/*` and is called from handlers. |
| **Build-error suppression (`ignoreDuringBuilds: true`)**                       | Pragmatic for legacy code, but **CI does not gate type/lint errors** → local `tsc --noEmit` + lint are the gate |
| **`db push` instead of `prisma migrate`**                                      | Faster iteration; **dangerous for prod**. Plan a migration strategy before destructive schema changes. |
| **All AI calls go through `lib/ai-agent.ts`**                                  | Single point for rate limits, logging, usage tracking. Records to `AIUsageLog`.            |
| **All WhatsApp calls go through `lib/evolution-api.ts`**                       | Centralizes auth, retries, per-user instance routing.                                       |
| **Multi-brand layouts** in `components/home-*` switched via `lib/themes`       | Same codebase serves different brand sites without forking                                  |
| **NextAuth typing escape hatch** (`session.user as any`)                       | Existing code reads `.role` / `.id` via `any` cast — keep pattern or extend `types/next-auth.d.ts` |
| **No CI / no PR template**                                                     | All quality gates are local. Document changes well in PR body.                              |
| **Hardcoded Prisma `output` path matches Dockerfile WORKDIR**                  | Legacy artifact from Abacus.AI hosting. Don't move the schema.                              |

## Request Lifecycle

### Authenticated admin write (typical gestor endpoint)

```
Client
  └── HTTPS request
      └── (reverse proxy / TLS)
          └── Edge middleware (middleware.ts)
                ├── Security headers
                ├── CSP
                ├── CORS (for /api/*)
                └── Pass-through (IP blocking is NOT here — Edge can't await DB)
              ↓
          App Router route handler (app/api/gestor/*/route.ts)
                ├── export const dynamic = "force-dynamic"
                ├── getClientIP(request)                            ← lib/security
                ├── await checkRateLimit(...)                       ← lib/security
                ├── const session = await getServerSession(...)     ← NextAuth + Prisma adapter
                │    → 401 if missing, 403 via requireRole
                ├── const data = schema.parse(await request.json()) ← Zod (lib/validation-schemas)
                │    → throws ValidationError on failure
                ├── (sanitize HTML if applicable)                   ← lib/sanitize-html
                ├── const result = await prisma....                 ← lib/db (shared proxy)
                ├── (side effects: S3, OpenAI, Evolution, email)
                └── return NextResponse.json(result)
              ↓
        catch (error) → handleAPIError(error)                       ← lib/api-errors
              ↓
        Client receives standardized JSON error or success
```

### Public page render (Server Component)

```
Client
  └── HTTPS request
      └── Edge middleware (security headers, CSP, CORS)
          └── app/<route>/page.tsx  (Server Component, async)
                ├── await loadSiteConfig()       ← lib/site-config-server
                ├── await prisma.<model>.findMany(...)
                └── render React tree
          → response is HTML + RSC payload + client chunks
                                          ↑
                                  Custom chunk filenames for CDN cache busting
```

### Public chronicle approval (token-based, no session)

```
External recipient clicks email link
  → /cronicas/aprovacao/<token>
  → app/api/cronicas/aprovacao/[token]/route.ts validates token vs ApprovalToken table
  → mutates Chronicle status
  → no session required, but token is single-use and time-bound
```

## Data Architecture

- Single Postgres database, single schema, **64 Prisma models** in `prisma/schema.prisma` (1455 lines).
- See [data-models.md](./data-models.md) for the full catalog. Domain clusters:
  - Identity & Auth — `User`, `AuditLog`
  - Content — `BlogPost` (+ taxonomies + versions), `Post` (legacy), `Chronicle`, `VoiceTemplate`
  - CMS — `SiteConfig`, `DynamicPage`, `InstitutionalPage`, `MediaLibrary`, `BrandTokens`, `NavigationMenu`
  - Catalog / Marketing — `Partner`, `SoftwareProduct`, `Solution`
  - SEO / Analytics — `SEOGoogleToken`, `SEOIndexNowLog`, `PageView`, `SocialMetric`
  - Social — `SocialMediaAccount`, `SocialPublication`
  - Security — `SecurityEvent`, `SecurityBlock`, `SecurityAllowlist`, `SecurityRateLimit`, `SecurityLoginAttempt`, `SecuritySetting`
  - WhatsApp — `EvolutionInstance`, `WaContact`, `WaConversation`, `WaMessage`, `WaTag`, `WaScheduledContact`
  - AI agents — `AiAgentConfig`, `AiSession`, `AiSessionMessage`, `AIUsageLog`, `AIPageModification`, `AIQuota`
  - Email marketing — `NewsletterSubscriber`, `ContactMessage`, `NotificationRecipient`
- **Soft delete** column (`deletedAt`) on `BlogPost` (and likely others — confirm per model). Default queries must filter `where: { deletedAt: null }`.
- **No migrations folder** — schema changes are applied via `prisma db push`. Treat the schema file as authoritative.
- **No data migrations layer** for type/shape conversions — large refactors require purpose-built scripts under `scripts/`.

## API Design

See [api-contracts.md](./api-contracts.md). Key points:
- 190 route handlers grouped by domain (auth, public content, cron, crônicas, gestor, social).
- All handlers follow the same skeleton: rate-limit → auth → validate → DB / external → typed error or JSON success.
- No GraphQL, no tRPC, no gRPC. Plain REST-style JSON.
- No Next.js Server Actions detected — mutations go through API routes.

## Component Architecture (Frontend)

See [component-inventory.md](./component-inventory.md).

- **Server-first**: pages default to Server Components. Client islands end in `-client.tsx`.
- **Primitives**: 48 shadcn/ui components in `components/ui/` (kebab-case, Radix-based).
- **Brand variants**: `components/home/`, `home-bd/`, `home-m3/`, `m3-original/`, `bd-redesign/` — selected at runtime via theming.
- **Design tokens** via Tailwind CSS variables in `app/globals.css`; dark mode = `class` strategy.
- **State pluralism** (Zustand + Jotai + TanStack Query + SWR all present) → **match the surrounding file**; do not introduce a new library casually.

## Security

| Layer                           | Mechanism                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Network                         | Reverse proxy TLS (out of scope of repo)                                                     |
| Edge                            | `middleware.ts` — CSP, X-Content-Type-Options, X-XSS-Protection, Permissions-Policy, Referrer-Policy |
| Authentication                  | NextAuth JWT + Credentials + bcryptjs                                                        |
| Authorization                   | `requireAuth`, `requireRole(['admin'])` from `lib/api-utils`                                  |
| Input validation                | Zod (`lib/validation-schemas.ts`)                                                            |
| XSS                             | `sanitizeHtml` / `sanitizeEmailHtml` from `lib/sanitize-html` for all user HTML              |
| Rate limiting                   | Per-endpoint via `lib/security/rate-limit-service.ts`. Conventions: 100/min, 30/min, 20/min, 5/min |
| IP blocking                     | Per-endpoint via `lib/security/block-service.ts` (Edge can't await DB)                        |
| Detection                       | `lib/security/detection-engine.ts` + `inspector.ts`                                            |
| Login attempts                  | `SecurityLoginAttempt` table                                                                  |
| CSP                             | Inline in `middleware.ts`. **Any new external host must be added to CSP** (script/img/connect-src) |
| Secrets                         | `.env` file on host. **No secret manager wiring.** Never commit. Never log.                  |
| Password storage                | bcryptjs hashes                                                                                |

## Integrations

| Integration             | Module                                  | Notes                                                            |
| ----------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| PostgreSQL              | Prisma, `lib/db.ts`                     | Single proxy; `connection_limit=5`                               |
| AWS S3                  | `lib/s3.ts`, `lib/aws-config.ts`        | Pre-signed URLs server-side; `lib/image-validator.ts` before store |
| OpenAI                  | `lib/ai-agent.ts`                       | Usage logged to `AIUsageLog` + `AIQuota`                          |
| Evolution API (WhatsApp)| `lib/evolution-api.ts`                  | `EvolutionInstance` is per-user                                   |
| Email out               | `lib/email.ts` (nodemailer)             | Templates in `lib/email-signature-templates.ts`                   |
| Email in                | `lib/email.ts` (imapflow + mailparser)  | For inbound parsing                                               |
| Google SEO              | `lib/google-search-console.ts`, `lib/google-analytics-api.ts` | OAuth tokens in `SEOGoogleToken`            |
| Bing SEO                | `lib/bing-webmaster.ts`                 | IndexNow log in `SEOIndexNowLog`                                  |
| Facebook / Instagram    | `app/api/social/{facebook,instagram}/*` |                                                                    |
| LinkedIn                | `app/api/social/linkedin/*`             | Includes organizations endpoint                                   |
| Twitter / X             | `app/api/social/twitter/*`              | Refresh-token endpoint present                                    |
| Maps                    | `mapbox-gl`                             | Client-side only                                                  |
| Analytics               | Custom (`PageView`) + GA (`components/google-analytics.tsx`) |                                              |

## Caching Strategy

- **Cache-aside** helpers in `lib/cache.ts` and `lib/cache-helpers.ts`. Tested via `__tests__/api/cache.test.ts`.
- No global CDN config in the repo — handled at the reverse proxy / hosting layer.
- Next.js fetch caching is bypassed for gestor routes via `dynamic = "force-dynamic"`.

## Deployment Architecture

See [deployment-guide.md](./deployment-guide.md). Summary:
- Single-host monolith — `next start` after `npm run build`.
- `docker-compose.yml` is dev-only (it runs `yarn dev`).
- Prod deploy is `git pull` + `prisma generate` + `prisma db push` + `next build` + restart.
- No CI/CD pipeline files present.

## Known Risks & Gaps

| Risk                                                                    | Mitigation                                                                 |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Schema rollback is manual (no `prisma/migrations/`)                     | Back up before destructive schema changes; plan migration adoption          |
| TS/lint errors don't fail CI                                            | Local pre-commit gate; consider adopting GitHub Actions                     |
| No central env validator                                                | Each `lib/*.ts` reads env directly; consider a boot-time validator          |
| Multiple state/toast libs coexist                                       | Risk of divergent UX; codify the choice per surface                         |
| No APM (Sentry/Datadog) wired                                           | Errors surface only via `lib/logger.ts` + reverse proxy logs                |
| `yarn.lock` symlink trick in Docker                                     | Pin Node + package manager versions explicitly to reduce surprise           |
| `next.config.js` redirects + `UrlRedirect` table can both serve redirects | Decide policy: legacy permanent → next.config; dynamic editorial → table   |
| IE11 in `browserslist`                                                  | Mostly relevant only to public pages; gestor is admin-only                  |

## Future-State Suggestions

- Adopt `prisma migrate dev` and commit `prisma/migrations/` before the next destructive schema change.
- Adopt GitHub Actions running `tsc --noEmit`, `lint`, `test:api` on PRs.
- Add Sentry (or equivalent) — `lib/logger.ts` is a natural integration point.
- Add `.env.example` + a startup env validator to prevent silent boot with missing keys.
- Consolidate toast/state libraries to one each.
- Split the AI subsystem (OpenAI + Evolution AI) into a queue-backed worker when AI traffic outgrows in-process handling.

## See Also

- [`_bmad-output/project-context.md`](../_bmad-output/project-context.md) — **canonical AI rules; mandatory pre-read for any code change**
- [api-contracts.md](./api-contracts.md) — endpoint catalog
- [data-models.md](./data-models.md) — full Prisma model catalog
- [component-inventory.md](./component-inventory.md) — UI catalog
- [source-tree-analysis.md](./source-tree-analysis.md) — annotated tree
- [development-guide.md](./development-guide.md) — local dev setup
- [deployment-guide.md](./deployment-guide.md) — deploy & ops
