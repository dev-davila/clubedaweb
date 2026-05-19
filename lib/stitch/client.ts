import { validateStitchPageHtml } from "@/lib/cms/site-block-standard";
import { logger } from "@/lib/logger";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import type { ExtractedTokens } from "@/lib/wizard/types";
import { sanitizeStitchHtml } from "./sanitize-stitch-html";
import { withStitchRetry } from "./stitch-retry";
import { extractTokensFromHtml, fallbackTokens } from "./theme-extractor";

export type StitchProvider = "stitch" | "fallback" | "stitch_failed";

export interface StitchGenerationResult {
  projectId: string;
  screenId: string;
  htmlUrl: string;
  html: string;
  tokens: ExtractedTokens;
  durationMs: number;
  provider: StitchProvider;
  errorCode?: string;
}

export class StitchGenerationError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string,
    public readonly pageType?: RequiredPageType,
  ) {
    super(message);
    this.name = "StitchGenerationError";
  }
}

type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "AGNOSTIC";

export interface StitchClientOptions {
  apiKey?: string;
  projectId?: string;
  device?: DeviceType;
  modelId?: "GEMINI_3_PRO" | "GEMINI_3_FLASH" | "GEMINI_3_1_PRO";
  pageType?: RequiredPageType;
  /** Se true, falhas da API propagam exceção (sem fallback silencioso). */
  strict?: boolean;
}

function apiKeyFromEnv(opts?: StitchClientOptions): string | null {
  return opts?.apiKey ?? process.env.STITCH_API_KEY ?? null;
}

function projectIdFromEnv(opts?: StitchClientOptions): string | null {
  return opts?.projectId ?? process.env.STITCH_PROJECT_ID ?? null;
}

const FETCH_HTML_TIMEOUT_MS = 60_000;
const FETCH_HTML_RETRIES = 2;
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_POLL_MAX_MS = 90_000;

function pollIntervalMs(): number {
  const n = Number(process.env.STITCH_HTML_POLL_INTERVAL_MS ?? DEFAULT_POLL_INTERVAL_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_POLL_INTERVAL_MS;
}

function pollMaxMs(): number {
  const n = Number(process.env.STITCH_HTML_POLL_MAX_MS ?? DEFAULT_POLL_MAX_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_POLL_MAX_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchHtml(url: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < FETCH_HTML_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_HTML_TIMEOUT_MS);
      const res = await fetch(url, { cache: "no-store", signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Failed to fetch HTML (${res.status})`);
      const text = await res.text();
      if (text.trim().length < 200) {
        throw new Error(`HTML too short (${text.trim().length} chars)`);
      }
      return text;
    } catch (err) {
      lastErr = err;
      if (attempt < FETCH_HTML_RETRIES - 1) {
        await sleep(1_500);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Poll até `screen.getHtml()` retornar URL não vazia. */
export async function pollScreenHtmlUrl(
  screen: { getHtml: () => Promise<string | undefined | null> },
  ctx: { pageType?: RequiredPageType; screenId?: string } = {},
): Promise<string> {
  const maxMs = pollMaxMs();
  const interval = pollIntervalMs();
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < maxMs) {
    attempt += 1;
    const raw = await screen.getHtml();
    const htmlUrl = raw?.trim() ?? "";
    if (htmlUrl) {
      logger.info("[stitch] htmlUrl ready", {
        pageType: ctx.pageType,
        screenId: ctx.screenId,
        attempt,
        htmlUrl: htmlUrl.slice(0, 120),
        durationMs: Date.now() - started,
      });
      return htmlUrl;
    }
    logger.info("[stitch] htmlUrl empty, polling…", {
      pageType: ctx.pageType,
      attempt,
      elapsedMs: Date.now() - started,
    });
    await sleep(interval);
  }

  throw new StitchGenerationError(
    `Stitch htmlUrl empty after ${maxMs}ms (${attempt} attempts)`,
    "HTML_URL_TIMEOUT",
    ctx.pageType,
  );
}

async function loadSdk(): Promise<typeof import("@google/stitch-sdk") | null> {
  try {
    return await import("@google/stitch-sdk");
  } catch (err) {
    logger.warn("[stitch] SDK not installed", { err: String(err) });
    return null;
  }
}

async function resolveProject(
  stitch: typeof import("@google/stitch-sdk").stitch,
  opts?: StitchClientOptions,
): Promise<import("@google/stitch-sdk").Project> {
  const existingId = projectIdFromEnv(opts);
  if (existingId) return stitch.project(existingId);
  const project = await stitch.createProject("clubedaweb-wizard");
  logger.info("[stitch] created project", { projectId: project.id });
  return project;
}

function isStrict(opts?: StitchClientOptions): boolean {
  if (opts?.strict === true) return true;
  return process.env.STITCH_STRICT === "1" || process.env.STITCH_STRICT === "true";
}

/** Gera uma tela Stitch (uma página). Reutiliza o mesmo projectId nas chamadas seguintes. */
export async function generateScreen(
  prompt: string,
  opts?: StitchClientOptions,
): Promise<StitchGenerationResult> {
  const started = Date.now();
  const apiKey = apiKeyFromEnv(opts);
  const pageType = opts?.pageType ?? "home";
  const strict = isStrict(opts);

  if (!apiKey) {
    if (strict) {
      throw new StitchGenerationError("STITCH_API_KEY missing", "MISSING_API_KEY", pageType);
    }
    logger.warn("[stitch] STITCH_API_KEY missing — using fallback theme");
    return buildFallbackResult(prompt, started);
  }

  const sdk = await loadSdk();
  if (!sdk) {
    if (strict) {
      throw new StitchGenerationError("Stitch SDK not available", "SDK_UNAVAILABLE", pageType);
    }
    return buildFallbackResult(prompt, started);
  }

  try {
    if (apiKey && process.env.STITCH_API_KEY !== apiKey) {
      process.env.STITCH_API_KEY = apiKey;
    }

    const { project, screen, htmlUrl, html } = await withStitchRetry(
      "generateScreen",
      async () => {
        const project = await resolveProject(sdk.stitch, opts);
        const screen = await project.generate(
          prompt,
          opts?.device ?? "DESKTOP",
          opts?.modelId ?? "GEMINI_3_FLASH",
        );
        const htmlUrl = await pollScreenHtmlUrl(screen, {
          pageType,
          screenId: screen.id,
        });
        const html = sanitizeStitchHtml(await fetchHtml(htmlUrl));
        return { project, screen, htmlUrl, html };
      },
    );
    const validation = validateStitchPageHtml(pageType, html);
    if (!validation.ok) {
      logger.warn("[stitch] HTML fora do padrão de blocos", {
        pageType,
        missing: validation.missingBlocks,
        featureCards: validation.featureCardCount,
        htmlLen: html.length,
      });
    }
    const tokens = extractTokensFromHtml(html);

    logger.info("[stitch] generation ok", {
      pageType,
      projectId: project.id,
      screenId: screen.id,
      htmlLen: html.length,
      durationMs: Date.now() - started,
    });

    return {
      projectId: project.id,
      screenId: screen.id,
      htmlUrl,
      html,
      tokens,
      durationMs: Date.now() - started,
      provider: "stitch",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errorCode =
      err instanceof StitchGenerationError ? err.errorCode : "GENERATION_FAILED";
    logger.error("[stitch] generation failed", {
      pageType,
      errorCode,
      message,
      durationMs: Date.now() - started,
    });

    if (strict) {
      if (err instanceof StitchGenerationError) throw err;
      throw new StitchGenerationError(message, errorCode, pageType);
    }

    return {
      projectId: projectIdFromEnv(opts) ?? "stitch_failed",
      screenId: "stitch_failed",
      htmlUrl: "",
      html: "",
      tokens: fallbackTokens(prompt),
      durationMs: Date.now() - started,
      provider: "stitch_failed",
      errorCode,
    };
  }
}

/** Compat: geração de uma única tela (home). */
export async function generateTheme(
  prompt: string,
  opts?: StitchClientOptions,
): Promise<StitchGenerationResult> {
  return generateScreen(prompt, { ...opts, pageType: "home" });
}

function buildFallbackResult(prompt: string, started: number): StitchGenerationResult {
  return {
    projectId: "fallback",
    screenId: "fallback",
    htmlUrl: "",
    html: "",
    tokens: fallbackTokens(prompt),
    durationMs: Date.now() - started,
    provider: "fallback",
  };
}
