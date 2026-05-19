import { buildStitchPagePrompt, STANDARD_PAGE_BLOCKS } from "@/lib/cms/site-block-standard";
import { SITE_PAGE_ROUTES, type RequiredPageType } from "@/lib/themes/required-pages";
import type { SitePageCopy } from "@/lib/wizard/site-content-types";
import type { ExtractedTokens, WizardAnswers } from "@/lib/wizard/types";

/** Alias semântico: mesmo contrato de blocos, gerador = IA. */
export const buildSitePagePrompt = buildStitchPagePrompt;

export const AI_PAGE_SYSTEM_PROMPT = `Você é designer e desenvolvedor front-end sênior brasileiro.
Sua tarefa é gerar UMA página HTML institucional completa para o Clube da Web.

REGRAS DE SAÍDA (obrigatórias):
- Responda APENAS com o documento HTML completo. Sem markdown, sem explicação, sem \`\`\`.
- Comece com <!DOCTYPE html> e termine com </html>.
- Inclua no <head>: charset UTF-8, viewport, <title>, e <script src="https://cdn.tailwindcss.com"></script>.
- Português do Brasil. Tom profissional e específico ao briefing.
- Mobile-first (classes sm:/md:/lg:). Sem JavaScript.
- Cada bloco de conteúdo DEVE ter data-block exatamente como especificado (ex.: data-block="hero").
- Na grade de features: exatamente 3 elementos article com data-block="feature-card".
- Header com data-block="header" e footer com data-block="footer".
- Links do menu devem usar as rotas públicas fornecidas no prompt do usuário.
- Use APENAS cores da paleta padrão Tailwind (slate, gray, stone, neutral, amber, orange, yellow, red, etc.).
- NÃO invente classes como bg-beige-100 ou text-brown-800 — use stone, amber, orange (ex.: bg-stone-100, text-amber-900, bg-amber-600).
- Inclua <script src="https://cdn.tailwindcss.com"></script> no <head>.
- Não invente telefone, e-mail, endereço ou CNPJ que não estejam no briefing.
- Quando o prompt trouxer JSON de textos, use esses textos literalmente nos blocos correspondentes.`;

function designTokensBlock(tokens: ExtractedTokens | null | undefined): string {
  if (!tokens) return "";
  return [
    ``,
    `## Design system (mesmas cores/tipografia das outras páginas do site)`,
    `- Primária (botões, destaques): ${tokens.primaryColor}`,
    `- Secundária: ${tokens.secondaryColor}`,
    `- Accent: ${tokens.accentColor}`,
    `- Texto: ${tokens.textColor} / claro: ${tokens.textLightColor}`,
    `- Fundo: ${tokens.backgroundColor} / superfície: ${tokens.surfaceColor}`,
    `- Fontes: ${tokens.fontPrimary} (corpo), ${tokens.fontHeading} (títulos)`,
    `- Border radius: ${tokens.borderRadius}`,
    `Use classes Tailwind que aproximem essas cores (ex.: botão primário com bg próximo a ${tokens.primaryColor}).`,
  ].join("\n");
}

export function buildAIPageUserPrompt(
  pageType: RequiredPageType,
  answers: WizardAnswers,
  copy: SitePageCopy,
  opts?: {
    feedback?: string | null;
    designTokens?: ExtractedTokens | null;
    isFirstPage?: boolean;
  },
): string {
  const blocks = STANDARD_PAGE_BLOCKS[pageType];
  const base = buildSitePagePrompt(pageType, answers, copy);

  const parts = [
    base,
    ``,
    `## Rotas públicas (use nos href do menu e CTAs externos)`,
    ...Object.entries(SITE_PAGE_ROUTES).map(([k, path]) => `- ${k}: ${path}`),
    ``,
    `## Blocos obrigatórios nesta página (validação automática)`,
    blocks.map((b) => `- data-block="${b}"`).join("\n"),
    blocks.includes("features-grid") ? `- 3× data-block="feature-card"` : "",
    designTokensBlock(opts?.designTokens),
  ];

  if (opts?.isFirstPage) {
    parts.push(
      ``,
      `Esta é a HOME — defina o visual que será referência para todo o site (paleta, espaçamento, estilo dos cards).`,
    );
  } else {
    parts.push(
      ``,
      `Mantenha o MESMO design system da home (cores, tipografia, estilo de botões e cards).`,
    );
  }

  if (opts?.feedback?.trim()) {
    parts.push(
      ``,
      `## Ajustes do cliente (nova versão)`,
      opts.feedback.trim().slice(0, 800),
    );
  }

  return parts.filter(Boolean).join("\n");
}
