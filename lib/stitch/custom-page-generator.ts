/**
 * Gera uma página customizada (slug + descrição do user) reusando o
 * stitchProjectId existente — mesma identidade visual, design system,
 * header/footer.
 *
 * Fluxo:
 *   user no chat: "cria página /lgpd sobre nossa política de privacidade"
 *   → state-machine emite generate_custom_page { slug: 'lgpd', prompt: ... }
 *   → orchestrator chama esta função
 *   → SDK.generateScreen reusando STITCH_PROJECT_ID da sessão
 *   → polish pipeline aplicado igual ao publish
 *   → persiste em SiteConfig.stitch_html_custom_<slug>
 */

import { generateScreen, type StitchClientOptions } from "./client";
import { polishStitchPages } from "./polish-stitch-pages";
import { getStitchMenuItems } from "./menu-items";
import type { WizardAnswers } from "@/lib/wizard/types";

export interface GenerateCustomPageParams {
  /** ID do projeto Stitch da sessão (reusar pra manter design system). */
  projectId: string | null;
  /** Slug da nova página (ex: 'lgpd'). */
  slug: string;
  /** Descrição livre do user — o que a página deve cobrir. */
  userPrompt: string;
  /** Briefing original pra dar contexto (empresa, tom, segmento). */
  answers: WizardAnswers;
  /** Logo cadastrado em siteConfig (se houver). */
  logoUrl?: string | null;
}

export interface GenerateCustomPageResult {
  /** HTML pronto pra persistir em SiteConfig.stitch_html_custom_<slug>. */
  html: string;
  /** ID da screen Stitch criada (pra futuras variants/edits). */
  screenId: string;
  durationMs: number;
}

function buildCustomPagePrompt(params: GenerateCustomPageParams): string {
  const { slug, userPrompt, answers } = params;
  const company = answers.companyName?.trim() || "a empresa";
  const segment = answers.industry?.trim() || "serviços";
  const tone = answers.tone?.trim() || "profissional";
  const colors = answers.colors?.trim() || "";

  return [
    `Gere UMA página HTML customizada para o site institucional de **${company}** (${segment}).`,
    ``,
    `## Slug / rota`,
    `/${slug}`,
    ``,
    `## Pedido do cliente`,
    userPrompt,
    ``,
    `## Diretrizes`,
    `- Mesma identidade visual das outras páginas do site (mesmo tema, header, footer, tipografia).`,
    `- Tom: ${tone}`,
    colors ? `- Paleta: ${colors}` : "",
    `- Estrutura HTML: <html><head>... Tailwind CDN ... </head><body class="...">`,
    `  <header data-block="header">... menu igual ao das outras páginas ...</header>`,
    `  <main>... CONTEÚDO PRINCIPAL DA PÁGINA, escrito de forma substantiva, não placeholder ...</main>`,
    `  <footer data-block="footer">...</footer></body></html>`,
    `- Conteúdo NÃO pode ser placeholder. Escreva texto real e útil sobre o tema pedido.`,
    `- Se a página for institucional (LGPD, termos, política), inclua seções organizadas com <h2>.`,
    `- Se for landing/case, inclua hero + bullets + CTA pro /contato.`,
    `- Mínimo 4000 caracteres de HTML útil.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateCustomPage(
  params: GenerateCustomPageParams,
): Promise<GenerateCustomPageResult> {
  const started = Date.now();
  const prompt = buildCustomPagePrompt(params);

  const opts: StitchClientOptions = {
    projectId: params.projectId ?? undefined,
    device: "DESKTOP",
    modelId: "GEMINI_3_FLASH",
  };

  // Reusa generateScreen (já tem retry + fallback + sanitize)
  const result = await generateScreen(prompt, opts);

  // Polish: aplica chrome consistente, contatos reais, forms POST, logo,
  // menu labels. Como polishStitchPages opera num set de páginas e usa
  // referência das outras, passamos só essa página — sanitize + contacts +
  // forms + logo + menu serão aplicados; chrome/styling cross-page é
  // skipado porque exige conjunto completo.
  const menuItems = await getStitchMenuItems();
  const polished = polishStitchPages(
    { home: result.html }, // truque: marca como "home" pra rodar todas as etapas
    {
      answers: params.answers,
      logoUrl: params.logoUrl,
      menuItems,
    },
  );

  return {
    html: polished.home ?? result.html,
    screenId: result.screenId,
    durationMs: Date.now() - started,
  };
}

const RESERVED_SLUGS = new Set([
  "gestor", "api", "noticias", "quem-somos", "solucoes", "contato",
  "preview", "aviso-de-cookies", "aviso-de-privacidade", "lgpd",
  "_next", "chat", "cronicas", "etica", "canal-de-denuncias",
  "catalogo", "feed.xml", "favicon.ico", "robots.txt", "sitemap.xml",
  "not-found", "nossos-parceiros", "missao-visao-e-valores",
  "bitdefender-gravityzone-business-security",
  "bitdefender-gravityzone-business-security-premium",
  "bitdefender-gravityzone-business-security-enterprise",
  "p", "images", "uploads", "static",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
