import { validateStitchPageHtml } from "@/lib/cms/site-block-standard";
import { logger } from "@/lib/logger";
import { buildFallbackPageHtml } from "@/lib/stitch/fallback-page-html";
import { extractTokensFromHtml, fallbackTokens } from "@/lib/stitch/theme-extractor";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import { chatCompletion, stripCodeFences } from "@/lib/wizard/llm-client";
import type { SitePageCopy } from "@/lib/wizard/site-content-types";
import type { ExtractedTokens, WizardAnswers } from "@/lib/wizard/types";
import { ensurePreviewHtml } from "./ensure-preview-html";
import { AI_PAGE_SYSTEM_PROMPT, buildAIPageUserPrompt } from "./page-prompts";

const MAX_HTML = 180_000;

export type PageHtmlProvider = "ai" | "template";

export interface GeneratePageHtmlResult {
  html: string;
  provider: PageHtmlProvider;
  validationOk: boolean;
  tokens: ExtractedTokens;
}

function companyLabel(answers: WizardAnswers): string {
  return answers.companyName?.trim() || "Sua empresa";
}

function taglineLabel(answers: WizardAnswers): string {
  return answers.industry?.trim() || "Soluções sob medida";
}

function templateFallback(
  pageType: RequiredPageType,
  copy: SitePageCopy,
  answers: WizardAnswers,
  tokens: ExtractedTokens | null,
): GeneratePageHtmlResult {
  const company = companyLabel(answers);
  const tagline = taglineLabel(answers);
  const resolved =
    tokens ?? fallbackTokens(`${company} ${tagline} ${answers.colors ?? ""}`);
  const html = buildFallbackPageHtml(pageType, copy, company, tagline, resolved);
  return {
    html,
    provider: "template",
    validationOk: validateStitchPageHtml(pageType, html).ok,
    tokens: pageType === "home" ? extractTokensFromHtml(html) : resolved,
  };
}

/**
 * Gera HTML de uma página via LLM seguindo o padrão de blocos do Clube da Web.
 * Se a IA falhar ou o HTML não validar, usa template local.
 */
export async function generateAIPageHtml(
  pageType: RequiredPageType,
  answers: WizardAnswers,
  copy: SitePageCopy,
  opts?: {
    feedback?: string | null;
    designTokens?: ExtractedTokens | null;
  },
): Promise<GeneratePageHtmlResult> {
  const userPrompt = buildAIPageUserPrompt(pageType, answers, copy, {
    feedback: opts?.feedback,
    designTokens: opts?.designTokens,
    isFirstPage: pageType === "home",
  });

  try {
    const raw = await chatCompletion({
      system: AI_PAGE_SYSTEM_PROMPT,
      user: userPrompt,
      timeoutMs: 90_000,
      temperature: 0.7,
    });
    let html = stripCodeFences(raw);
    if (!/<html[\s>]/i.test(html)) {
      html = `<!DOCTYPE html>\n<html lang="pt-BR">\n${html}\n</html>`;
    }
    html = ensurePreviewHtml(html).slice(0, MAX_HTML);

    const validation = validateStitchPageHtml(pageType, html);
    const tokens =
      pageType === "home"
        ? extractTokensFromHtml(html)
        : opts?.designTokens ??
          fallbackTokens(`${answers.companyName ?? ""} ${answers.industry ?? ""}`);

    if (validation.ok && html.length >= 1_200) {
      logger.info("[ai-site] página gerada", { pageType, htmlLen: html.length });
      return { html, provider: "ai", validationOk: true, tokens };
    }

    logger.warn("[ai-site] HTML inválido ou curto — template", {
      pageType,
      missing: validation.missingBlocks,
      htmlLen: html.length,
    });
  } catch (err) {
    logger.error("[ai-site] LLM falhou — template", { pageType, err: String(err) });
  }

  return templateFallback(pageType, copy, answers, opts?.designTokens ?? null);
}
