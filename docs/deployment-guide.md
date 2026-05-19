---
doc_type: deployment-guide
project: clubedaweb
generated: 2026-05-14
---

# Deployment Guide — clubedaweb

> No CI/CD pipeline files were found (no `.github/workflows/`, `.gitlab-ci.yml`, Jenkinsfile, etc.). Production deploy is **`git pull` on the host**, as documented in commit `e523e3d1` ("chore: preparar repo pra deploy via git pull").

## Topology

```
[ Internet ] → [ Reverse proxy / TLS terminator ] → [ Node 20 host running `next start` ] → [ PostgreSQL 15 ]
                                                                 │
                                                                 ├── AWS S3 (uploads)
                                                                 ├── Evolution API (WhatsApp)
                                                                 ├── OpenAI API
                                                                 ├── Google APIs (Search Console, GA4)
                                                                 ├── Bing Webmaster API
                                                                 └── Social platforms (FB / IG / LinkedIn / Twitter)
```

## Dev/CI vs Prod

| Concern              | Local / Dev                                                | Prod                                                            |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Runtime              | `next dev` (or Docker `yarn dev`)                          | `next start` after `npm run build`                              |
| DB                   | Local Postgres 15 (docker-compose)                         | Managed/self-hosted Postgres 15                                 |
| Schema apply         | `npx prisma db push` (data-loss accepted)                  | `npx prisma db push` — **plan migrations before destructive change** |
| Source map exposure  | Default                                                    | OFF — `productionBrowserSourceMaps: false`                      |
| Chunk filenames      | Default                                                    | Custom: `static/chunks/[name]-[contenthash:8].js` (CDN cache busting) |
| TS/Lint              | Local gate (CI disabled)                                   | Same — no gate at build                                          |

## Docker — Local Dev

`docker-compose.yml` brings up:
- **`db`** — `postgres:15`, user `postgres`, password `postgres`, db `clubedaweb`, port `5432`, volume `pgdata`.
- **`app`** — built from `Dockerfile`, host port `3001` → container `3000`. Bind-mounts `app/`, `components/`, `hooks/`, `lib/`, `prisma/`, `public/`, `scripts/`, `types/`, plus `middleware.ts`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json` for hot reload. Preserves `node_modules` in-container.

Startup command:
```bash
yarn prisma migrate deploy 2>/dev/null || yarn prisma db push --accept-data-loss
yarn dev
```

### Dockerfile (Ubuntu 22.04)
- Base: `ubuntu:22.04`
- TZ: `America/Sao_Paulo`
- Installs: Node 20.x (via nodesource), Yarn classic 1.22.22, build tools, openssl
- WORKDIR: `/home/ubuntu/m3solutions_site/nextjs_space` — **mirrors a legacy Abacus path** because `prisma/schema.prisma` has a hardcoded `output` matching this directory.
  > **Do not** rename this path or move the schema without simultaneously updating the Dockerfile and `prisma/schema.prisma`.
- Installs deps via `yarn install --network-timeout 600000 --ignore-engines` (the `yarn.lock` in the repo is a broken symlink from the Abacus origin; it's removed and regenerated inside the container).
- Runs `yarn prisma generate` after copy.
- CMD: `yarn dev` (dev image; for prod build a separate stage and run `yarn build && yarn start`).

## Production Deploy — `git pull` Model

The recorded process (one server, single branch):

```bash
ssh <prod-host>
cd <app-dir>
git pull origin main
npm install --legacy-peer-deps           # or yarn, matching the deploy script
npx prisma generate
npx prisma db push                        # ⚠️ confirm whether destructive before running
npm run build
# restart the process manager (pm2 / systemd) — verify the actual unit name on the server
```

Because `next.config.js` sets `ignoreDuringBuilds`/`ignoreBuildErrors`, the build succeeds even with TS/lint errors. **Run `npx tsc --noEmit && npm run lint` locally before pushing to `main`.**

### Pull-Request / PR Notes
- No `.github/` or PR template detected.
- When opening a PR, include: what changed, why, manual test evidence (since CI is permissive), and any **migration commands** the deployer must run on the host after `git pull`.

## Environment Variables (Prod)

Minimum required (see `development-guide.md` for the full list):
- `DATABASE_URL` — Postgres URL (Prisma will append `connection_limit=5` if absent)
- `NEXTAUTH_URL` — public origin
- `NEXTAUTH_SECRET` — strong random
- AWS keys + bucket
- `OPENAI_API_KEY`
- Evolution API URL + key
- SMTP credentials
- Cron shared-secret(s) — verify the name expected by each `app/api/cron/*` handler

> **No secret manager wiring detected**. Secrets live in the server-side `.env`. Rotate manually.

## Build & Asset Pipeline Notes

- `package.json` `build` runs `prisma generate && next build`. **Never** skip `prisma generate` in deploys.
- `next.config.js` customizes webpack chunk filenames specifically for CDN cache busting:
  ```js
  config.output.filename = 'static/chunks/[name]-[contenthash:8].js';
  config.output.chunkFilename = 'static/chunks/[contenthash:16].js';
  ```
  Changing these **invalidates cached assets** on every deployed client. Don't flip casually.
- `productionBrowserSourceMaps: false` — keeps prod bundles small and hides source from prod consumers. Don't enable casually.
- `experimental.outputFileTracingRoot` points to the parent directory (`../`) — required for the Abacus-style filesystem layout. Leave it unless you also adjust the deploy filesystem.

## Cron Triggers

Endpoints in `app/api/cron/*` expect to be triggered by an **external scheduler** with a shared-secret header:

- `cron/enviar-agendamentos`
- `cron/limpar-materias-antigas`
- `cron/publicar-agendados`
- `cron/renovar-tokens`
- `cron/sincronizar-cronicas`

Configure these on the host (systemd timer, cron, or platform scheduler). Read each handler to discover the exact header name and the recommended frequency.

## Security & Operational Concerns

- **CSP** is set in `middleware.ts`. Adding a new external script/image/connect source requires editing the CSP — otherwise the browser blocks it at runtime.
- **IP blocking is per-endpoint** via `lib/security` (Edge middleware cannot await DB).
- Rate-limit conventions (codified):
  - list endpoints: 100/min
  - mutations: 30/min
  - AI text: 20/min
  - AI image: 5/min
- All gestor endpoints **must** rate-limit + authenticate + Zod-validate + use `handleAPIError`. Audit any new route against [api-contracts.md → Checklist](./api-contracts.md).
- Passwords are bcrypt-hashed. Never store plaintext, never log password fields.
- All user-supplied HTML must pass `sanitizeHtml` before storage or render.

## Monitoring / Observability

- Application logs: `lib/logger.ts` (use everywhere instead of `console.log`).
- Custom analytics: `app/api/analytics/pageview` writes to `PageView` table; admin dashboards in `app/gestor/relatorios/`.
- External: Google Analytics + Search Console (linked via `gestor/seo/google/*`).
- No APM (e.g. Datadog, Sentry) integration was detected. Consider adding one before scaling beyond a single host.

## Rollback Strategy (gaps to document with ops)

Because deploys are `git pull`-based with `db push` for schema:
1. `git revert` the offending commit on `main`, push, and re-pull on the host.
2. Reapply schema with `npx prisma db push`.
3. ⚠️ **Schema rollbacks are NOT automated** — if the offending change dropped/renamed columns, you must restore from backup. Treat any destructive schema change as a major release and back up first.

## Suggested Next Improvements

- [ ] Adopt `prisma migrate` (with a committed `prisma/migrations/` folder) before the next destructive change.
- [ ] Add CI (GitHub Actions) running `tsc --noEmit`, `lint`, and `test` on PRs — even if non-blocking initially.
- [ ] Add a Sentry/Datadog integration for prod error tracking.
- [ ] Add `.env.example` to the repo and a boot-time env validator.
- [ ] Document the exact prod restart command (pm2 / systemd unit name) in this guide.
