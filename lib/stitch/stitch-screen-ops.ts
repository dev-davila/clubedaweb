import { logger } from "@/lib/logger";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import { detectUserColorMode } from "@/lib/wizard/design-themes";
import type { ExtractedTokens, WizardAnswers } from "@/lib/wizard/types";
import {
  fetchHtml,
  pollScreenHtmlUrl,
  type StitchClientOptions,
  type StitchGenerationResult,
  StitchGenerationError,
} from "./client";
import { sanitizeStitchHtml } from "./sanitize-stitch-html";
import { withStitchRetry } from "./stitch-retry";

type StitchSdk = typeof import("@google/stitch-sdk");
type Project = import("@google/stitch-sdk").Project;
type Screen = import("@google/stitch-sdk").Screen;

async function loadSdk(): Promise<StitchSdk> {
  const sdk = await import("@google/stitch-sdk");
  return sdk;
}

async function resolveProject(
  stitch: StitchSdk["stitch"],
  projectId: string,
): Promise<Project> {
  return stitch.project(projectId);
}

async function screenToResult(
  screen: Screen,
  projectId: string,
  pageType: RequiredPageType,
  started: number,
): Promise<StitchGenerationResult> {
  const htmlUrl = await pollScreenHtmlUrl(screen, {
    pageType,
    screenId: screen.id,
  });
  const html = sanitizeStitchHtml(await fetchHtml(htmlUrl));
  const { extractTokensFromHtml } = await import("./theme-extractor");
  return {
    projectId,
    screenId: screen.id,
    htmlUrl,
    html,
    tokens: extractTokensFromHtml(html),
    durationMs: Date.now() - started,
    provider: "stitch",
  };
}

export async function editScreen(
  projectId: string,
  screenId: string,
  prompt: string,
  opts?: StitchClientOptions,
): Promise<StitchGenerationResult> {
  const started = Date.now();
  const pageType = opts?.pageType ?? "home";
  const sdk = await loadSdk();

  return withStitchRetry("editScreen", async () => {
    const project = await resolveProject(sdk.stitch, projectId);
    const screen = project.screen(screenId);
    const edited = await screen.edit(
      prompt,
      opts?.device ?? "DESKTOP",
      opts?.modelId ?? "GEMINI_3_FLASH",
    );
    return screenToResult(edited, projectId, pageType, started);
  });
}

export interface VariantOptions {
  variantCount?: number;
  creativeRange?: "REFINE" | "EXPLORE" | "REIMAGINE";
  aspects?: Array<"LAYOUT" | "COLOR_SCHEME" | "IMAGES" | "TEXT_FONT" | "TEXT_CONTENT">;
}

export async function generateScreenVariants(
  projectId: string,
  screenId: string,
  prompt: string,
  variantOptions?: VariantOptions,
  opts?: StitchClientOptions,
): Promise<StitchGenerationResult[]> {
  const pageType = opts?.pageType ?? "home";
  const count = variantOptions?.variantCount ?? Number(process.env.STITCH_VARIANT_COUNT ?? 2);
  const sdk = await loadSdk();

  return withStitchRetry("variants", async () => {
    const project = await resolveProject(sdk.stitch, projectId);
    const screen = project.screen(screenId);
    const variantOpts = {
      variantCount: Math.min(5, Math.max(1, count)),
      creativeRange: variantOptions?.creativeRange ?? "EXPLORE",
      aspects: variantOptions?.aspects ?? (["COLOR_SCHEME", "LAYOUT"] as const),
    };
    const variants = await screen.variants(
      prompt,
      variantOpts as Parameters<Screen["variants"]>[1],
      opts?.device ?? "DESKTOP",
      opts?.modelId ?? "GEMINI_3_FLASH",
    );

    const started = Date.now();
    const results: StitchGenerationResult[] = [];
    for (const v of variants) {
      results.push(await screenToResult(v, projectId, pageType, started));
    }
    return results;
  });
}

function tokensToDesignTheme(
  tokens: ExtractedTokens,
  userMode?: "dark" | "light" | null,
): Record<string, unknown> {
  // userMode (do answers.colors) tem prioridade sobre o que o extractor detectou
  // no HTML — caso o Stitch tenha desobedecido o pedido na primeira geração.
  const effectiveMode = userMode ?? tokens.colorMode;
  const isDark = effectiveMode === "dark";
  // Mapa de fonte → enum do Stitch SDK
  const fontHint = (tokens.fontHeading || "").toLowerCase();
  const headlineFont = fontHint.includes("playfair")
    ? "PLAYFAIR_DISPLAY"
    : fontHint.includes("fraunces")
      ? "FRAUNCES"
      : fontHint.includes("space grotesk")
        ? "SPACE_GROTESK"
        : fontHint.includes("dm serif")
          ? "DM_SERIF_DISPLAY"
          : fontHint.includes("source serif")
            ? "SOURCE_SERIF_PRO"
            : fontHint.includes("newsreader")
              ? "NEWSREADER"
              : "INTER";
  return {
    colorMode: isDark ? "DARK" : "LIGHT",
    overridePrimaryColor: tokens.primaryColor,
    overrideSecondaryColor: tokens.secondaryColor,
    overrideTertiaryColor: tokens.accentColor,
    overrideNeutralColor: tokens.surfaceColor,
    backgroundLight: isDark ? undefined : tokens.backgroundColor,
    backgroundDark: isDark ? tokens.backgroundColor : undefined,
    bodyFont: "INTER",
    headlineFont,
    roundness: tokens.borderRadius.includes("full")
      ? "ROUND_FULL"
      : tokens.borderRadius.includes("xl")
        ? "ROUND_TWELVE"
        : "ROUND_EIGHT",
    description: `Institutional site — ${tokens.styleType}`,
  };
}

export async function ensureProjectDesignSystem(
  project: Project,
  tokens: ExtractedTokens,
  answers: WizardAnswers,
): Promise<string> {
  const company = answers.companyName?.trim() || "Site";
  const input = {
    displayName: `${company} — design system`,
    styleGuidelines: [
      `Tom: ${answers.tone ?? "corporativo"}.`,
      `Segmento: ${answers.industry ?? ""}.`,
      "Site institucional desktop-first, HTML Tailwind CDN.",
      answers.colors ? `Cores: ${answers.colors}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    theme: tokensToDesignTheme(tokens, detectUserColorMode(answers.colors)),
    designTokens: JSON.stringify({
      primary: tokens.primaryColor,
      secondary: tokens.secondaryColor,
      accent: tokens.accentColor,
      fontPrimary: tokens.fontPrimary,
      fontHeading: tokens.fontHeading,
    }),
  };

  const existing = await project.listDesignSystems();
  if (existing.length > 0) {
    return existing[0].id;
  }

  const ds = await withStitchRetry("createDesignSystem", () =>
    project.createDesignSystem(input as Parameters<Project["createDesignSystem"]>[0]),
  );
  logger.info("[stitch] design system created", { assetId: ds.id, projectId: project.id });
  return ds.id;
}

export async function applyDesignSystemToScreens(
  projectId: string,
  designSystemId: string,
  screenIds: string[],
): Promise<void> {
  if (screenIds.length === 0) return;
  const sdk = await loadSdk();
  const project = await resolveProject(sdk.stitch, projectId);

  // Apply design system espera:
  //  - id: id da SCREEN INSTANCE (NÃO o id do screen) — vem de project.data.screenInstances[]
  //  - sourceScreen: resource name no formato `projects/{projectId}/screens/{screenId}`
  // Buscamos o project data fresh pra pegar instances dos screens recém-gerados.
  const projects = await sdk.stitch.projects();
  const fullProject = projects.find((p) => p.id === projectId);
  const screenInstances: Array<{ id?: string; sourceScreen?: string }> =
    (fullProject?.data?.screenInstances as Array<{ id?: string; sourceScreen?: string }>) ?? [];

  const instances: { id: string; sourceScreen: string }[] = [];
  for (const screenId of screenIds) {
    const expectedSource = `projects/${projectId}/screens/${screenId}`;
    // Encontra instance cujo sourceScreen aponta pro screenId
    const inst = screenInstances.find((si) => si.sourceScreen === expectedSource);
    if (!inst?.id) {
      logger.warn("[stitch] no screenInstance found for screen", {
        screenId,
        projectId,
        availableInstances: screenInstances.length,
      });
      continue;
    }
    instances.push({ id: inst.id, sourceScreen: expectedSource });
  }
  if (instances.length === 0) {
    logger.warn("[stitch] applyDesignSystem skipped — no resolvable instances");
    return;
  }
  const ds = project.designSystem(designSystemId);
  await withStitchRetry("applyDesignSystem", () => ds.apply(instances));
}

export { StitchGenerationError } from "./client";
export { withStitchRetry } from "./stitch-retry";
