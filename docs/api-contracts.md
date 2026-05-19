---
doc_type: api-contracts
project: clubedaweb
generated: 2026-05-14
source: app/api/**/route.ts (190 route handlers)
---

# API Contracts — clubedaweb

> Route handlers live in `app/api/**/route.ts` (Next.js App Router). Conventions are codified in `_bmad-output/project-context.md` and `VALIDACAO_ENDPOINTS.md`. This document is an **index** — for the full request/response shape of each route, read the handler.

## Standard Handler Skeleton

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { handleAPIError, requireAuth, ValidationError } from '@/lib/api-utils';
import { getClientIP } from '@/lib/security';
import { checkRateLimit } from '@/lib/security';   // DB-backed or in-memory
import { someSchema } from '@/lib/validation-schemas';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';   // 122/124 gestor routes use this

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    await checkRateLimit(`some-key:${ip}`, 30, 60_000);   // mutations: 30/min

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const data = someSchema.parse(await request.json());   // throws ZodError → ValidationError
    const result = await prisma.someModel.create({ data });
    return NextResponse.json(result);
  } catch (error) {
    return handleAPIError(error);
  }
}
```

## Cross-Cutting Conventions

| Concern         | Rule                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Dynamic mode    | `export const dynamic = "force-dynamic"` on every authenticated/dynamic route                  |
| Auth            | `getServerSession(authOptions)` returning 401, OR `requireAuth(request)` / `requireRole(request, ["admin"])` from `@/lib/api-utils` |
| Validation      | Zod schemas in `lib/validation-schemas.ts`. Throw `ValidationError` from `@/lib/api-errors`     |
| Errors          | Wrap in `try / catch (error) { return handleAPIError(error); }`. Never return raw `Error`.     |
| Response shape  | Always `NextResponse.json(...)`. Never plain `Response`.                                        |
| Rate limits     | List endpoints: **100/min**, mutations: **30/min**, AI text: **20/min**, AI image: **5/min**   |
| IP blocking     | Per-endpoint via `lib/security`. Edge middleware cannot await DB.                              |
| HTML sanitize   | User-supplied HTML MUST pass `sanitizeHtml` / `sanitizeEmailHtml` from `@/lib/sanitize-html`   |
| Server actions  | None detected — default to API routes for mutations                                            |

## Endpoints by Domain (190 routes)

### Authentication (`app/api/auth/`, `app/api/signup`)
- `auth/[...nextauth]` — NextAuth catch-all. JWT strategy, Credentials provider, bcryptjs.
- `signup` — public account creation (guard with rate limit).

### Public Content
- `posts/[slug]/views` — page-view increment endpoint
- `navigation`, `site-config`, `site-config/analytics` — public read-only config
- `seo/meta-tags` — meta-tag generator
- `solucoes`, `newsletter/subscribe`, `contact` — public site features

### Cron / Background Jobs (`app/api/cron/*`)
- `cron/enviar-agendamentos` — dispatch scheduled WhatsApp messages
- `cron/limpar-materias-antigas` — purge old collected articles
- `cron/publicar-agendados` — publish scheduled posts
- `cron/renovar-tokens` — refresh OAuth tokens (social platforms, Google)
- `cron/sincronizar-cronicas` — sync chronicles workflow state
> Cron triggers are external (server-side scheduler or platform cron); endpoints typically expect a shared-secret header — verify per route.

### Crônicas (`app/api/cronicas/*`)
~17 routes covering: list/create/update/delete chronicles, generate, send-for-approval, approve/reject, republish-social, recipient management, sites/articles harvesting, public selection/approval via one-time tokens, webhook.

### Analytics
- `analytics/pageview` — server-side tracking ingress
- `gestor/analytics/property|report|local-report` — admin analytics surfaces

### Gestor — Admin Back-Office (`app/api/gestor/*`)
**~140 routes**, grouped:

| Group                                      | What it does                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `gestor/posts/*`                           | CRUD + workflow + image gen + restore + batch image generation + social preview |
| `gestor/authors`, `gestor/authors/*`       | Author CRUD + avatar upload / AI avatar generation                              |
| `gestor/categories`, `gestor/tags`         | Taxonomy CRUD + reorder                                                          |
| `gestor/partners`                          | Partner directory CRUD + home toggle                                             |
| `gestor/solucoes/*`                        | Solutions + categories (incl. seed)                                              |
| `gestor/catalogo/*`                        | Software catalog (categories + produtos)                                         |
| `gestor/institucional/*`                   | Institutional page CRUD                                                          |
| `gestor/dynamic-pages/*`                   | Dynamic landing pages                                                            |
| `gestor/navigation/*`                      | Menu builder + seed                                                              |
| `gestor/redirects/*`                       | Redirects table (active, bulk, hit counter)                                      |
| `gestor/home-config`                       | Home page config + seed                                                          |
| `gestor/templates/[key]`, `gestor/cta-templates` | Template store                                                              |
| `gestor/themes/*`                          | Theme listing + apply                                                            |
| `gestor/brand`                             | BrandTokens management                                                           |
| `gestor/media`                             | Media library                                                                    |
| `gestor/forms`, `gestor/contatos`          | Forms & contact submissions                                                      |
| `gestor/notification-recipients`           | Internal notification routing                                                    |
| `gestor/perfil/senha`                      | Password change                                                                   |
| `gestor/usuarios`                          | User management                                                                  |
| `gestor/sitemap-versions`                  | Sitemap snapshot history                                                          |
| `gestor/configuracoes/robots`              | `robots.txt` editor                                                              |
| `gestor/wizard/generate`                   | Wizard-driven page generation (AI assisted)                                      |
| `gestor/email-marketing/{config,test}`     | Marketing config + test send                                                     |
| `gestor/smtp/{test,send-test}`             | SMTP probe + test send                                                            |

**AI subgroup** (`gestor/ai/*`, `gestor/ai-*`, `gestor/templates-ia`)
- `ai/generate-text` (20/min) — text generation
- `ai/generate-image` (5/min) — image generation
- `ai/test-connection` — provider health
- `ai-suggest-locations` — geo suggestions
- `ai-usage` — quota & usage dashboard
- `posts/[id]/generate`, `posts/[id]/generate-images-batch`, `posts/[id]/regenerate-image`, `posts/[id]/preview-image`, `posts/[id]/save-image`, `posts/[id]/confirm-image`, `posts/[id]/image`
- `video/{generate,status,avatars}` — AI video pipeline

**Communication / WhatsApp** (`gestor/comunicacao/*`)
- `instancias/*` — Evolution API instance lifecycle (connect, status, webhook)
- `servidores` — Evolution servers
- `contatos/*` — WhatsApp contacts CRUD, import, suggestions, scheduled sends
- `mensagens/*` — Messages (incl. AI messages, AI status, feedback)
- `media` — Media for WhatsApp
- `tags/*` — Conversation tagging
- `agendamentos` — Scheduled sends
- `agentes-ia/*` — In-app AI agent platform: config, playground, respond, sessions (list/detail/messages), upload, test-api
- `integracoes/unodesk` — Third-party integration
- `webhook` — Inbound Evolution webhook

**Security** (`gestor/security/*`)
- `events`, `log-event`, `stats`, `blocks`, `allowlist`, `phase`, `settings`
> The "phase" endpoint hints at staged security rollout — read `lib/security/config-service.ts` before changing.

**SEO** (`gestor/seo/*`)
- `config` — SEO config snapshot
- `google/{auth,callback,performance,properties,sitemaps,status}` — Search Console / GA4 OAuth + reads
- `bing/{indexnow,sitemaps,sites,stats,status,submit-url}` — Bing Webmaster + IndexNow

### Social Publishing (`app/api/social/*`)
Per-platform: Facebook, Instagram, LinkedIn, Twitter. Each has:
- `auth`, `callback`, `config`, `delete`, `publish`, `test`
- Facebook adds `pages`; Instagram is single-account; LinkedIn adds `organizations`; Twitter adds `refresh-token`.
- Cross-cutting: `accounts`, `accounts/[platform]`, `publications`

### Revisar / Tracking
- `revisar/[id]` — review surface
- `track` — generic tracker

## Public vs Authenticated Map (high-level)

| Surface              | Auth?                  | Notes                                                  |
| -------------------- | ---------------------- | ------------------------------------------------------ |
| `/api/auth/*`        | NextAuth handles       | Public for sign-in, internal for callbacks             |
| `/api/signup`        | Public                 | Rate-limit critical                                    |
| `/api/cron/*`        | Shared-secret header   | NOT session-based — verify per route                   |
| `/api/cronicas/{selecao,aprovacao}/[token]` | Token-based | Public via one-time token                  |
| `/api/cronicas/webhook`, `/api/social/*/callback`, `/api/gestor/comunicacao/instancias/[id]/webhook`, `/api/gestor/comunicacao/webhook` | Provider-signed | External callbacks |
| `/api/gestor/*`      | `getServerSession` + role check | Admin-only; **122/124 use `force-dynamic`**    |
| Everything else      | Mixed                  | Read individual handlers                                |

## Testing Coverage

See `INTEGRATION_TESTS.md` and `TEST_SUMMARY.md`:
- 13 test suites, 152 passing tests (`__tests__/api/*` + `__tests__/lib/*`)
- Many endpoint test files in `__tests__/api/` are still placeholder stubs (`expect(true).toBe(true)`) — **replace stubs with real assertions when touching the corresponding endpoint.**

## Adding a New Endpoint — Checklist

1. Create `app/api/<segment>/route.ts` with `export const dynamic = "force-dynamic"` if authenticated/dynamic.
2. Add a Zod schema to `lib/validation-schemas.ts` (Yup/Formik are legacy — don't add new usage).
3. Apply rate limiting matching the closest existing pattern (list 100/min, mutation 30/min).
4. Authenticate with `getServerSession` or `requireAuth`. Use `requireRole(request, ["admin"])` for admin-only.
5. Sanitize any user-supplied HTML with `sanitizeHtml` from `@/lib/sanitize-html`.
6. Throw typed errors from `@/lib/api-errors` and wrap in `handleAPIError`.
7. Log via `lib/logger.ts`, not `console.log`.
8. Update CSP in `middleware.ts` if calling a new external host.
9. Add tests under `__tests__/api/<feature>.test.ts` — use `__tests__/api/mocks.ts` factories; mock Prisma and NextAuth.
10. Pre-commit: `npx tsc --noEmit && npm run lint && npm run test:api` (CI bypasses both lint and TS).
