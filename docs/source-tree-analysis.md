---
doc_type: source-tree-analysis
project: clubedaweb
generated: 2026-05-14
---

# Source Tree Analysis — clubedaweb

> Annotated tree of the repository root. Folders that exist purely for tooling (`node_modules/`, `.next/`, `.git/`) are omitted.

```
clubedaweb/
├── app/                       # Next.js App Router root
│   ├── layout.tsx             # Root layout (Server Component) — wraps with providers
│   ├── page.tsx               # Home page (Server Component)
│   ├── globals.css            # Tailwind layer + CSS variables
│   ├── not-found.tsx          # Global 404
│   ├── sitemap.ts             # Dynamic sitemap
│   ├── robots.ts              # Dynamic robots.txt
│   ├── feed.xml/              # RSS feed (route segment)
│   │
│   ├── api/                   # 190 route handlers (REST-style)
│   │   ├── auth/[...nextauth] # NextAuth catch-all
│   │   ├── signup             # Public signup
│   │   ├── cron/              # 5 cron endpoints (shared-secret auth)
│   │   ├── cronicas/          # Chronicles workflow + public token surfaces + webhook
│   │   ├── posts/             # Public post views increment
│   │   ├── analytics/         # Page-view ingress
│   │   ├── navigation/, site-config/, seo/, solucoes/, contact/, newsletter/, track/, revisar/, signup/
│   │   ├── social/            # Facebook/Instagram/LinkedIn/Twitter OAuth + publishing
│   │   └── gestor/            # ~140 admin endpoints (force-dynamic, session-gated)
│   │       ├── ai*, ai/{generate-text,generate-image,test-connection}
│   │       ├── analytics/, brand/, catalogo/, categories/, chronicles/, comunicacao/
│   │       ├── configuracoes/, contatos/, cta-templates/, dynamic-pages/, email-marketing/
│   │       ├── forms/, home-config/, institucional/, media/, navigation/, notification-recipients/
│   │       ├── partners/, perfil/, posts/, redirects/, security/, seo/, sitemap-versions/
│   │       ├── smtp/, solucoes/, tags/, templates/, themes/, usuarios/, video/, wizard/
│   │       └── site-config/
│   │
│   ├── gestor/                # Admin UI (App Router pages, mostly Server Components)
│   │   ├── login/, page.tsx, layout.tsx
│   │   ├── posts/, autores/, categorias/, tags/, parceiros/
│   │   ├── cronicas/, calendario/
│   │   ├── catalogo/, solucoes/
│   │   ├── institucional/, paginas/, menus/, aparencia/, temas/
│   │   ├── editor/, assinatura/
│   │   ├── comunicacao/       # WhatsApp + AI agents back-office
│   │   ├── seguranca/, seo/, relatorios/, uso-ia/
│   │   ├── templates/, templates-ia/, ia-paginas/
│   │   ├── home/, perfil/, usuarios/
│   │   ├── redes-sociais/, configuracoes/, contatos/
│   │   └── wizard/            # NEW wizard flow (in progress)
│   │
│   ├── p/                     # Dynamic landing pages by slug
│   ├── cronicas/              # Public chronicle reader
│   ├── catalogo/              # Public software catalog
│   ├── chat/                  # Chat surface
│   ├── revisar/               # Reviewer surface
│   ├── solucoes/              # Public solutions list
│   ├── portfolio/, contato/, noticias/
│   │
│   └── (institutional pages)
│       aviso-de-cookies/, aviso-de-privacidade/, canal-de-denuncias/, etica/,
│       lgpd/, missao-visao-e-valores/, nossos-parceiros/,
│       politica-antissuborno-e-anticorrupcao/, quem-somos/,
│       responsabilidade-social/, sustentabilidade/, trabalhe-conosco/,
│       unsubscribe/, bitdefender-* (legacy slugs — redirected via next.config.js)
│
├── components/                # 133 .tsx files
│   ├── ui/                    # 48 shadcn/ui primitives (Radix-based)
│   ├── gestor/                # Admin islands (-client.tsx)
│   │   └── wizard/            # NEW wizard UI components
│   ├── cms/                   # Visual editor surfaces
│   ├── home/, home-bd/, home-m3/, m3-original/, bd-redesign/   # brand variants
│   ├── noticias/              # News rendering
│   ├── providers.tsx          # NextAuth + Theme + Toaster + Query providers
│   ├── theme-provider.tsx, theme-injector.tsx
│   ├── header.tsx, footer.tsx, site-chrome.tsx
│   ├── contact-form.tsx, newsletter-form.tsx
│   ├── share-button.tsx, whatsapp-button.tsx
│   ├── google-analytics.tsx, analytics-tracker.tsx, not-found-tracker.tsx
│   ├── cookie-consent.tsx, edit-mode-overlay.tsx
│   └── section-title.tsx
│
├── lib/                       # Server-side and shared libraries (flat module style)
│   ├── db.ts                  # ⭐ Shared Prisma proxy (lazy, connection_limit=5)
│   ├── auth-options.ts        # ⭐ NextAuth config (Credentials + JWT + Prisma adapter)
│   ├── api-utils.ts           # requireAuth, requireRole, validateRequest, createAPIHandler
│   ├── api-errors.ts          # Typed errors + handleAPIError
│   ├── validation-schemas.ts  # ⭐ Zod schemas for all endpoints (legacy Yup elsewhere)
│   ├── sanitize-html.ts       # XSS protection for user-supplied HTML
│   ├── logger.ts              # Server logger (use instead of console.log)
│   ├── cache.ts, cache-helpers.ts  # Cache-aside pattern
│   ├── security/              # Block service, rate-limit service, detection engine, inspector
│   │   ├── block-service.ts
│   │   ├── config-service.ts
│   │   ├── detection-engine.ts
│   │   ├── event-service.ts
│   │   ├── inspector.ts
│   │   ├── rate-limit-service.ts
│   │   ├── index.ts
│   │   └── types.ts
│   ├── security.ts            # getClientIP + lightweight helpers (Edge-safe)
│   ├── s3.ts, aws-config.ts, m3-s3-config.ts   # S3 SDK wrappers
│   ├── image-validator.ts
│   ├── ai-agent.ts            # ⭐ OpenAI SDK wrapper — all AI calls route here
│   ├── evolution-api.ts       # ⭐ WhatsApp Evolution API client
│   ├── email.ts, email-signature-templates.ts  # nodemailer + IMAP
│   ├── google-analytics-api.ts, google-search-console.ts, bing-webmaster.ts, seo-credentials.ts
│   ├── social-media.ts, social-publish.ts
│   ├── analytics-helpers.ts
│   ├── site-config-server.ts  # Server-side site config loader
│   ├── use-site-config.ts     # Client hook for site config
│   ├── home-config.ts, active-layout.ts
│   ├── themes/, theme-config.ts  # Multi-brand theming
│   ├── templates/             # Email + content templates
│   ├── cronicas/              # Chronicle domain helpers
│   ├── brazilian-cities.ts, constants.ts, slug.ts, shared-types.ts
│   ├── markdown.ts            # marked + sanitization
│   ├── institutional.ts, software-catalog.ts, solutions-data.ts
│   ├── image-gen-status.ts, migration-config.ts
│
├── prisma/
│   └── schema.prisma          # ⭐ 1455 lines, 64 models, 19 enums.
│                                ⚠️ NO migrations/ folder — db push only.
│                                ⚠️ Hardcoded `output` legacy path; mirrored by Dockerfile.
│
├── hooks/                     # Project hooks (use-*)
│
├── __tests__/                 # Jest tests
│   ├── api/                   # Endpoint tests (many are still stubs)
│   │   ├── setup.ts, mocks.ts # NOT test files (in testPathIgnorePatterns)
│   │   └── *.test.ts
│   └── lib/                   # Real lib unit tests (image-validator, api-errors, logger)
│
├── scripts/                   # tsx maintenance scripts (NOT npm scripts unless idempotent)
│   ├── safe-seed.ts           # ⭐ Safe seeder wired into `prisma.seed`
│   ├── seed.ts                # Destructive seed — manual only
│   ├── reset-admin.ts, verify-login.ts, test-auth.ts
│   ├── migrate-images-to-s3.ts
│   ├── fix-news-images.ts, fix-whatsapp.ts, fix_autodesk.ts, fix_autodesk2.ts
│   ├── update-logos.ts, update-partners.ts, update-post-image.ts
│   ├── check-chronicles.ts, check-post.ts
│   └── delete-proxmox-posts.ts
│
├── types/                     # Ambient typings (incl. NextAuth augmentation)
│
├── public/                    # Static assets
│   └── docs/                  # Public-facing docs (e.g., analise-produto-escala.md)
│
├── _bmad/                     # BMad method config (modules, customizations, scripts)
├── _bmad-output/              # BMad outputs
│   └── project-context.md     # ⭐ Canonical AI rule book — read before any code change
├── docs/                      # ⭐ Project knowledge (THIS documentation set)
│
├── middleware.ts              # Edge middleware: security headers, CSP, CORS, request log
├── next.config.js             # Redirects, webpack chunk filenames, ignore build errors (CI)
├── tailwind.config.ts         # Theme tokens, dark mode = class
├── postcss.config.js
├── components.json            # shadcn/ui config
├── tsconfig.json              # `paths: { "@/*": ["./*"] }`, moduleResolution: bundler
├── jest.config.js             # Test env: node, alias `@/`, testPathIgnorePatterns
├── jest.setup.js
├── package.json               # Scripts: dev, build, start, lint, test, test:api, test:watch, test:coverage
├── docker-compose.yml         # Postgres 15 + app (bind mounts for hot reload)
├── Dockerfile                 # Ubuntu 22.04 + Node 20 + Yarn classic, legacy Abacus path
└── README.md                  # ⚠️ Currently a stub — fill from project-overview.md when ready
```

## Critical Paths (must-not-move without breaking deploy)

| Path                                         | Why it's critical                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                       | Hardcoded `output` path matches Dockerfile working dir                            |
| `lib/db.ts`                                  | Single Prisma proxy; appends `connection_limit=5`                                 |
| `lib/auth-options.ts`                        | NextAuth config consumed by all auth checks                                       |
| `middleware.ts`                              | Edge-runtime CSP; adding a new external host requires editing this file          |
| `next.config.js`                             | Permanent redirects, custom chunk filenames (cache-busting)                       |
| `.env` (not committed)                       | `DATABASE_URL` required for boot                                                  |

## Entry Points

| Surface           | File                                          |
| ----------------- | --------------------------------------------- |
| App boot          | `app/layout.tsx`                              |
| Public home       | `app/page.tsx`                                |
| Admin entry       | `app/gestor/page.tsx` → redirects via auth gate |
| Auth endpoints    | `app/api/auth/[...nextauth]/route.ts`         |
| Edge middleware   | `middleware.ts`                                |
| Prisma client     | `lib/db.ts` (lazy)                            |
| Build step        | `package.json` → `prisma generate && next build` |

## Integration Touchpoints

| Integration       | Library / Module                                  | Surface                                            |
| ----------------- | ------------------------------------------------- | -------------------------------------------------- |
| PostgreSQL        | Prisma                                            | `lib/db.ts`                                        |
| AWS S3            | `@aws-sdk/client-s3` + presigner                  | `lib/s3.ts`, `lib/aws-config.ts`                   |
| OpenAI            | `openai` SDK                                      | `lib/ai-agent.ts` — DO NOT instantiate elsewhere   |
| WhatsApp          | Evolution API (HTTP)                              | `lib/evolution-api.ts`                             |
| Email (out)       | nodemailer                                        | `lib/email.ts`                                     |
| Email (in)        | imapflow + mailparser                             | `lib/email.ts`                                     |
| Maps              | mapbox-gl                                         | client-side only                                   |
| Google SEO        | Search Console + GA4                              | `lib/google-search-console.ts`, `lib/google-analytics-api.ts` |
| Bing SEO          | Bing Webmaster + IndexNow                         | `lib/bing-webmaster.ts`                             |
| Social platforms  | Facebook, Instagram, LinkedIn, Twitter            | `lib/social-publish.ts`, `app/api/social/*`        |
