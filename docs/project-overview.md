---
doc_type: project-overview
project: clubedaweb
generated: 2026-05-14
generator: bmad-document-project (deep scan)
---

# Project Overview — clubedaweb

## Purpose

`clubedaweb` is a **multi-brand, multi-tenant CMS + marketing automation platform** built on Next.js 14 (App Router). It powers institutional sites with editorial content (blog/news, "crônicas"), a product catalog, a partner directory, dynamic landing pages, and a back-office (`/gestor`) for content, SEO, social-media publishing, WhatsApp conversational AI, and analytics. Originally a M3Solutions / Abacus.AI–hosted Next.js site, now relocated and adapted for self-hosted deployment via `git pull`.

## Project Classification

| Aspect              | Value                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| Repository type     | **Monolith** (single Next.js app, single Postgres DB)                 |
| Primary language    | TypeScript 5.2.2 (`strict: true`, `noImplicitAny: false`)             |
| Framework           | Next.js 14.2.28 — App Router, React Server Components by default       |
| Architecture style  | Layered Next.js: route-handler API + Prisma data layer + RSC pages    |
| Deployment style    | Self-hosted Linux/Ubuntu (Docker for dev, `git pull` for prod)        |
| Brownfield project  | Yes — migrated from Abacus.AI legacy paths; ships with existing data  |
| Team language       | Portuguese (Brazil); docs in English where possible                   |

## Tech Stack Summary

| Category        | Technology                                       | Version   | Notes                                            |
| --------------- | ------------------------------------------------ | --------- | ------------------------------------------------ |
| Runtime         | Node.js                                          | 20.x      | Required by `@aws-sdk/client-s3`                 |
| Framework       | Next.js                                          | 14.2.28   | App Router                                       |
| UI runtime      | React / React DOM                                | 18.2.0    |                                                  |
| Type system     | TypeScript                                       | 5.2.2     | `noImplicitAny: false`                           |
| ORM             | Prisma + `@prisma/client`                        | 5.22.0    | Pinned via `overrides`                           |
| Database        | PostgreSQL                                       | 15        | docker-compose ships pg 15                       |
| Auth            | NextAuth + Prisma adapter                        | 4.24.11   | JWT strategy, bcryptjs hashes                    |
| UI primitives   | shadcn/ui on Radix UI                            | various   | `components/ui/` (kebab-case)                    |
| Styling         | TailwindCSS + tailwind-merge + animate           | 3.3.3     | `class` dark mode, design tokens via CSS vars    |
| Forms           | React Hook Form + Zod                            | 7.53 / 3.25 | `@hookform/resolvers` 3.9                      |
| State (server)  | TanStack Query, SWR                              | 5.0 / 2.2 | Both present — match surrounding file            |
| State (client)  | Zustand, Jotai                                   | 5.0 / 2.6 | Multiple stores — check before adding new        |
| Storage         | AWS S3 (v3 SDK + presigner)                      | 3.x       | Uploads via `lib/s3.ts` only                     |
| AI              | OpenAI SDK                                       | ^6.27.0   | Routed through `lib/ai-agent.ts`                 |
| WhatsApp        | Evolution API client                             | custom    | `lib/evolution-api.ts`                           |
| Email           | nodemailer + imapflow + mailparser               |           | SMTP/IMAP for marketing & in-app email           |
| Maps            | mapbox-gl                                        | 1.13.3    |                                                  |
| Charts          | Plotly, Chart.js, Recharts                       |           | Coexisting — match surrounding usage             |
| Validation      | Zod (primary), Yup + Formik (legacy)             |           | New code uses Zod                                |
| Testing         | Jest + Testing Library + Supertest               | 30 / 16 / 7 | `testEnvironment: 'node'`, alias `@/`         |
| Lint / Format   | ESLint 9.24 + `eslint-config-next` 15.3 + Prettier |         | Bypassed in CI — local-only gate                 |
| Build           | `prisma generate && next build`                  |           |                                                  |
| Deploy          | Ubuntu 22.04 + Yarn classic (in Docker) / `git pull` on host |  | `connection_limit=5` auto-appended to DATABASE_URL |

## High-Level Structure

```
clubedaweb/
├── app/                  # Next.js App Router — public site + /gestor admin
│   ├── api/              # 190 route handlers (REST-style)
│   ├── gestor/           # Back-office (authenticated)
│   ├── p/                # Dynamic landing pages
│   ├── cronicas/         # Editorial "crônicas" reader
│   └── (institutional)/  # Static-ish institutional pages (ética, LGPD, etc.)
├── components/
│   ├── ui/               # shadcn/ui primitives (48 files)
│   ├── gestor/           # Admin UI islands (-client.tsx convention)
│   ├── cms/              # Visual editor and CMS surfaces
│   ├── home/, home-bd/, home-m3/, m3-original/, bd-redesign/  # brand variants
│   └── noticias/         # News rendering
├── lib/                  # Server-side and shared libraries
│   ├── security/         # IP block, rate limit, detection engine
│   ├── templates/        # Email + content templates
│   ├── themes/           # Brand theming
│   ├── cronicas/         # Crônicas domain logic
│   └── *.ts              # Flat modules: db, auth-options, s3, ai-agent, …
├── prisma/
│   └── schema.prisma     # Single schema, 64 models — db push, NO migrations folder
├── hooks/                # React hooks (`use-*`)
├── public/               # Static assets (incl. /public/docs)
├── scripts/              # `tsx` maintenance scripts (seed, S3 migrate, fixers)
├── types/                # Ambient typings (incl. NextAuth augmentation)
├── __tests__/            # Jest unit + API tests (152 passing)
├── _bmad/                # BMad method configuration
├── _bmad-output/         # BMad-generated planning + project-context
└── docs/                 # This documentation set (project_knowledge)
```

## Brand & Multi-Tenant Notes

The project ships multiple brand layouts: `home-m3`, `home-bd`, `m3-original`, `bd-redesign`. Theming is data-driven through `lib/themes/`, `lib/theme-config.ts`, and `components/theme-injector.tsx`. Site config is loaded server-side in `lib/site-config-server.ts` and surfaced via `lib/use-site-config.ts`.

## Documentation Index

- [Architecture](./architecture.md) — system architecture, layers, key flows
- [Source Tree Analysis](./source-tree-analysis.md) — annotated directory tree
- [Data Models](./data-models.md) — 64 Prisma models + 19 enums
- [API Contracts](./api-contracts.md) — 190 route handlers grouped by domain
- [Component Inventory](./component-inventory.md) — UI catalog
- [Development Guide](./development-guide.md) — local setup, commands, pre-commit gate
- [Deployment Guide](./deployment-guide.md) — Docker dev, `git pull` prod

### Existing Documentation

- [README.md](../README.md) — currently stub
- [INTEGRATION_TESTS.md](../INTEGRATION_TESTS.md) — endpoint security & rate-limit test plan
- [TEST_SUMMARY.md](../TEST_SUMMARY.md) — Jest suite summary (13 suites, 152 tests)
- [VALIDACAO_ENDPOINTS.md](../VALIDACAO_ENDPOINTS.md) — Zod validation pattern (in Portuguese)
- [\_bmad-output/project-context.md](../_bmad-output/project-context.md) — **canonical AI rules**; agents MUST read before coding

## Getting Started

See [development-guide.md](./development-guide.md). Minimum path:

```bash
cp .env.example .env  # (create if missing — DATABASE_URL is required)
docker-compose up -d  # Postgres 15 + app
# or, native:
npm install
npx prisma generate
npx prisma db push    # NO migrations/ folder — schema is push-based
npm run dev
```
