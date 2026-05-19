import { buildStitchPagePrompt, STITCH_PAGE_MIN_BYTES } from "@/lib/cms/site-block-standard";
import { SITE_PAGE_ROUTES, type RequiredPageType } from "@/lib/themes/required-pages";
import { homeSampleMaxChars } from "@/lib/stitch/html-style-sample";
import type { SitePageCopy } from "@/lib/wizard/site-content-types";
import type { WizardAnswers } from "@/lib/wizard/types";

export interface StitchPromptOptions {
  feedback?: string | null;
  /** Trecho leve da home (head/botão) para continuidade visual nas páginas 2–5. */
  homeHtmlSample?: string | null;
  /** Reforço após falha de validação. */
  repairNote?: string | null;
  /** Quando true, omite amostra HTML (design system ativo). */
  skipHomeSample?: boolean;
}

export function buildStitchRichPagePrompt(
  pageType: RequiredPageType,
  answers: WizardAnswers,
  copy?: SitePageCopy,
  opts?: StitchPromptOptions,
): string {
  const base = buildStitchPagePrompt(pageType, answers, copy);
  const parts = [
    base,
    ``,
    `## Qualidade`,
    `Header e footer consistentes; navegação: ${Object.values(SITE_PAGE_ROUTES).join(", ")}.`,
  ];

  const maxSample = homeSampleMaxChars();
  if (
    pageType !== "home" &&
    !opts?.skipHomeSample &&
    opts?.homeHtmlSample?.trim()
  ) {
    parts.push(
      ``,
      `## Continuidade visual (tokens da HOME)`,
      "```html",
      opts.homeHtmlSample.trim().slice(0, maxSample),
      "```",
    );
  }

  if (opts?.feedback?.trim()) {
    parts.push(``, `## Ajustes do cliente`, opts.feedback.trim().slice(0, 800));
  }

  if (opts?.repairNote?.trim()) {
    parts.push(``, `## Correção obrigatória`, opts.repairNote.trim().slice(0, 600));
  }

  return parts.join("\n");
}

export function buildStitchRepairNote(
  pageType: RequiredPageType,
  missing: string[],
  htmlLength: number,
  minBytes: number,
): string {
  const lines = [
    `A página ${pageType} não passou na validação.`,
    `Problemas: ${missing.join(", ") || "estrutura incompleta"}.`,
    `HTML atual: ${htmlLength} chars (mínimo ${minBytes}).`,
    `Inclua TODOS os data-block obrigatórios e seções do blueprint.`,
  ];
  if (pageType === "contact") {
    lines.push(`Inclua <form> com campos nome, email e mensagem.`);
  }
  if (pageType === "blog") {
    lines.push(`Inclua pelo menos 3 <article> de posts com título, data e resumo.`);
  }
  if (pageType === "home" || pageType === "services") {
    lines.push(`features-grid: exatamente 3× article data-block="feature-card".`);
  }
  return lines.join("\n");
}

export { STITCH_PAGE_MIN_BYTES };
