import { generateAIPageHtml } from "@/lib/ai-site/generate-page-html";
import { validateStitchPageHtml } from "@/lib/cms/site-block-standard";
import { logger } from "@/lib/logger";
import { REQUIRED_PAGE_TYPES, type RequiredPageType } from "@/lib/themes/required-pages";
import { resolveWizardPageProvider } from "@/lib/wizard/page-provider";
import { ensureSiteCopy, generateSiteContent } from "@/lib/wizard/site-content-generator";
import type { SitePageCopy } from "@/lib/wizard/site-content-types";
import type { ExtractedTokens, WizardAnswers } from "@/lib/wizard/types";
import { buildFallbackPageHtml } from "./fallback-page-html";
import { extractTokensFromHtml, fallbackTokens } from "./theme-extractor";
import type { StitchClientOptions, StitchGenerationResult } from "./client";
import type { StitchPipelineMode } from "./stitch-pipeline";
import { runStitchPagePipeline } from "./stitch-pipeline";

export interface StitchPageResult {
  pageType: RequiredPageType;
  html: string;
  htmlUrl: string;
  screenId: string;
  provider: "ai" | "stitch" | "template";
  validationOk: boolean;
}

export interface GenerateSiteResult {
  projectId: string;
  pages: Record<RequiredPageType, StitchPageResult>;
  tokens: StitchGenerationResult["tokens"];
  copy: SitePageCopy;
  totalDurationMs: number;
  stitchPageCount: number;
}

const HTML_SLICE = 180_000;

function companyLabel(answers: WizardAnswers): string {
  return answers.companyName?.trim() || "Sua empresa";
}

function taglineLabel(answers: WizardAnswers): string {
  return answers.industry?.trim() || "Soluções sob medida";
}

async function generateViaAI(
  pageType: RequiredPageType,
  answers: WizardAnswers,
  copy: SitePageCopy,
  opts?: { feedback?: string | null; designTokens?: ExtractedTokens | null },
): Promise<{ html: string; tokens: ExtractedTokens; provider: "ai" | "template" }> {
  const result = await generateAIPageHtml(pageType, answers, copy, opts);
  return {
    html: result.html,
    tokens: result.tokens,
    provider: result.provider,
  };
}

async function generateViaStitch(
  pageType: RequiredPageType,
  answers: WizardAnswers,
  copy: SitePageCopy,
  company: string,
  tagline: string,
  opts?: StitchClientOptions & {
    existingProjectId?: string | null;
    existingScreenId?: string | null;
    designSystemId?: string | null;
    mode?: StitchPipelineMode;
    feedback?: string | null;
    homeTokens?: ExtractedTokens | null;
    homeHtmlSample?: string | null;
  },
): Promise<{
  html: string;
  htmlUrl: string;
  screenId: string;
  projectId: string;
  tokens: ExtractedTokens;
  provider: "stitch" | "template";
  designSystemId?: string | null;
} | null> {
  const homeTokens = opts?.homeTokens ?? null;

  try {
    const result = await runStitchPagePipeline(pageType, answers, copy, {
      ...opts,
      existingProjectId: opts?.existingProjectId ?? opts?.projectId ?? null,
      existingScreenId: opts?.existingScreenId,
      designSystemId: opts?.designSystemId,
      mode: opts?.mode,
      feedback: opts?.feedback,
      homeHtmlSample: opts?.homeHtmlSample,
      strictFunctional: true,
    });

    const tokens = pageType === "home" ? result.tokens : homeTokens ?? result.tokens;
    return {
      html: result.html.slice(0, HTML_SLICE),
      htmlUrl: result.htmlUrl,
      screenId: result.screenId,
      projectId: result.projectId,
      tokens,
      provider: "stitch",
      designSystemId: result.designSystemId,
    };
  } catch (err) {
    logger.warn("[stitch] pipeline failed, template fallback", {
      pageType,
      err: String(err),
    });
  }

  const tokens = homeTokens ?? fallbackTokens(`${company} ${tagline}`);
  return {
    html: buildFallbackPageHtml(pageType, copy, company, tagline, tokens),
    htmlUrl: "",
    screenId: "template",
    projectId: opts?.existingProjectId ?? "template",
    tokens,
    provider: "template",
  };
}

export async function generateWizardSite(
  answers: WizardAnswers,
  opts?: StitchClientOptions & { existingProjectId?: string | null },
): Promise<GenerateSiteResult> {
  const started = Date.now();
  const copy = await generateSiteContent(answers);
  let designTokens: ExtractedTokens | null = null;
  let homeHtmlSample: string | null = null;
  const pages = {} as Record<RequiredPageType, StitchPageResult>;
  let stitchCount = 0;
  let projectId = opts?.existingProjectId ?? "ai-generated";

  for (const pageType of REQUIRED_PAGE_TYPES) {
    const page = await generateWizardPage(pageType, answers, copy, {
      ...opts,
      homeTokens: designTokens,
      homeHtmlSample: pageType === "home" ? null : homeHtmlSample,
    });
    if (page.provider === "stitch") stitchCount += 1;
    if (pageType === "home") {
      designTokens = page.tokens;
      homeHtmlSample = page.html;
    }
    pages[pageType] = page;
    if (page.projectId && page.projectId !== "fallback") projectId = page.projectId;
  }

  return {
    projectId,
    pages,
    tokens: designTokens ?? fallbackTokens(`${answers.companyName ?? ""} ${answers.industry ?? ""}`),
    copy,
    totalDurationMs: Date.now() - started,
    stitchPageCount: stitchCount,
  };
}

export function stitchPagesToMap(
  result: GenerateSiteResult,
): Record<RequiredPageType, string> {
  const out = {} as Record<RequiredPageType, string>;
  for (const t of REQUIRED_PAGE_TYPES) {
    out[t] = result.pages[t].html;
  }
  return out;
}

/** Gera uma página (IA por padrão; Stitch se WIZARD_PAGE_PROVIDER=stitch). */
export async function generateWizardPage(
  pageType: RequiredPageType,
  answers: WizardAnswers,
  copy: SitePageCopy,
  opts?: StitchClientOptions & {
    existingProjectId?: string | null;
    existingScreenId?: string | null;
    designSystemId?: string | null;
    mode?: StitchPipelineMode;
    feedback?: string | null;
    homeTokens?: ExtractedTokens | null;
    homeHtmlSample?: string | null;
  },
): Promise<
  StitchPageResult & {
    projectId: string;
    tokens: ExtractedTokens;
    designSystemId?: string | null;
  }
> {
  const safeCopy = ensureSiteCopy(answers, copy);
  const company = companyLabel(answers);
  const tagline = taglineLabel(answers);
  const mode = resolveWizardPageProvider();

  try {
    if (mode === "template") {
      const tokens =
        opts?.homeTokens ??
        fallbackTokens(`${answers.companyName ?? ""} ${answers.industry ?? ""}`);
      const html = buildFallbackPageHtml(pageType, safeCopy, company, tagline, tokens);
      return {
        pageType,
        html,
        htmlUrl: "",
        screenId: "template",
        provider: "template",
        validationOk: validateStitchPageHtml(pageType, html).ok,
        projectId: opts?.existingProjectId ?? "template",
        tokens: pageType === "home" ? extractTokensFromHtml(html) : tokens,
      };
    }

    if (mode === "ai") {
      const ai = await generateViaAI(pageType, answers, safeCopy, {
        feedback: opts?.feedback,
        designTokens: opts?.homeTokens,
      });
      return {
        pageType,
        html: ai.html,
        htmlUrl: "",
        screenId: ai.provider === "ai" ? "ai" : "template",
        provider: ai.provider,
        validationOk: validateStitchPageHtml(pageType, ai.html).ok,
        projectId: opts?.existingProjectId ?? "ai-generated",
        tokens: ai.tokens,
      };
    }

    const stitch = await generateViaStitch(pageType, answers, safeCopy, company, tagline, opts);
    if (stitch) {
      return {
        pageType,
        html: stitch.html,
        htmlUrl: stitch.htmlUrl,
        screenId: stitch.screenId,
        provider: stitch.provider,
        validationOk: validateStitchPageHtml(pageType, stitch.html).ok,
        projectId: stitch.projectId,
        tokens: stitch.tokens,
        designSystemId: stitch.designSystemId ?? opts?.designSystemId ?? null,
      };
    }
  } catch (err) {
    logger.error("[wizard:page] geração falhou — template", String(err), { pageType });
  }

  const tokens =
    opts?.homeTokens ?? fallbackTokens(`${answers.companyName ?? ""} ${answers.industry ?? ""}`);
  const html = buildFallbackPageHtml(pageType, safeCopy, company, tagline, tokens);
  return {
    pageType,
    html,
    htmlUrl: "",
    screenId: "template",
    provider: "template",
    validationOk: validateStitchPageHtml(pageType, html).ok,
    projectId: opts?.existingProjectId ?? "template",
    tokens,
  };
}
