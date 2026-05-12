# Prompt Google Stitch — Template Bitdefender (M3Solutions)

Cole este prompt no Google Stitch. O output deve substituir as seções do template em `lib/templates/bitdefender/sections/*.tsx` mantendo as **mesmas props**.

---

## Briefing

Crie um **template de página de produto enterprise** para a Bitdefender GravityZone, distribuído por uma revenda M3Solutions. Identidade dual: **Bitdefender é o produto (vermelho dominante)**, M3Solutions é a revenda (header/footer/CTAs com toque azul M3 como acento).

**Público-alvo:** decisores de TI (CTO, CSO, gerentes de infra) de PMEs e empresas médias no Brasil.

## Identidade visual obrigatória

- **Cor primária:** vermelho Bitdefender — `#CC0000` (gradient hero), variantes `#8B0000` (escuro), `#FEE2E2` (badge/superfície clara)
- **Cor de acento:** azul M3 `#3B82F6` (apenas em CTAs secundários e badges discretos)
- **Neutros:** cinzas `#1F2937` (texto), `#6B7280` (texto secundário), `#F9FAFB` (superfície), `#FFFFFF` (fundo)
- **Tipografia:** sans-serif corporativa — sugiro **Inter** ou **Manrope** (escolha). Headings com peso 700/800, body 400/500.
- **Logo no header:** placeholder `<Logo />` — deve ser slot pra `logo-m3solutions.svg`. NÃO incluir logo Bitdefender no header (vai como ícone/título no hero).
- **Border radius:** `12px` em cards, `8px` em botões, `9999px` (pill) em badges.
- **Sombras:** sutis, modernas — `shadow-lg` em hover de cards.

## Estilo

- **Corporativo, limpo, alta legibilidade.** Nada de gradientes saturados além do hero.
- **Mobile-first**, 100% responsivo (sm, md, lg, xl breakpoints Tailwind).
- **Sem JS além do mínimo.** Animações sutis com Tailwind transitions (não GSAP, não Framer Motion).
- **Acessibilidade:** contraste WCAG AA, headings hierárquicos, alt em imagens.

## Restrições técnicas (CRÍTICAS — não pular)

1. **Use só Tailwind CSS.** Nada de CSS custom, nada de styled-components.
2. **Use estes tokens exatos** (não cores literais — eles são CSS vars que mudam por marca):
   - Vermelho Bitdefender: usar literais `red-600`, `red-700`, `red-900` (esse é específico do produto)
   - Cor M3 (logo, CTAs secundários): usar `bg-primary`, `text-primary` — NUNCA `blue-600` literal
   - Texto: `text-foreground`, `text-foreground/70`, `text-foreground/85`
   - Fundos: `bg-background`, `bg-muted`, `bg-muted/40`
   - Borda: `border-border`
   - Heading font: `font-heading`
3. **Slots de CMS.** Cada seção recebe um objeto `data` com props específicas (ver lista abaixo). Não invente texto fixo — use placeholders `{props.X}`.
4. **Componentes React.** Output em TypeScript (.tsx), exportando funções `export function NomeSection({ data }: { data: Record<string, any> }) { ... }`.
5. **Sem dependências externas além de:** `next/link`, `lucide-react` (ícones).

## Seções a gerar (1 arquivo .tsx por seção)

### 1. `BitdefenderHero` — `sections/hero.tsx`
**Props:**
- `badge` (string) — tag superior, ex: "BITDEFENDER GRAVITYZONE"
- `icon` (string) — nome de ícone Lucide (Shield, ShieldCheck, Lock)
- `title` (string)
- `subtitle` (string)
- `bullets` (string[]) — lista de 3-5 bullets de valor
- `ctaText`, `ctaLink` (string)
- `secondaryCtaText`, `secondaryCtaLink` (string)

**Layout:** Background gradient vermelho (`from-red-700 via-red-800 to-red-900`), texto branco. Lado esquerdo: badge+título+subtítulo+bullets+CTAs. Lado direito (lg+): visual hero com ícone gigante semi-transparente em card de glass-morphism `bg-white/10 backdrop-blur-md`.

### 2. `BitdefenderStatsStrip` — `sections/stats-strip.tsx`
**Props:** `items: { value, label }[]`

**Layout:** faixa horizontal `bg-gray-900` com 4 colunas. Valores grandes em vermelho (`text-red-500`), labels uppercase em cinza claro.

### 3. `BitdefenderAwards` — `sections/awards.tsx`
**Props:** `title`, `items: { org, description, year }[]`

**Layout:** Grid 4 colunas com cards bordados que fazem highlight vermelho no hover. Ícone Award em vermelho no topo de cada card.

### 4. `BitdefenderFeaturesGrid` — `sections/features-grid.tsx`
**Props:** `title`, `subtitle`, `items: { icon, title, description }[]`

**Layout:** Grid 4 colunas (sm 2, lg 4). Cards com ícone em quadrado vermelho `bg-red-600` que escala no hover. Borda hover muda pra `red-300`. Sutil gradient `from-gray-50 to-white`.

### 5. `BitdefenderUseCases` — `sections/use-cases.tsx`
**Props:** `title`, `items: { icon, title, description, benefits: string[] }[]`

**Layout:** Grid 3 colunas. Cards brancos com ícone em circle `bg-red-100 text-red-600`. Lista de benefits com check vermelho.

### 6. `BitdefenderComparisonTable` — `sections/comparison-table.tsx`
**Props:** `title`, `subtitle`, `columns: string[]`, `rows: { feature, values: boolean[] }[]`, `highlightColumn` (number)

**Layout:** Tabela responsiva (overflow-x-auto). Header da coluna destacada com `bg-red-600 text-white`. Coluna destacada inteira com `bg-red-50`. Checks em vermelho, X em cinza claro. Section id="comparison" para anchor link.

### 7. `BitdefenderFaqs` — `sections/faqs.tsx` (client component, `"use client"`)
**Props:** `title`, `items: { q, a }[]`

**Layout:** Lista vertical de accordions. Borda neutra, ChevronDown vermelho rotaciona ao abrir.

### 8. `BitdefenderCta` — `sections/cta.tsx`
**Props:** `title`, `subtitle`, `buttonText`, `buttonLink`, `phoneText` (opcional)

**Layout:** Background `from-red-700 to-red-900`. CTA primário branco com texto vermelho. CTA secundário (se phone) em glass-morphism com Phone icon.

## Restrições adicionais (para não quebrar a integração CMS)

- **NUNCA** use `useState`/`useEffect` em seções que não precisem (apenas FAQs precisa).
- **Imagens:** use `<img>` simples, não `next/image` (pra ser portável e o `next.config.js` já tem `unoptimized: true`).
- Cada seção é **autocontida** — nunca importa de outra seção do mesmo template.
- Suporte mobile completo: hero deve quebrar em 1 coluna, comparison table deve scrollar horizontal.
- `aria-label` em botões sem texto.

## Output esperado

8 arquivos .tsx, um por seção, prontos pra colar substituindo os atuais em `lib/templates/bitdefender/sections/`. Cada arquivo deve:
- Exportar a função com o nome especificado
- Tipo das props como `{ data: Record<string, any> }`
- Defaults internos quando uma prop opcional faltar

## Como aplicar

1. Cole cada arquivo gerado em `lib/templates/bitdefender/sections/<nome>.tsx`.
2. Não mexa em `manifest.ts` (mapeamento de fields do CMS já está pronto).
3. Não mexa nas DynamicPages criadas — `layoutConfig.sections` já bate com as props.
4. Se uma prop nova for desejada, adicione tanto no Component (TSX) quanto em `manifest.ts` (campo) pra ficar editável no `/gestor/aparencia` futuro.

## Validar após aplicar

```bash
docker compose exec app yarn build  # build deve passar
curl -s http://localhost:3001/p/bitdefender-business-security | head -100
```

URLs ativas (3 produtos):
- `/p/bitdefender-business-security`
- `/p/bitdefender-business-security-premium`
- `/p/bitdefender-business-security-enterprise`

URLs antigas (redirect 301):
- `/bitdefender-gravityzone-business-security`
- `/bitdefender-gravityzone-business-security-premium`
- `/bitdefender-gravityzone-business-security-enterprise`
