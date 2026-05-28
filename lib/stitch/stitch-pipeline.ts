import {
  STITCH_PAGE_MIN_BYTES,
  validateStitchPageFunctional,
  validateStitchPageHtml,
} from "@/lib/cms/site-block-standard";
import { logger } from "@/lib/logger";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import type { SitePageCopy } from "@/lib/wizard/site-content-types";
import type { ExtractedTokens, WizardAnswers } from "@/lib/wizard/types";
import { generateScreen, type StitchClientOptions, type StitchGenerationResult } from "./client";
import { extractHtmlStyleSample } from "./html-style-sample";
import { sanitizeStitchHtml, setChromeSourceFromHome } from "./sanitize-stitch-html";
import {
  applyDesignSystemToScreens,
  editScreen,
  ensureProjectDesignSystem,
  generateScreenVariants,
} from "./stitch-screen-ops";
import { buildStitchRepairNote, buildStitchRichPagePrompt } from "./stitch-prompts";

export type StitchPipelineMode = "generate" | "edit" | "variant";

export interface StitchPipelineResult {
  pageType: RequiredPageType;
  html: string;
  htmlUrl: string;
  screenId: string;
  projectId: string;
  tokens: ExtractedTokens;
  provider: "stitch";
  validationOk: boolean;
  attempts: number;
  mode: StitchPipelineMode;
  designSystemId?: string | null;
  variantScreenIds?: string[];
}

export interface StitchPipelineOptions extends StitchClientOptions {
  existingProjectId?: string | null;
  existingScreenId?: string | null;
  feedback?: string | null;
  homeHtmlSample?: string | null;
  designSystemId?: string | null;
  mode?: StitchPipelineMode;
  variantIndex?: number;
  maxAttempts?: number;
  strictFunctional?: boolean;
}

const DEFAULT_ATTEMPTS = 2;

function modelForPage(pageType: RequiredPageType): StitchClientOptions["modelId"] {
  return pageType === "home" ? "GEMINI_3_PRO" : "GEMINI_3_FLASH";
}

function passesGate(
  pageType: RequiredPageType,
  html: string,
  strictFunctional: boolean,
): { ok: boolean; missing: string[]; htmlLength: number } {
  if (strictFunctional) {
    const v = validateStitchPageFunctional(pageType, html);
    return { ok: v.ok, missing: v.missingBlocks, htmlLength: v.htmlLength };
  }
  const v = validateStitchPageHtml(pageType, html);
  const min = STITCH_PAGE_MIN_BYTES[pageType];
  const htmlLength = html.length;
  const ok = v.ok && htmlLength >= min;
  const missing = [...v.missingBlocks];
  if (htmlLength < min) missing.push(`html<${min}`);
  return { ok, missing, htmlLength };
}

async function runGeneration(
  mode: StitchPipelineMode,
  pageType: RequiredPageType,
  prompt: string,
  opts: StitchPipelineOptions,
  projectId?: string,
): Promise<StitchGenerationResult & { variantScreenIds?: string[] }> {
  const clientOpts: StitchClientOptions = {
    ...opts,
    strict: true,
    projectId,
    pageType,
    modelId: modelForPage(pageType),
  };

  if (mode === "edit" && projectId && opts.existingScreenId) {
    return editScreen(projectId, opts.existingScreenId, prompt, clientOpts);
  }

  if (mode === "variant" && projectId && opts.existingScreenId) {
    const variants = await generateScreenVariants(
      projectId,
      opts.existingScreenId,
      prompt || "Try a different visual direction while keeping the same content and data-blocks.",
      { variantCount: Number(process.env.STITCH_VARIANT_COUNT ?? 2) },
      clientOpts,
    );
    const idx = Math.min(variants.length - 1, Math.max(0, opts.variantIndex ?? 0));
    const picked = variants[idx] ?? variants[0];
    return {
      ...picked,
      variantScreenIds: variants.map((v) => v.screenId),
    };
  }

  return generateScreen(prompt, clientOpts);
}

export async function runStitchPagePipeline(
  pageType: RequiredPageType,
  answers: WizardAnswers,
  copy: SitePageCopy,
  opts?: StitchPipelineOptions,
): Promise<StitchPipelineResult> {
  const maxAttempts = opts?.maxAttempts ?? DEFAULT_ATTEMPTS;
  const strictFunctional = opts?.strictFunctional ?? true;
  const mode = opts?.mode ?? "generate";
  let projectId = opts?.existingProjectId ?? opts?.projectId ?? undefined;
  let designSystemId = opts?.designSystemId ?? null;
  let repairNote: string | null = null;
  let last: (StitchGenerationResult & { variantScreenIds?: string[] }) | null = null;
  let homeChromeSet = Boolean(opts?.homeHtmlSample?.trim());
  const skipHomeSample = Boolean(designSystemId) || mode !== "generate";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const rawHome = opts?.homeHtmlSample?.trim() ?? null;
    const styleSample =
      pageType !== "home" && rawHome && !skipHomeSample
        ? extractHtmlStyleSample(rawHome)
        : null;

    const prompt = buildStitchRichPagePrompt(pageType, answers, copy, {
      feedback: opts?.feedback,
      homeHtmlSample: styleSample,
      repairNote,
      skipHomeSample,
    });

    last = await runGeneration(mode, pageType, prompt, opts ?? {}, projectId);

    if (last.provider !== "stitch" || !last.html.trim()) {
      throw new Error(
        `Stitch failed for ${pageType}: ${last.errorCode ?? last.provider}`,
      );
    }

    projectId = last.projectId;

    if (pageType === "home" && mode === "generate" && !designSystemId) {
      try {
        const sdk = await import("@google/stitch-sdk");
        const project = sdk.stitch.project(projectId);
        designSystemId = await ensureProjectDesignSystem(project, last.tokens, answers);
      } catch (err) {
        logger.warn("[stitch:pipeline] design system skipped", { err: String(err) });
      }
    }

    let html = last.html;
    if (pageType === "home" && html.trim() && mode === "generate") {
      try {
        setChromeSourceFromHome(sanitizeStitchHtml(html));
        homeChromeSet = true;
      } catch (err) {
        logger.warn("[stitch:pipeline] setChromeSourceFromHome failed, retrying", { err: String(err) });
      }
    } else if (homeChromeSet) {
      html = sanitizeStitchHtml(html, {
        pageType,
        applyStandardChrome: true,
      });
    }

    const gate = passesGate(pageType, html, strictFunctional);
    if (gate.ok) {
      if (designSystemId && last.screenId) {
        try {
          await applyDesignSystemToScreens(projectId, designSystemId, [last.screenId]);
        } catch (err) {
          logger.warn("[stitch:pipeline] apply design system failed", { err: String(err) });
        }
      }

      return {
        pageType,
        html,
        htmlUrl: last.htmlUrl,
        screenId: last.screenId,
        projectId: last.projectId,
        tokens: last.tokens,
        provider: "stitch",
        validationOk: true,
        attempts: attempt,
        mode,
        designSystemId,
        variantScreenIds: last.variantScreenIds,
      };
    }

    logger.warn("[stitch:pipeline] validation failed, retrying", {
      pageType,
      attempt,
      mode,
      missing: gate.missing,
      htmlLength: gate.htmlLength,
    });

    repairNote = buildStitchRepairNote(
      pageType,
      gate.missing,
      gate.htmlLength,
      STITCH_PAGE_MIN_BYTES[pageType],
    );
  }

  if (!last || last.provider !== "stitch") {
    throw new Error(`Stitch pipeline exhausted for ${pageType}`);
  }

  let html = last.html;
  if (pageType !== "home" && homeChromeSet) {
    html = sanitizeStitchHtml(html, { pageType, applyStandardChrome: true });
  }

  return {
    pageType,
    html,
    htmlUrl: last.htmlUrl,
    screenId: last.screenId,
    projectId: last.projectId,
    tokens: last.tokens,
    provider: "stitch",
    validationOk: false,
    attempts: maxAttempts,
    mode,
    designSystemId,
    variantScreenIds: last.variantScreenIds,
  };
}

/** Amostra leve da home para prompts das páginas seguintes. */
export function homeHtmlSampleFromPage(html: string): string | null {
  const sample = extractHtmlStyleSample(html);
  return sample.trim() ? sample : null;
}
