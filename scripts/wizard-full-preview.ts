/**
 * Gera as 5 páginas (Stitch por padrão; WIZARD_PAGE_PROVIDER=ai para LLM) e grava sessão ready_to_publish.
 *
 * Uso: npx tsx scripts/wizard-full-preview.ts [sessionId]
 * Gate Stitch isolado: npx tsx scripts/stitch-five-pages.ts
 */

import "dotenv/config";
import { prisma } from "../lib/db";
import { generateWizardPage } from "../lib/stitch/generate-site";
import { WIZARD_PAGE_ORDER } from "../lib/wizard/page-flow";
import { defaultDevOrigin } from "../lib/wizard/preview-origin";
import { previewUrlForPage } from "../lib/wizard/preview-url";
import { newPreviewToken } from "../lib/wizard/repository";
import { packSessionData, unpackSessionData } from "../lib/wizard/session-data";
import { generateSiteContent, ensureSiteCopy } from "../lib/wizard/site-content-generator";
import { serializeSessionStitchPages } from "../lib/wizard/stitch-session-pages";
import type { WizardSnapshot } from "../lib/wizard/types";
import type { RequiredPageType } from "../lib/themes/required-pages";
import type { ExtractedTokens } from "../lib/wizard/types";

const DEFAULT_SESSION = "cmpa7p0wc0001124uxcjfxp9k";

async function main() {
  const sessionId = process.argv[2] ?? DEFAULT_SESSION;
  const origin = defaultDevOrigin();

  const row = await prisma.wizardSession.findUnique({ where: { id: sessionId } });
  if (!row) {
    console.error("Sessão não encontrada:", sessionId);
    process.exit(1);
  }

  const packed = unpackSessionData(row.data);
  const answers = packed.answers;
  if (!answers.companyName) {
    console.error("Sessão sem briefing completo.");
    process.exit(1);
  }

  console.log(`Gerando 5 páginas via IA para **${answers.companyName}**…\n`);

  const copy = ensureSiteCopy(answers, await generateSiteContent(answers));
  let homeTokens: ExtractedTokens | null = null;
  let homeHtmlSample: string | null = null;
  const pages = {} as Record<RequiredPageType, string>;
  const providers: string[] = [];

  for (const pageType of WIZARD_PAGE_ORDER) {
    process.stdout.write(`  ${pageType}… `);
    const t0 = Date.now();
    const result = await generateWizardPage(pageType, answers, copy, {
      homeTokens: pageType === "home" ? null : homeTokens,
      homeHtmlSample: pageType === "home" ? null : homeHtmlSample,
    });
    pages[pageType] = result.html;
    if (pageType === "home") {
      homeTokens = result.tokens;
      homeHtmlSample = result.html;
    }
    providers.push(`${pageType}:${result.provider}`);
    console.log(`${result.provider} ${result.html.length} chars ${Date.now() - t0}ms`);
  }

  const previewToken = newPreviewToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const snapshot: WizardSnapshot = {
    state: "ready_to_publish",
    answers,
    currentPage: null,
    approvedPages: [...WIZARD_PAGE_ORDER],
    siteCopy: copy,
    extractedTokens: homeTokens,
    previewToken,
    errorMessage: null,
  };

  await prisma.wizardSession.update({
    where: { id: sessionId },
    data: {
      state: "ready_to_publish",
      data: packSessionData(snapshot) as any,
      stitchProjectId: "ai-generated",
      stitchScreenId: providers.join(","),
      stitchHtmlUrl: null,
      stitchHtmlCached: pages.home.slice(0, 200_000),
      stitchPagesCached: serializeSessionStitchPages(pages) as any,
      generatedContent: copy as any,
      extractedTokens: homeTokens as any,
      previewToken,
      previewExpiresAt: expires,
      errorMessage: null,
    },
  });

  await prisma.wizardMessage.create({
    data: {
      sessionId,
      role: "assistant",
      content:
        `✅ **Site completo gerado por IA** (5/5 páginas, padrão de blocos Clube da Web).\n\n` +
        WIZARD_PAGE_ORDER.map((p) => `• **${p}:** ${previewUrlForPage(origin, previewToken, p)}`).join("\n") +
        `\n\n_Providers: ${providers.join(" · ")}_\n\nResponda **publicar** no chat para colocar no ar.`,
    },
  });

  console.log("\n═══ Preview (24h) ═══\n");
  for (const p of WIZARD_PAGE_ORDER) {
    console.log(`${p.padEnd(10)} ${previewUrlForPage(origin, previewToken, p)}`);
  }
  console.log(`\nsessionId: ${sessionId}`);
  console.log(`providers: ${providers.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
