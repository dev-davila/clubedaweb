/**
 * Padrão único de blocos do Clube da Web.
 * Todos os temas, layouts, wizard/chat e Google Stitch DEVEM seguir este contrato.
 *
 * Objetivo: funcionar para qualquer segmento (varejo, saúde, TI, advocacia, indústria…)
 * com a mesma estrutura HTML semântica e os mesmos `data-block` para extração/validação.
 */

import { buildDesignLanguageBlock } from "@/lib/stitch/design-language";
import { detectUserColorMode } from "@/lib/wizard/design-themes";
import { copySummaryForPrompt } from "@/lib/stitch/copy-summary";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import { REQUIRED_PAGE_TYPES, SITE_PAGE_ROUTES } from "@/lib/themes/required-pages";
import type { SitePageCopy } from "@/lib/wizard/site-content-types";
import type { WizardAnswers } from "@/lib/wizard/types";

export const STITCH_PROMPT_MAX_CHARS = Number(process.env.STITCH_PROMPT_MAX_CHARS ?? 4500);

// ---------------------------------------------------------------------------
// Blocos canônicos (somente 4 tipos de conteúdo + chrome)
// ---------------------------------------------------------------------------

export const CANONICAL_BLOCK_KEYS = [
  "hero",
  "content",
  "features-grid",
  "cta",
] as const;

export type CanonicalBlockKey = (typeof CANONICAL_BLOCK_KEYS)[number];

export const SITE_CHROME_BLOCK_KEYS = ["header", "footer"] as const;

export type SiteChromeBlockKey = (typeof SITE_CHROME_BLOCK_KEYS)[number];

/** Pacote oficial por página — fonte única para temas, CMS e Stitch. */
export const STANDARD_PAGE_BLOCKS: Record<RequiredPageType, readonly CanonicalBlockKey[]> = {
  home: ["hero", "features-grid", "cta"],
  about: ["hero", "content", "cta"],
  contact: ["hero", "content", "cta"],
  services: ["hero", "features-grid", "cta"],
  blog: ["hero", "content"],
};

/** Tamanho mínimo do HTML gerado (bytes) — gate Fase 0/1. */
export const STITCH_PAGE_MIN_BYTES: Record<RequiredPageType, number> = {
  // Subidos para forçar densidade — site institucional decente tem ~25-30KB/página.
  home: 18_000,
  about: 12_000,
  contact: 9_000,
  services: 20_000,
  blog: 12_000,
};

/**
 * Blueprint rico por página: seções além das âncoras CMS obrigatórias.
 * Stitch tem liberdade criativa desde que inclua os data-block mínimos.
 */
export const STITCH_PAGE_BLUEPRINTS: Record<RequiredPageType, readonly string[]> = {
  home: [
    "**Header:** logo + nome; nav com 5 links (Início, Serviços, Sobre, Blog, Contato); CTA destacado no canto; sticky.",
    "**Hero (data-block=hero, id=top):** badge categoria; H1 forte (text-5xl/6xl); subtítulo 1–2 frases; 2 botões (primário + outline); imagem ilustrativa ou pattern visual.",
    "**Faixa de confiança (logo bar OU stats):** 3–4 números do brief (anos, clientes, NPS, prêmios) — se houver proof points; SE NÃO, omitir.",
    "**Features-grid (id=servicos):** título de seção + ≥3× article[data-block=feature-card] com ícone, título e descrição — usar diferenciais literais do brief.",
    "**Como funciona (steps numerados):** 3-4 etapas em cards horizontais ou grid quando houver howItWorks no brief.",
    "**Sobre resumo:** layout 2 colunas (texto + imagem ou stats) + link para /sobre. Texto puxa de aboutText quando disponível.",
    "**Depoimentos ou prova social (se proofPoints disponível):** 2–3 cards com aspas + autor; SE proofPoints.skip, omitir.",
    "**FAQ resumida (se faq disponível):** 3 perguntas em accordion + link para /servicos. Se sem FAQ, omitir.",
    "**CTA (id=contato):** fundo contrastante (gradiente ou cor primária invertida); H2 + parágrafo curto + botão para contato.",
    "**Footer:** 3–4 colunas (links, serviços listados, contato com email/telefone/WhatsApp/endereço reais) + copyright + selo.",
  ],
  about: [
    "**Header:** mesma nav do site; item Sobre ativo ou destacado.",
    "**Hero:** headline institucional + subtítulo missão.",
    "**Content:** história e valores em 2–4 parágrafos (prose max-w-3xl); timeline ou cards de valores (opcional).",
    "**CTA:** convite para contato ou orçamento.",
    "**Footer:** idêntico às outras páginas.",
  ],
  contact: [
    "**Header:** nav completa; Contato ativo.",
    "**Hero:** título de atendimento + horário ou expectativa de resposta.",
    "**Content:** layout 2 colunas em desktop — texto à esquerda; `<form>` à direita com campos nome, email, mensagem e botão enviar.",
    "**CTA (opcional):** WhatsApp ou telefone se estiver no briefing.",
    "**Footer:** colunas + dados de contato reais do briefing apenas.",
  ],
  services: [
    "**Header:** nav; Serviços ativo.",
    "**Hero:** proposta de valor dos serviços + CTA.",
    "**Features-grid:** ≥3 serviços em cards (feature-card); pode incluir ícone e lista curta de benefícios.",
    "**Processo (opcional):** 3 passos numerados (como funciona).",
    "**CTA:** orçamento ou agendamento.",
    "**Footer:** padrão do site.",
  ],
  blog: [
    "**Header:** nav; Blog ativo.",
    "**Hero:** título da seção de notícias + intro curta.",
    "**Content:** parágrafo introdutório; grid com **≥3** `<article>` placeholder (título, data, resumo, link ler mais).",
    "**Footer:** padrão do site.",
  ],
};

// ---------------------------------------------------------------------------
// Especificação de cada bloco (Stitch + templates + copy IA)
// ---------------------------------------------------------------------------

export interface BlockStandardSpec {
  key: CanonicalBlockKey | SiteChromeBlockKey;
  label: string;
  /** Atributo obrigatório no HTML do Stitch: data-block="hero" */
  dataBlock: string;
  /** id HTML para âncoras de menu (quando aplicável). */
  anchorId?: string;
  /** O que o bloco deve conter (independente de segmento). */
  purpose: string;
  /** Regras de conteúdo para qualquer nicho. */
  contentRules: string[];
  /** Estrutura mínima (descrição para prompt Stitch). */
  htmlStructure: string;
}

export const BLOCK_STANDARD_SPECS: Record<
  CanonicalBlockKey | SiteChromeBlockKey,
  BlockStandardSpec
> = {
  header: {
    key: "header",
    dataBlock: "header",
    label: "Cabeçalho",
    purpose: "Logo, nome da empresa e navegação principal.",
    contentRules: [
      "Logo ou monograma + nome da empresa.",
      "Nav com 3–5 links (Início, Serviços, Sobre, Blog, Contato) — textos adaptados ao nicho.",
      "Um botão de CTA destacado (ex.: Fale conosco).",
      "Sticky opcional; fundo com leve blur ou sólido.",
    ],
    htmlStructure:
      '<header data-block="header">… logo … <nav>…</nav> … <a class="btn-primary">CTA</a></header>',
  },
  footer: {
    key: "footer",
    dataBlock: "footer",
    label: "Rodapé",
    purpose: "Reforço de marca, links rápidos e contato.",
    contentRules: [
      "Nome da empresa + frase curta (tagline).",
      "Colunas: links institucionais, serviços ou produtos, contato.",
      "Copyright com ano atual.",
      "Sem inventar CNPJ/endereço se não estiver no briefing.",
    ],
    htmlStructure:
      '<footer data-block="footer">… grid de colunas … copyright</footer>',
  },
  hero: {
    key: "hero",
    dataBlock: "hero",
    anchorId: "top",
    label: "Hero",
    purpose: "Primeira dobra: quem é a empresa e por que o visitante deve agir.",
    contentRules: [
      "Badge curto em uppercase (categoria do negócio, máx. 28 caracteres).",
      "H1 claro (máx. ~80 caracteres), sem clichês genéricos.",
      "Subtítulo 1–2 frases para o público do briefing.",
      "CTA primário (verbo imperativo) + CTA secundário (outline).",
      "Opcional: imagem/gradiente de fundo coerente com o tom.",
    ],
    htmlStructure:
      '<section data-block="hero" id="top">… badge, h1, subtitle, div.cta-row com 2 links …</section>',
  },
  "features-grid": {
    key: "features-grid",
    dataBlock: "features-grid",
    anchorId: "servicos",
    label: "Grade de diferenciais",
    purpose: "Três pilares de valor (serviços, produtos ou benefícios).",
    contentRules: [
      "Exatamente 3 cards (nunca 2 nem 4 no padrão base).",
      "Cada card: ícone (Lucide em SVG inline ou emoji só se não houver Lucide), título (máx. 36 chars), descrição (máx. 140 chars).",
      "Títulos específicos ao negócio do briefing (padaria → produção artesanal; clínica → atendimento humanizado; TI → suporte 24x7).",
      "Título de seção + subtítulo opcional acima da grade.",
    ],
    htmlStructure:
      '<section data-block="features-grid" id="servicos">… h2, subtitle, grid 3 colunas, 3× article[data-block=feature-card] …</section>',
  },
  content: {
    key: "content",
    dataBlock: "content",
    label: "Conteúdo",
    purpose: "Texto institucional, explicação ou introdução de listagem (blog).",
    contentRules: [
      "H2 de seção + 2–4 parágrafos em linguagem clara.",
      "Sobre: história, missão ou proposta sem números inventados.",
      "Contato: como falar com a empresa + expectativa de retorno.",
      "Blog: introdução da listagem de artigos (posts são dinâmicos depois).",
      "Largura máxima confortável (prose / max-w-3xl).",
    ],
    htmlStructure:
      '<section data-block="content">… h2, div.prose com parágrafos …</section>',
  },
  cta: {
    key: "cta",
    dataBlock: "cta",
    anchorId: "contato",
    label: "Chamada para ação",
    purpose: "Conversão final — contato, orçamento ou visita.",
    contentRules: [
      "H2 direto + 1 parágrafo curto.",
      "Botão principal repetindo o CTA do hero ou variante.",
      "Em contato: pode incluir placeholders de telefone/email sem inventar dados.",
      "Fundo contrastante (cor primária ou surface escura).",
    ],
    htmlStructure:
      '<section data-block="cta" id="contato">… h2, p, a.btn-primary …</section>',
  },
};

/** Ordem dos blocos na landing única gerada pelo Stitch (fase atual: só home). */
export const STITCH_HOME_LANDING_BLOCKS: readonly (CanonicalBlockKey | SiteChromeBlockKey)[] = [
  "header",
  "hero",
  "features-grid",
  "cta",
  "footer",
];

/** Blocos obrigatórios no HTML da home Stitch (sem header/footer opcionais mas recomendados). */
export const STITCH_HOME_REQUIRED_DATA_BLOCKS: readonly string[] = [
  "hero",
  "features-grid",
  "cta",
];

const STITCH_TECHNICAL_RULES = [
  "Use APENAS Tailwind CSS via CDN (<script src=\"https://cdn.tailwindcss.com\"></script> no head).",
  "NÃO use CSS variables customizadas; cores em classes da paleta PADRÃO Tailwind (slate, gray, stone, amber, orange, blue…).",
  "NÃO invente cores inexistentes (beige-*, brown-*, brand-*). Para padaria use stone/amber/orange; para saúde emerald/teal; etc.",
  "Mobile-first, responsivo (sm/md/lg), contraste WCAG AA.",
  "Sem JavaScript. Animações só com transition Tailwind.",
  "HTML5 semântico: header, main, section, footer, h1–h3, p, a, article.",
  "Cada bloco DEVE ter o atributo data-block exatamente como no padrão (ex.: data-block=\"hero\").",
  "Home: ids de âncora hero#top, features-grid#servicos, cta#contato para o menu.",
  "Texto em português do Brasil.",
];

const STITCH_QUALITY_EXIGENCY = [
  "**IMPACTANTE de primeira**: o cliente vai abrir o preview e ter que dizer 'uau, ficou demais'. Esse é o teste de qualidade.",
  "**Hero forte**: H1 grande (text-5xl/6xl em desktop, leading-tight), com peso visual real. Subtítulo que respira (max-w-2xl). 2 CTAs com contraste claro entre primário/secundário.",
  "**Não wireframe, não template SaaS genérico**: evite gradientes purple-to-blue, evite 'lorem ipsum corporativo' tipo 'soluções inovadoras para o seu negócio'. Use linguagem específica do segmento e do brief.",
  "**Tipografia premium**: pelo menos 1 fonte da Google Fonts (Inter/Manrope/Fraunces/Playfair Display/DM Serif Display conforme o segmento). Hierarquia clara (display > h1 > h2 > body).",
  "**Espaçamento generoso**: py-20 entre seções no desktop, py-12 mobile. Não amontoar. Whitespace é estilo.",
  "**Imagens com peso**: usar imagens via picsum.photos OU emojis grandes OU SVG inline icons (Lucide-style com stroke 1.5). NUNCA placeholder cinza vazio.",
  "**Cards com profundidade**: shadow-md base, hover:shadow-xl + hover:-translate-y-1 com transição. Border-radius consistente (rounded-xl ou rounded-2xl).",
  "**Cores intencionais**: use a paleta sugerida do segmento. NÃO use Tailwind primary blue padrão (#3B82F6). Bg escuro no hero ou no CTA final pra criar contraste visual entre seções.",
  "**Copy específica do brief**: NUNCA escreva texto genérico tipo 'A melhor empresa do mercado'. Use sempre dados/diferenciais reais que estão no direcionamento por bloco acima.",
];

function blockSpecLines(keys: readonly (CanonicalBlockKey | SiteChromeBlockKey)[]): string {
  return keys
    .map((k) => {
      const spec = BLOCK_STANDARD_SPECS[k];
      return [
        `### ${spec.label} (\`data-block="${spec.dataBlock}"\`${spec.anchorId ? `, id="${spec.anchorId}"` : ""})`,
        spec.purpose,
        ...spec.contentRules.map((r) => `- ${r}`),
        `Estrutura: ${spec.htmlStructure}`,
      ].join("\n");
    })
    .join("\n\n");
}

/** Especificação compacta (páginas 2–5). */
function blockSpecLinesCompact(keys: readonly (CanonicalBlockKey | SiteChromeBlockKey)[]): string {
  return keys
    .map((k) => {
      const spec = BLOCK_STANDARD_SPECS[k];
      return `- \`data-block="${spec.dataBlock}"\`${spec.anchorId ? ` id="${spec.anchorId}"` : ""}: ${spec.purpose}`;
    })
    .join("\n");
}

function briefingBlock(answers: WizardAnswers): string {
  const refs =
    (answers.references ?? []).filter(Boolean).join(", ") || "nenhuma referência informada";
  const contact = [
    answers.contactPhone && `Tel: ${answers.contactPhone}`,
    answers.contactWhatsapp && `WhatsApp: ${answers.contactWhatsapp}`,
    answers.contactEmail && `Email: ${answers.contactEmail}`,
    answers.contactAddress && `Endereço: ${answers.contactAddress}`,
    answers.contactHours && `Horário: ${answers.contactHours}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return [
    `## Briefing (use em todo o site)`,
    `- Empresa: ${answers.companyName ?? "(não informado)"}`,
    `- Segmento / atividade: ${answers.industry ?? "(não informado)"}`,
    `- Proposta da home: ${answers.homePitch ?? answers.industry ?? "(não informado)"}`,
    `- CTA principal: ${answers.mainCta ?? "Fale conosco"}`,
    `- Sobre: ${answers.aboutText ?? "(usar tom do segmento)"}`,
    `- Site atual do cliente: ${answers.existingWebsite ?? "não informado"}`,
    `- Produtos/serviços: ${answers.offerings ?? "(inferir 3 pilares do segmento)"}`,
    `- Público-alvo: ${answers.audience ?? "(não informado)"}`,
    `- Contato: ${contact || answers.contactInfo || "(não inventar dados)"}`,
    `- Tom: ${answers.tone ?? "corporativo"}`,
    `- Benchmarks / referências visuais: ${refs}`,
  ].join("\n");
}

// ============================================================================
// PORT do brief-prompts.js do stitch-advocacia — direcionamento LITERAL por
// seção usando campos ricos do WizardAnswers (differentiators, faq,
// howItWorks, proofPoints, etc.). Sem isso, o Stitch alucina o conteúdo
// dos cards/seções; com isso, copy real do brief vai pra cada bloco certo.
// ============================================================================

function formatNumberedList(items?: string[]): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items
    .map((x, i) => {
      // Remove numeração prévia que o cliente possa ter colocado ("1. ...", "1) ...")
      const cleaned = x.replace(/^\s*\d+[.)]\s*/, "").trim();
      return `${i + 1}. ${cleaned}`;
    })
    .join("\n");
}

function formatFaqLiteral(faq?: Array<{ q: string; a: string }>): string {
  if (!Array.isArray(faq) || faq.length === 0) return "";
  return faq.map((item) => `P: ${item.q}\nR: ${item.a}`).join("\n\n");
}

function proofPointsDirective(proofPoints?: WizardAnswers["proofPoints"]): string {
  if (!proofPoints || proofPoints.skip) {
    return "OMITIR seção de prova social (cliente não tem cases reais ainda). Substituir por seção sobre método/processo.";
  }
  const list = formatNumberedList(proofPoints.items);
  if (!list) return "OMITIR prova social inventada — usar só dados reais informados.";
  return `Use ESTES pontos de prova reais (não inventar outros):\n${list}`;
}

/**
 * Bloco de direcionamento LITERAL por seção, baseado em campos ricos do brief.
 * Cada bullet diz EXATAMENTE o que colocar em cada bloco data-block. Quando
 * o cliente não forneceu o dado, instrui "OMITIR" ou "manter neutro" — nunca
 * permite inventar.
 */
export function richSectionDirectives(
  pageType: RequiredPageType,
  a: WizardAnswers,
): string {
  const lines: string[] = [];
  const ctaText = a.mainCta?.trim() || "Falar com a equipe";

  if (pageType === "home") {
    lines.push(`## Direcionamento por bloco (USE LITERALMENTE — não invente conteúdo dos cards)`);

    // 1. Hero
    if (a.mainPain || a.audience) {
      lines.push(
        `**Hero (data-block="hero")**:`,
        `- H1: ligar à dor do cliente — "${a.mainPain ?? "(usar industry)"}"`,
        `- Subtítulo: posicionar para "${a.audience ?? "(usar audience)"}"`,
        `- CTA primário: "${ctaText}"${a.siteGoal ? ` (objetivo: ${a.siteGoal})` : ""}`,
      );
    }

    // 2. Faixa de confiança / números
    if (a.proofPoints?.items?.length) {
      lines.push(
        ``,
        `**Faixa de confiança (stats em 3-4 cards horizontais)** — USE ESTES números do brief:`,
        formatNumberedList(a.proofPoints.items),
      );
    } else if (a.proofPoints?.skip) {
      lines.push(``, `**Faixa de confiança**: OMITIR (cliente declarou que não tem cases ainda).`);
    } else if (a.foundedYear) {
      const years = new Date().getFullYear() - parseInt(a.foundedYear, 10);
      if (Number.isFinite(years) && years > 0) {
        lines.push(``, `**Faixa de confiança**: usar "${years}+ anos de mercado" (calculado de foundedYear=${a.foundedYear}) e outras métricas só se informadas — NÃO INVENTAR números.`);
      }
    }

    // 3. Features-grid (diferenciais)
    const diffs = formatNumberedList(a.differentiators);
    if (diffs) {
      lines.push(
        ``,
        `**Features-grid (id="servicos", ≥3× article data-block="feature-card")** — USE EXATAMENTE estes diferenciais (um por card, NÃO INVENTAR outros):`,
        diffs,
      );
    }

    // 4. Como funciona (etapas)
    const steps = formatNumberedList(a.howItWorks);
    if (steps) {
      lines.push(
        ``,
        `**Como funciona (seção com 3-4 etapas numeradas em cards horizontais)** — USE EXATAMENTE estas etapas:`,
        steps,
      );
    }

    // 5. Sobre resumo
    if (a.aboutText || a.foundedYear || a.companyName) {
      lines.push(
        ``,
        `**Sobre resumo (layout 2 colunas: texto + imagem/stats)**:`,
        a.aboutText
          ? `- Parágrafo principal: "${a.aboutText.slice(0, 240)}${a.aboutText.length > 240 ? "..." : ""}"`
          : `- Parágrafo neutro sobre o posicionamento (não inventar marcos).`,
        a.foundedYear ? `- Destaque: "Desde ${a.foundedYear}"` : "",
        `- Link para ${SITE_PAGE_ROUTES.about} com texto "Conheça nossa história" ou similar.`,
      );
    }

    // 6. Depoimentos / prova social
    if (a.proofPoints?.skip) {
      lines.push(``, `**Depoimentos**: OMITIR seção (cliente não tem cases reais — NÃO INVENTAR depoimentos).`);
    } else if (a.proofPoints?.items?.length) {
      lines.push(
        ``,
        `**Depoimentos ou prova social (2-3 cards)**: usar os pontos de prova listados acima como base. Se algum item parece depoimento, formatar como aspas + autor; se for número, formatar como stat com ícone.`,
      );
    }

    // 7. FAQ resumida
    const faqLit = formatFaqLiteral(a.faq);
    if (faqLit) {
      const faqTop3 = a.faq?.slice(0, 3);
      if (faqTop3?.length) {
        lines.push(
          ``,
          `**FAQ resumida (3 perguntas em accordion)** — USE LITERALMENTE estas 3 primeiras (a versão completa fica em ${SITE_PAGE_ROUTES.services}):`,
          formatFaqLiteral(faqTop3),
        );
      }
    }

    // 8. CTA final
    lines.push(
      ``,
      `**CTA final (data-block="cta", id="contato", fundo contrastante)**: H2 ligado ao objetivo "${a.siteGoal ?? "conversão"}", parágrafo curto reforçando proposta, botão grande com texto "${ctaText}".`,
    );

    // 9. Footer reforço
    if (a.contactEmail || a.contactPhone || a.contactWhatsapp) {
      const footerContacts: string[] = [];
      if (a.contactEmail) footerContacts.push(`Email: ${a.contactEmail}`);
      if (a.contactPhone) footerContacts.push(`Tel: ${a.contactPhone}`);
      if (a.contactWhatsapp) footerContacts.push(`WhatsApp: ${a.contactWhatsapp}`);
      if (a.contactAddress) footerContacts.push(`${a.contactAddress}`);
      lines.push(
        ``,
        `**Footer**: 3-4 colunas. Coluna de contato com TODOS os canais reais informados:`,
        ...footerContacts.map((c) => `  - ${c}`),
      );
    }
  }

  if (pageType === "about") {
    lines.push(`## Direcionamento por bloco`);
    if (a.foundedYear) {
      lines.push(`**História**: empresa fundada em ${a.foundedYear}. NÃO INVENTE marcos específicos sem data.`);
    } else {
      lines.push(`**História**: texto neutro sobre o posicionamento. NÃO INVENTE datas ou marcos.`);
    }
    if (a.mainPain) {
      lines.push(`Texto deve abordar como a empresa resolve: "${a.mainPain}".`);
    }
    const diffs = formatNumberedList(a.differentiators);
    if (diffs) {
      lines.push(
        ``,
        `**Missão / Valores**: derivar de 1 parágrafo curto cada a partir destes diferenciais e do tom "${a.tone ?? "profissional"}". Manter genérico se faltar.`,
        diffs,
      );
    }
    if (a.audience) {
      lines.push(``, `**Para quem é**: "${a.audience}"`);
    }
    lines.push(``, proofPointsDirective(a.proofPoints));
    if (a.productName) {
      lines.push(``, `**CTA**: convidar para conhecer "${a.productName}" (link para ${SITE_PAGE_ROUTES.services}).`);
    }
  }

  if (pageType === "services") {
    lines.push(`## Direcionamento por bloco (USE LITERALMENTE)`);
    if (a.productName) {
      lines.push(
        `**Hero**:`,
        `- Nome do produto principal: "${a.productName}"`,
      );
      if (a.productDescription) lines.push(`- Subtítulo: extrair de "${a.productDescription}"`);
    }
    if (a.productDescription) {
      lines.push(``, `**Descrição completa do produto** (parágrafos curtos): "${a.productDescription}"`);
    }
    const steps = formatNumberedList(a.howItWorks);
    if (steps) {
      lines.push(``, `**Como funciona** — USE EXATAMENTE estas etapas (não acrescentar nem reordenar):`, steps);
    } else {
      lines.push(``, `**Como funciona**: OMITIR seção (cliente não detalhou etapas reais).`);
    }
    const diffs = formatNumberedList(a.differentiators);
    if (diffs) {
      lines.push(
        ``,
        `**Features-grid / Benefícios** — USE EXATAMENTE estes 3 itens (um feature-card cada):`,
        diffs,
      );
    }
    if (a.pricingModel) {
      lines.push(
        ``,
        `**Preço**: "${a.pricingModel}". Apresentar como bloco textual. NÃO INVENTAR 3 planos com preços específicos se não tem.`,
      );
    } else {
      lines.push(``, `**Preço**: OMITIR seção de planos (cliente não informou modelo de preço).`);
    }
    const faq = formatFaqLiteral(a.faq);
    if (faq) {
      lines.push(``, `**FAQ (accordion)** — USE EXATAMENTE estas perguntas e respostas:`, faq);
    } else {
      lines.push(``, `**FAQ**: OMITIR (cliente não forneceu perguntas reais — NÃO INVENTAR).`);
    }
    lines.push(``, `**CTA final**: "${ctaText}".`);
  }

  if (pageType === "contact") {
    lines.push(`## Direcionamento por bloco — USAR APENAS DADOS REAIS, NUNCA INVENTAR`);
    lines.push(
      `**Layout 2 colunas em desktop**:`,
      `- Esquerda: <form> com campos Nome, Email, Telefone/WhatsApp, Mensagem. Checkbox de LGPD. Botão "${ctaText}".`,
      `- Direita: cards de contato:`,
    );
    if (a.contactEmail) lines.push(`  - Email: ${a.contactEmail}`);
    if (a.contactPhone) lines.push(`  - Telefone: ${a.contactPhone}`);
    if (a.contactWhatsapp) lines.push(`  - WhatsApp: ${a.contactWhatsapp} (ícone com link wa.me)`);
    if (a.contactAddress) lines.push(`  - Endereço: ${a.contactAddress}`);
    if (a.cityState) lines.push(`  - Cidade: ${a.cityState}`);
    if (a.contactHours) lines.push(`  - Horário: ${a.contactHours}`);
  }

  if (pageType === "blog") {
    const topics = formatNumberedList(a.blogTopics?.items);
    if (a.blogTopics?.skip) {
      lines.push(`**Blog**: cliente não tem conteúdo escrito ainda. Manter introdução genérica e listagem placeholder sutil — NÃO INVENTAR títulos.`);
    } else if (topics) {
      lines.push(
        `## Direcionamento (USE LITERALMENTE)`,
        `**Grid de artigos** — USE EXATAMENTE estes títulos (gerar 1 card por título com data placeholder e excerpt curto neutro):`,
        topics,
        ``,
        `**Categorias**: derivadas dos próprios títulos (não inventar outras).`,
      );
    } else {
      lines.push(`**Blog**: introdução institucional + listagem placeholder neutra (sem títulos inventados).`);
    }
  }

  return lines.join("\n");
}

/** Briefing curto para páginas 2–5 (evita repetir tudo). */
export function briefingBlockShort(answers: WizardAnswers): string {
  return [
    `## Briefing (resumo)`,
    `- Empresa: ${answers.companyName ?? "(não informado)"} · ${answers.industry ?? ""}`,
    `- CTA: ${answers.mainCta ?? "Fale conosco"} · Tom: ${answers.tone ?? "corporativo"}`,
    `- Mesmo header/footer e paleta da HOME já gerada.`,
  ].join("\n");
}

const NAV_LINKS = `Início → ${SITE_PAGE_ROUTES.home} | Serviços → ${SITE_PAGE_ROUTES.services} | Sobre → ${SITE_PAGE_ROUTES.about} | Blog → ${SITE_PAGE_ROUTES.blog} | Contato → ${SITE_PAGE_ROUTES.contact}`;

function pageLabel(pageType: RequiredPageType): string {
  if (pageType === "home") return "HOME (landing)";
  if (pageType === "about") return "QUEM SOMOS";
  if (pageType === "contact") return "CONTATO";
  if (pageType === "services") return "SERVIÇOS / SOLUÇÕES";
  return "BLOG / NOTÍCIAS";
}

export function warnIfPromptTooLong(prompt: string, pageType: RequiredPageType): void {
  const max = STITCH_PROMPT_MAX_CHARS;
  if (max > 0 && prompt.length > max) {
    // eslint-disable-next-line no-console
    console.warn(`[stitch:prompt] ${pageType} prompt ${prompt.length} chars exceeds ${max}`);
  }
}

/**
 * Prompt Stitch para a landing/home.
 */
export function buildStitchHomePrompt(answers: WizardAnswers, copy?: SitePageCopy): string {
  return buildStitchPagePrompt("home", answers, copy);
}

/**
 * Prompt Stitch para qualquer página obrigatória no padrão de blocos.
 */
export function buildStitchPagePrompt(
  pageType: RequiredPageType,
  answers: WizardAnswers,
  copy?: SitePageCopy,
): string {
  const blocks = STANDARD_PAGE_BLOCKS[pageType];
  const chromeBlocks: (CanonicalBlockKey | SiteChromeBlockKey)[] = ["header", ...blocks, "footer"];
  const label = pageLabel(pageType);
  const isHome = pageType === "home";
  const specSection = [
    blockSpecLinesCompact(chromeBlocks),
    isHome
      ? "Home: hero com badge+H1+2 CTAs; features-grid com exatamente 3× article data-block=\"feature-card\"; CTA id=contato."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Direcionamento rico (port do stitch-advocacia) — DEVE vir antes do blueprint
  // genérico pra que o Stitch veja primeiro as instruções específicas e use o
  // conteúdo literal do brief em cada bloco data-block.
  const richDirectives = richSectionDirectives(pageType, answers);

  // Quando o cliente declarou explicitamente dark/light no answers.colors,
  // o prompt PRECISA reforçar isso como instrução prioritária — Stitch ignora
  // dicas dentro do design-block quando o segmento "puxa" pro outro lado
  // (ex.: saúde→light por padrão), mesmo o cliente tendo pedido dark.
  const userMode = detectUserColorMode(answers.colors);
  const colorModeBlock = userMode
    ? [
        `## 🎨 MODO DE COR — EXIGÊNCIA EXPLÍCITA DO CLIENTE`,
        `O cliente declarou no briefing: **${answers.colors}**`,
        `Isso significa **MODO ${userMode === "dark" ? "DARK" : "LIGHT"}**.`,
        userMode === "dark"
          ? `- <html class="dark"> e <body class="bg-background"> com background ESCURO (#0F172A / #051424 / #18181b)
- Texto principal CLARO (#F8FAFC / #E5E7EB)
- Hero também escuro (NÃO pode ter hero light no meio do site dark)
- NÃO use bg-white, bg-gray-50, bg-stone-50 — esses são light, mesmo se "harmoniza"
- ALL pages (home, about, services, contact, blog) devem ter o MESMO modo dark`
          : `- Background CLARO (#FFFFFF / #F9FAFB) em body e seções
- Texto principal ESCURO (#0F172A / #1F2937)
- Manter consistência clara em todas as páginas`,
        `IGNORE preferências genéricas do segmento — o cliente foi explícito.`,
      ].join("\n")
    : "";

  const prompt = [
    `Gere UMA página HTML completa: **${label}** (${SITE_PAGE_ROUTES[pageType]}).`,
    `Estrutura e atributos data-block são OBRIGATÓRIOS. Site institucional completo — NÃO wireframe.`,
    colorModeBlock,
    buildDesignLanguageBlock(answers),
    ``,
    richDirectives, // ← prioridade: instruções literais por seção com dados reais
    ``,
    `## Blueprint estrutural (use junto com o direcionamento acima)`,
    STITCH_PAGE_BLUEPRINTS[pageType].map((s) => `- ${s}`).join("\n"),
    ``,
    `## Blocos CMS (ordem)`,
    chromeBlocks.map((k) => `- ${k}`).join("\n"),
    ``,
    `## Menu do header`,
    NAV_LINKS,
    isHome
      ? `Âncoras na home: #top, #servicos, #contato`
      : `CTA principal → ${SITE_PAGE_ROUTES.contact} quando for link externo.`,
    ``,
    isHome ? briefingBlock(answers) : briefingBlockShort(answers),
    ``,
    `## Regras técnicas`,
    ...STITCH_TECHNICAL_RULES.map((r) => `- ${r}`),
    ``,
    `## QUALIDADE EXIGIDA (esse é o critério de aceitação)`,
    ...STITCH_QUALITY_EXIGENCY.map((r) => `- ${r}`),
    ``,
    `## Especificação data-block`,
    specSection,
    copySummaryForPrompt(pageType, copy),
    ``,
    `Documento: <header data-block="header">, <main>, <footer data-block="footer">.`,
    `Mínimo ~${STITCH_PAGE_MIN_BYTES[pageType]} caracteres de HTML útil.`,
  ]
    .filter(Boolean)
    .join("\n");

  warnIfPromptTooLong(prompt, pageType);
  return prompt;
}

/** Valida tamanho mínimo + âncoras CMS. */
export function validateStitchPageFunctional(
  pageType: RequiredPageType,
  html: string,
): StitchHtmlValidation & { htmlTooShort: boolean; htmlLength: number } {
  const base = validateStitchPageHtml(pageType, html);
  const htmlLength = html.length;
  const min = STITCH_PAGE_MIN_BYTES[pageType];
  const htmlTooShort = htmlLength < min;
  const extra: string[] = [];
  if (htmlTooShort) extra.push(`html<${min}`);
  if (pageType === "contact" && !/<form[\s>]/i.test(html)) {
    extra.push("contact-form");
  }
  // Blog: aceita ≥1 article. Os cards reais de post são injetados depois por
  // injectBlogPostsList (a partir do BlogPost do banco), então não precisamos
  // exigir 3 articles já no HTML cru do Stitch — exigir isso travava o pipeline
  // em retry quando o Stitch gerava um layout de blog diferente.
  if (pageType === "blog" && (html.match(/<article/gi) ?? []).length < 1) {
    extra.push("blog-article×1");
  }

  return {
    ...base,
    ok: base.ok && extra.length === 0,
    missingBlocks: [...base.missingBlocks, ...extra],
    htmlTooShort,
    htmlLength,
  };
}

/** Prompt único para gerar o site inteiro (referência; geração real é 1 tela por página). */
export function buildStitchSiteBrief(answers: WizardAnswers, copy?: SitePageCopy): string {
  return [
    `Site institucional completo com ${REQUIRED_PAGE_TYPES.length} páginas no mesmo padrão visual.`,
    briefingBlock(answers),
    buildDesignLanguageBlock(answers),
    `Páginas: ${REQUIRED_PAGE_TYPES.map((t) => `${t} (${SITE_PAGE_ROUTES[t]})`).join(", ")}.`,
    copy ? `Use textos resumidos por página nos prompts.` : ``,
  ]
    .filter(Boolean)
    .join("\n");
}

export interface StitchHtmlValidation {
  ok: boolean;
  missingBlocks: string[];
  featureCardCount: number;
}

/** Valida se o HTML do Stitch respeita o padrão mínimo da home. */
export function validateStitchHomeHtml(html: string): StitchHtmlValidation {
  return validateStitchPageHtml("home", html);
}

/** Valida HTML de qualquer página obrigatória. */
export function validateStitchPageHtml(
  pageType: RequiredPageType,
  html: string,
): StitchHtmlValidation {
  const missingBlocks: string[] = [];
  const required = STANDARD_PAGE_BLOCKS[pageType];
  // features-grid: aceita ≥3 feature-cards mesmo sem wrapper data-block — Stitch
  // costuma esquecer o atributo no container, mas gera os cards corretamente.
  const featureCardCount = (html.match(/data-block=["']feature-card["']/gi) ?? []).length;
  for (const block of required) {
    if (block === "features-grid") {
      const hasGrid = /data-block=["']features-grid["']/i.test(html);
      const hasEnoughCards = featureCardCount >= 3;
      if (!hasGrid && !hasEnoughCards) missingBlocks.push("features-grid");
      continue;
    }
    const re = new RegExp(`data-block=["']${block}["']`, "i");
    if (!re.test(html)) missingBlocks.push(block);
  }
  if (required.includes("features-grid") && featureCardCount < 3) {
    missingBlocks.push("feature-card×3");
  }
  return {
    ok: missingBlocks.length === 0,
    missingBlocks,
    featureCardCount,
  };
}

export function assertPageBlocks(
  pageType: RequiredPageType,
  sectionKeys: string[],
): void {
  const required = STANDARD_PAGE_BLOCKS[pageType];
  const normalized = new Set(
    sectionKeys.map((k) => k.trim().toLowerCase().replace(/\s+/g, "-")),
  );
  const aliases: Record<string, CanonicalBlockKey> = {
    hero: "hero",
    content: "content",
    text: "content",
    "features-grid": "features-grid",
    features: "features-grid",
    services: "features-grid",
    solutions: "features-grid",
    whyus: "features-grid",
    cta: "cta",
  };
  const resolved = new Set<CanonicalBlockKey>();
  for (const k of normalized) {
    const canon = aliases[k] ?? (CANONICAL_BLOCK_KEYS as readonly string[]).find((c) => c === k);
    if (canon) resolved.add(canon as CanonicalBlockKey);
  }
  const missing = required.filter((r) => !resolved.has(r));
  if (missing.length > 0) {
    throw new Error(`Página "${pageType}" incompleta. Faltam blocos: ${missing.join(", ")}`);
  }
}
