---
doc_type: handoff
project: clubedaweb
feature: wizard-chat (bot conversacional + Stitch + OpenAI)
generated: 2026-05-16
audience: AI agent (Cursor, Claude Code, etc.) continuing this work
---

# Handoff — Wizard Conversacional + Stitch + Geração de Tema

> **Objetivo do feature:** substituir o formulário em 6 steps do `/gestor/wizard` por um chat onde o cliente conta sobre o negócio, e a IA gera (a) um tema visual via Google Stitch (Gemini), (b) conteúdo de página via OpenAI. Resultado: link de preview público em <1.5 min, e botão "publicar" que aplica ao site real. Demo planejada para terça 2026-05-19 com Marcio.

## ⚡ Quick Start (rodar localmente — ordem importa)

```bash
# 1. DB (Docker)
docker-compose up -d db
until docker exec clubedaweb-db-1 pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done

# 2. Aplica schema (precisa, no host)
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/clubedaweb?schema=public' \
  npx prisma db push --skip-generate
npx prisma generate

# 3. Next dev — no HOST (não no Docker, é 10× mais rápido no Mac M1)
npm run dev
# Disponível em http://localhost:3000 ou http://localhost:3001 (depende se 3000 está livre)
```

`.env` necessário (já existe no projeto):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clubedaweb?schema=public  # localhost, NÃO @db
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=<algo>
OPENAI_API_KEY=sk-...          # gera o conteúdo do site
STITCH_API_KEY=AQ.<...>        # gera o tema visual via Gemini
# Opcional:
STITCH_PROJECT_ID=<id-de-projeto-Stitch>  # se omitido, cria projeto novo a cada conversa
WIZARD_LLM_MODEL=gpt-4o-mini   # default
```

> ⚠️ A `STITCH_API_KEY` atual está no `.env` mas **foi colada no chat com o Claude** durante o desenvolvimento. **Rotacionar antes de produção** (Stitch UI → Profile → Stitch settings → API key).

## 🎯 O que está pronto

| Bloco | Estado |
|---|---|
| Schema `WizardSession` + `WizardMessage` em Prisma | ✅ aplicado no DB |
| Máquina de estados pura (`lib/wizard/state-machine.ts`) | ✅ 12 testes |
| Cliente Stitch oficial (`@google/stitch-sdk@0.3.5`) com fallback se chave ausente | ✅ |
| Extractor de tokens de HTML do Stitch → BrandTokens (`lib/stitch/theme-extractor.ts`) | ✅ 7 testes |
| Gerador de conteúdo (hero/features/cta) via OpenAI (`lib/wizard/content-generator.ts`) | ✅ 11 testes |
| Orquestrador (chat → state machine → Stitch + OpenAI em paralelo → preview token) | ✅ |
| Endpoint `/api/gestor/wizard/chat` (GET/POST/DELETE) | ✅ auth gate, Zod |
| UI de chat (`/gestor/wizard/chat`) com quick replies e progress bar | ✅ |
| Preview público assinado `/preview/[token]` renderizando **HTML real do Stitch em iframe sandboxed** | ✅ |
| CSP relaxado só em `/preview/*` (Tailwind CDN, Google Fonts) | ✅ |
| Layout `/preview/layout.tsx` escondendo site-chrome do clubedaweb | ✅ |
| Botão "Modo conversacional" no wizard antigo (`wizard-shell.tsx`) | ✅ |
| Script de dry-run (`scripts/wizard-dry-run.ts`) — 3 personas, sem UI | ✅ |
| Script Playwright (`scripts/preview-visual-test.ts`) — smoke visual | ✅ |

**Testes totais:** 189/189 verdes. `tsc --noEmit` limpo no código novo.

## 🚧 O que ainda falta (priorizado para demo terça)

1. **🔴 Publicar = colocar o HTML do Stitch como home pública**
   Hoje o orquestrador só atualiza `BrandTokens` global + `SiteConfig.company_name/tagline` — mas a home pública (`/`) continua sendo o template m3-base/bd-redesign do clubedaweb. Pra "publicar" valer como cliente espera, opções:
   - Persistir o HTML do Stitch em uma rota `/site/[slug]` ou no domínio raiz quando "ativado"
   - Rota `app/(public-stitch)/page.tsx` que lê uma `PublishedSite` row e renderiza igual ao preview (sem banner)
   - Ver `lib/wizard/orchestrator.ts` função `applyPublished` — é onde alterar
2. **🟡 Indicador de progresso durante os ~75s do Stitch** — bot fica "digitando" silenciosamente; cliente pode achar que travou. Sugestão: stream updates via SSE ou poll do estado da `WizardSession`.
3. **🟡 Variações** — Stitch SDK tem `screen.variants(prompt, options)` que devolve 3 variantes. Botão "ver outra opção" no chat. Aumenta wow-factor da demo.
4. **🟢 Adapter WhatsApp** — o core já é canal-agnostic; falta endpoint `/api/wizard/whatsapp-webhook` que recebe via Evolution e roteia pro `advance()` do orchestrator. Fase 2, fora do MVP de terça.
5. **🟢 Variável de ambiente `EVOLUTION_INSTANCE_FOR_WIZARD`** — quando #4 acontecer, qual instância Evolution o bot deve usar.
6. **🟢 Header/footer dentro do iframe** — Stitch já gera header/nav próprio. Mas se sobrar tempo, pode-se injetar logo/contato do cliente via post-processing do HTML.
7. **🟢 Reescolha de template** — hoje sempre usa `m3-base` como fallback. Stitch HTML não precisa de template (é o site inteiro). Mas se Stitch falhar, fallback usa m3-base. Pode-se permitir selecionar `bitdefender` etc.
8. **🟢 Rate limit** no endpoint de chat — hoje não tem. Cada `POST` gera escrita no DB + 1 OpenAI call. Aplicar `lib/security/rate-limit-service`.

## 🏗️ Arquitetura

```
┌───────────────────────────────────────────────────────────────┐
│  Adapters de canal (pluggable)                                │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │ /gestor/wizard/  │    │  WhatsApp via    │                 │
│  │ chat (UI)        │    │  Evolution (F2)  │                 │
│  └────────┬─────────┘    └────────┬─────────┘                 │
│           │                       │                            │
│           └───────────┬───────────┘                            │
│                       ▼                                        │
│   ┌─────────────────────────────────────────────────┐         │
│   │  app/api/gestor/wizard/chat/route.ts            │         │
│   │  POST(message, sessionId?) → orchestrator       │         │
│   └─────────────────────┬───────────────────────────┘         │
│                         ▼                                      │
│   ┌─────────────────────────────────────────────────┐         │
│   │  lib/wizard/orchestrator.ts                     │         │
│   │   1. findOrCreateSession()                      │         │
│   │   2. appendMessage(user)                        │         │
│   │   3. transition() — pure state machine          │         │
│   │   4. if generate_theme:                         │         │
│   │      Promise.all([                              │         │
│   │        generateTheme(brief),                    │         │
│   │        generateContent(answers)                 │         │
│   │      ])                                         │         │
│   │   5. updateSnapshot(...) + previewToken         │         │
│   │   6. appendMessage(assistant)                   │         │
│   └──────┬───────────────────────────┬──────────────┘         │
│          ▼                           ▼                         │
│   ┌─────────────────────┐   ┌─────────────────────────┐       │
│   │ lib/stitch/         │   │ lib/wizard/             │       │
│   │  client.ts          │   │  content-generator.ts   │       │
│   │  → @google/stitch-  │   │  → OpenAI chat.compl.   │       │
│   │     sdk             │   │     (JSON mode)         │       │
│   │  theme-extractor.ts │   │                         │       │
│   │  → BrandTokens      │   │  fallback se sem key    │       │
│   └─────────────────────┘   └─────────────────────────┘       │
│                                                                │
│   ┌─────────────────────────────────────────────────┐         │
│   │  WizardSession (Postgres)                       │         │
│   │   - data (Json) — respostas do cliente          │         │
│   │   - brief (string) — prompt enviado pro Stitch  │         │
│   │   - stitchHtmlCached (string) — HTML cru        │         │
│   │   - extractedTokens (Json) — paleta extraída    │         │
│   │   - generatedContent (Json) — hero/features/cta │         │
│   │   - previewToken (unique)                       │         │
│   │   - previewExpiresAt (24h TTL)                  │         │
│   └─────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────┘

         Renderização do preview público:
         /preview/[token] → busca session → iframe srcDoc com stitchHtmlCached
                                            (CSP relaxado, sandbox isolado)
```

### Princípios

- **Channel-agnostic core**: o `orchestrator.advance()` aceita qualquer canal via parâmetro. Pra plugar WhatsApp, criar adapter que chama essa função.
- **Side effects no orchestrator, não no state-machine**: a state machine é pura/testável. O orchestrator é quem chama Stitch/OpenAI/DB.
- **HTML do Stitch é a fonte da verdade visual**: o template m3-base só é usado como fallback se Stitch falhar.
- **Fail-soft em geração**: sem `STITCH_API_KEY` ou `OPENAI_API_KEY`, cada lib retorna fallback razoável (cores deduzidas de keywords PT-BR, textos genéricos por tom). Bot continua funcionando, só com qualidade reduzida.

## 📁 Arquivos novos/modificados

### Novos (lib/)

| Path | Propósito |
|---|---|
| `lib/wizard/types.ts` | Tipos: `WizardState`, `WizardSnapshot`, `WizardAnswers`, `ExtractedTokens`, `TransitionOutcome` |
| `lib/wizard/prompts.ts` | `BOT_GREETING`, `DISCOVERY_QUESTIONS`, `buildStitchPrompt(answers)` |
| `lib/wizard/state-machine.ts` | `initialSnapshot()`, `transition(input)`, `onThemeGenerated()`, `onThemeGenerationFailed()`, `onPublished()` |
| `lib/wizard/repository.ts` | Acesso ao Prisma: `findOrCreateSession`, `appendMessage`, `updateSnapshot`, `findByPreviewToken`, `resetSession`, `newPreviewToken` |
| `lib/wizard/orchestrator.ts` | `advance({ userId, sessionId, message, channel, origin })`, `startSession`, `restartSession`, `applyPublished` |
| `lib/wizard/content-generator.ts` | `generateContent(answers)` via OpenAI/Abacus + `fallbackContent(answers)` |
| `lib/stitch/client.ts` | `generateTheme(prompt, opts)` usando `stitch` singleton do SDK |
| `lib/stitch/theme-extractor.ts` | `extractTokensFromHtml(html)`, `fallbackTokens(prompt)` (PT-BR aware) |

### Novos (app/)

| Path | Propósito |
|---|---|
| `app/api/gestor/wizard/chat/route.ts` | Endpoint POST/GET/DELETE, `maxDuration = 180`s |
| `app/gestor/wizard/chat/page.tsx` | Server component, auth gate |
| `app/gestor/wizard/chat/layout.tsx` | Bypassa sidebar do gestor (fullscreen) |
| `components/gestor/wizard/chat-shell.tsx` | Client UI com bubbles, quick replies, progress bar, restart |
| `app/preview/[token]/page.tsx` | Preview público que renderiza HTML do Stitch em iframe sandboxed (com fallback m3-base) |
| `app/preview/layout.tsx` | CSS global escondendo site-chrome do clubedaweb (cookie banner, WhatsApp button) |

### Modificados

| Path | O que mudou |
|---|---|
| `prisma/schema.prisma` | + model `WizardSession`, model `WizardMessage`, relação reversa em `User` |
| `middleware.ts` | CSP relaxado em `/preview/*` (Tailwind CDN, Google Fonts) |
| `components/gestor/wizard/wizard-shell.tsx` | Botão "Modo conversacional · NOVO" no header (link pra `/gestor/wizard/chat`) |

### Testes (`__tests__/lib/`)

| Path | Cobertura |
|---|---|
| `wizard-state-machine.test.ts` | 12 testes: discovery flow, confirm, preview transitions, terminal states |
| `wizard-theme-extractor.test.ts` | 7 testes: Tailwind extraction, hex literals, PT-BR keyword fallback, radius |
| `wizard-content-generator.test.ts` | 11 testes: OpenAI happy path, markdown fence stripping, malformed JSON, HTTP error, fallback |

### Scripts (`scripts/`)

| Path | Uso |
|---|---|
| `scripts/wizard-dry-run.ts` | `npx tsx scripts/wizard-dry-run.ts [persona] [--persist]` — alimenta a máquina de estados com respostas hard-coded de 3 personas e mostra output. `--persist` grava `WizardSession` e imprime URL do preview. |
| `scripts/preview-visual-test.ts` | `npx tsx scripts/preview-visual-test.ts` — Playwright headless abre os 3 previews, valida iframe + banner, captura screenshots em `/tmp/preview-<key>.png` |

## 🧠 Decisões críticas e por quê

### 1. HTML do Stitch direto em iframe (não converter pra JSX)
**Decidido em 2026-05-16 depois de feedback "ta tudo igual ao tema atual".**

A primeira versão extraía só `BrandTokens` (cores, fonte, radius) do HTML do Stitch e renderizava no template `m3-base` fixo. Resultado: todos os 3 sites pareciam iguais, só com cores trocadas. O cliente não percebia o valor do Stitch.

**Solução atual:** o preview renderiza o HTML cru do Stitch em `<iframe srcDoc={stitchHtml} sandbox="allow-scripts allow-popups allow-forms" />`. O Tailwind CDN + Google Fonts + Material Symbols carregam dentro do iframe; CSS isolado do clubedaweb; layout, tipografia, sections são exatamente o que o Gemini desenhou.

Trade-offs aceitos:
- Tailwind CDN é runtime — compila classes no browser (mais lento que SSR)
- Sandbox impede comunicação iframe ↔ parent (não conseguimos injetar logo do cliente no header gerado, por exemplo)
- Pra "publicar" valer (servir como home pública), precisa decidir como hospedar esse HTML (próximo passo #1)

### 2. CSP relaxado só em `/preview/*`
O middleware tem CSP estrito que bloqueia `cdn.tailwindcss.com`. Sem fix, o iframe carrega em branco. Solução: condicional no middleware — se `pathname.startsWith("/preview/")`, usa CSP permissivo (`script-src https:` etc.). Resto do site permanece com CSP original (Abacus + Google Analytics whitelist).

### 3. `app/preview/layout.tsx` esconde site-chrome via CSS
RootLayout do Next App Router envolve **toda** rota com `<SiteHeader/>{children}<SiteFooter/>` + cookie consent + WhatsApp button. Não dá pra remover via layout aninhado (sub-layouts compõem, não substituem). Solução: o `preview/layout.tsx` injeta CSS que esconde apenas o cookie banner e o WhatsApp button. Header/footer ficam atrás do wrapper z-[100000].

### 4. Geração de Stitch e OpenAI em paralelo
`Promise.all([generateTheme, generateContent])`. Stitch leva ~75s; OpenAI leva ~3-5s. Em paralelo o tempo total = max(75, 5) ≈ 75s. Em série seria ~80s. Ganho pequeno mas correto.

### 5. Fallback de cor por keyword PT-BR
Se `STITCH_API_KEY` falta ou Stitch falha, `fallbackTokens(prompt)` em `lib/stitch/theme-extractor.ts` extrai cor primária inspecionando o brief por palavras-chave: marrom, terracota, navy, dourado, sálvia, etc. Cobre demo se Stitch cair sem precisar pivot total.

### 6. Single-tenant (não multi-tenant)
Decisão do Douglas: "vou triplicar essa plataforma" = 3 deploys independentes. Cada plataforma é single-tenant. `WizardSession.userId` é FK opcional ao `User` admin que iniciou, não a um tenant. `applyPublished` atualiza `BrandTokens` global (single-row pattern) e `SiteConfig` (key/value).

### 7. Next dev no host (Mac M1), Postgres em Docker
Diagnosticado em 2026-05-16: rodar Next no Docker em Mac M1 é 10× mais lento devido a bind mounts VirtioFS. Solução: Postgres fica no Docker (leve, sem hot reload), Next roda nativo no host (`npm run dev`). Tempo de cold compile caiu de 50s pra 2-7s.

## 🪤 Gotchas (coisas que vão te morder se você não souber)

| Sintoma | Causa | Fix |
|---|---|---|
| `prisma.wizardSession is undefined` | Prisma Client desatualizado | `npx prisma generate` (no host) E `docker exec clubedaweb-app-1 yarn prisma generate` se estiver usando container |
| `Module not found: @google/stitch-sdk` em container | bind mount preserva `node_modules` do container; `npm install` no host não chega lá | `docker exec clubedaweb-app-1 yarn add @google/stitch-sdk` |
| Preview branco, console: "Refused to load script cdn.tailwindcss.com" | CSP do middleware bloqueia iframe | Já corrigido — confirmar `middleware.ts` tem branch `if (isPreviewRoute)` |
| Preview mostra site-chrome do clubedaweb por cima | Cookie consent tem `z-[9999]`, mesmo do wrapper antigo | wrapper agora é `z-[100000]`; `preview/layout.tsx` esconde cookie+whatsapp |
| Stitch leva ~75s | Latência real do Gemini gerando UI | Já avisado na mensagem do bot ("1-2 minutos"); `maxDuration = 180` no route handler |
| `DATABASE_URL` `@db:5432` falha do host | `db` só resolve dentro da rede docker-compose | Use `@localhost:5432` no `.env` quando rodar Next no host. Backup do original em `.env.docker-backup`. |
| Build OOM no Mac M1 | Docker Desktop padrão é 1 CPU / 4GB | Settings → Resources → CPUs ≥ 6, Memory ≥ 8GB |
| Iframe não carrega fontes | `font-src` do CSP | CSP de `/preview/*` libera `font-src 'self' data: https:` |
| `Encountered two children with the same key /p/bitdefender-business-security` | Bug pré-existente em `components/bd-redesign/footer.tsx:116` | Não relacionado ao wizard, ignorar (ou consertar separadamente) |

## 🧪 Como testar (3 níveis)

### Nível 1 — Unit tests (rápido)
```bash
npm test
# 189 testes esperados
```

### Nível 2 — Dry-run (sem UI, com IA real)
```bash
# 1 persona, sem persistir
npx tsx scripts/wizard-dry-run.ts padaria

# As 3 personas, persistindo no DB, devolve URLs:
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/clubedaweb?schema=public' \
  NEXTAUTH_URL='http://localhost:3001' \
  npx tsx scripts/wizard-dry-run.ts --persist
```
Personas disponíveis (em `scripts/wizard-dry-run.ts`): `padaria`, `advocacia`, `moda`.

### Nível 3 — Visual com Playwright (full stack)
Pressupõe Next dev rodando em `:3001` e algumas WizardSessions já existentes (gere com `--persist`).
```bash
# Atualize os tokens em scripts/preview-visual-test.ts (lista TARGETS)
npx tsx scripts/preview-visual-test.ts
# Screenshots saem em /tmp/preview-<key>.png
```

### Nível 4 — End-to-end no browser
1. `npm run dev` (host) + `docker-compose up -d db`
2. Login em http://localhost:3001/gestor/login
3. Acessar http://localhost:3001/gestor/wizard/chat
4. Conversar: "vamos" → 5 respostas → "pode gerar" → aguardar ~75s → clicar no link de preview → "publicar"

## 🎬 Pra demo terça (2026-05-19)

Estado atual:
- ✅ Bot conversacional roda no chat web
- ✅ Stitch + OpenAI funcionando, gera site único por brief
- ✅ Preview público em iframe sandboxed
- ⚠️ "Publicar" atualiza BrandTokens global mas a home pública (`/`) ainda mostra o template antigo do clubedaweb — **decidir fluxo de publicação antes da demo** (item #1 do "Falta")

Sugestão pra apresentação:
1. Mostra wizard antigo no `/gestor/wizard` — botão "Modo conversacional · NOVO"
2. Clica → entra no chat
3. Conversa 5 respostas (Marcio escolhe um negócio fictício)
4. **Avisa que vai demorar 1-2 min** (Stitch leva 75s, Marcio não pode achar que travou)
5. Recebe link → abre em nova aba → tem o site visualmente único
6. Volta no chat → "publicar" → mensagem de confirmação
7. (Se tiver implementado o item #1) Abre a home pública → mostra ela com o tema novo

Backup: se Stitch cair durante a demo, o fallback ainda devolve preview com cor extraída do brief + OpenAI ainda funciona. Não dá tela branca.

## 🔑 Operação

### Subir do zero (Mac M1, máquina nova)
```bash
docker-compose up -d db
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/clubedaweb?schema=public' \
  npx prisma db push --skip-generate
npx prisma generate
npm install --legacy-peer-deps
npx playwright install chromium   # opcional, só pros visual tests
npm run dev
```

### Parar
```bash
# Mata Next no host:
ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | xargs kill
# ou: kill <PID que aparece no output do `npm run dev`>

# Para DB:
docker stop clubedaweb-db-1
```

### Resetar sessões de teste no DB
```bash
docker exec clubedaweb-db-1 psql -U postgres -d clubedaweb \
  -c 'DELETE FROM "WizardMessage"; DELETE FROM "WizardSession";'
```

### Inspecionar uma sessão
```bash
docker exec clubedaweb-db-1 psql -U postgres -d clubedaweb \
  -c 'SELECT id, state, "previewToken", "stitchProjectId", LENGTH("stitchHtmlCached") AS html_bytes FROM "WizardSession" ORDER BY "createdAt" DESC LIMIT 5;'
```

### Rotacionar STITCH_API_KEY (depois da demo)
1. Stitch UI (`https://stitch.withgoogle.com/`) → Profile → Stitch settings → API key → Regenerate
2. `STITCH_API_KEY=<nova>` no `.env`
3. `kill $(ps aux | grep "next dev" | grep -v grep | awk '{print $2}')` + `npm run dev`
4. **Nunca cole a chave nova num chat/log/PR.**

## 📚 Pontos de extensão (onde mexer para…)

| Quero… | Mexer em… |
|---|---|
| Mudar as 5 perguntas do bot | `lib/wizard/prompts.ts` → `DISCOVERY_QUESTIONS` |
| Tunar tom/instruções do conteúdo | `lib/wizard/content-generator.ts` → `SYSTEM_PROMPT` |
| Tunar prompt enviado pro Stitch | `lib/wizard/prompts.ts` → `buildStitchPrompt` |
| Adicionar novo estado na conversa | `lib/wizard/types.ts` (`WIZARD_STATES`) + `lib/wizard/state-machine.ts` (`transition` switch) |
| Mudar template fallback (quando Stitch falha) | `app/preview/[token]/page.tsx` → branch `if (!hasStitchHtml)` |
| Plugar WhatsApp (Evolution) | criar `app/api/wizard/whatsapp-webhook/route.ts` chamando `orchestrator.advance(...)` com `channel: "whatsapp"` |
| Mudar TTL de preview | `lib/wizard/orchestrator.ts` → `PREVIEW_TTL_MS` |
| Implementar "publicar = home pública com HTML do Stitch" | `lib/wizard/orchestrator.ts` → `applyPublished` + criar rota pública nova |
| Mudar modelo OpenAI | env `WIZARD_LLM_MODEL` (default `gpt-4o-mini`) |
| Mudar modelo Stitch | `lib/stitch/client.ts` → `opts?.modelId ?? "GEMINI_3_FLASH"` |

## 🧬 Convenções do projeto (consulte sempre antes de mexer)

- `_bmad-output/project-context.md` — regras canônicas (imports `@/`, Prisma só via `lib/db`, Zod em `lib/validation-schemas.ts`, etc.)
- `docs/index.md` — índice da documentação técnica do projeto
- `docs/architecture.md`, `docs/data-models.md`, `docs/api-contracts.md` — documentação base
- TS strict mode mas `noImplicitAny: false`; `next.config.js` ignora TS/lint no build — **rodar `npx tsc --noEmit && npm run lint` localmente** antes de PR

## 🤝 Recap das decisões com o usuário (Douglas)

| Data | Decisão |
|---|---|
| 2026-05-15 | Provider visual: Google Stitch API (oficial), com fallback Gemini/OpenAI documentado |
| 2026-05-15 | Audiência: clientes da agência Davila, autenticados antes do bot |
| 2026-05-15 | Output: tema completo do Stitch ("igual ao sistema atual" — mas em MVP usa BrandTokens; **pivotou em 2026-05-16 pra renderizar HTML cru do Stitch em iframe**) |
| 2026-05-15 | Canal MVP: chat web. WhatsApp como fase 2. |
| 2026-05-15 | Acesso final: subdomínio do clubedaweb (não custom domain no MVP) |
| 2026-05-15 | Deploy: única VPS, não triplicar; "sistema já funciona, não mexer" |
| 2026-05-16 | Mover Next dev pra host (Mac M1), Postgres em Docker |

---

**Última atualização:** 2026-05-16 por Claude Code (handoff pra Cursor).
**Próximo passo natural:** implementar `applyPublished` que serve o HTML do Stitch como home pública (item #1 da seção "Falta").
