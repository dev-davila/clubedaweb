/**
 * Carrega os HTML de tmp/stitch-five/ na sessão do wizard e gera links de preview.
 *
 * Uso: npx tsx scripts/stitch-load-preview.ts [sessionId]
 */

import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { standardizeSiteChrome } from "../lib/stitch/standardize-chrome";
import { sanitizeStitchHtml } from "../lib/stitch/sanitize-stitch-html";
import { prisma } from "../lib/db";
import { REQUIRED_PAGE_TYPES, type RequiredPageType } from "../lib/themes/required-pages";
import { defaultDevOrigin } from "../lib/wizard/preview-origin";
import { previewUrlForPage } from "../lib/wizard/preview-url";
import { newPreviewToken } from "../lib/wizard/repository";
import { packSessionData, unpackSessionData } from "../lib/wizard/session-data";
import { serializeSessionStitchPages } from "../lib/wizard/stitch-session-pages";
import { WIZARD_PAGE_ORDER } from "../lib/wizard/page-flow";
import type { WizardSnapshot } from "../lib/wizard/types";

const DEFAULT_SESSION = "cmpa7p0wc0001124uxcjfxp9k";
const STITCH_DIR = join(process.cwd(), "tmp", "stitch-five");

function loadPages(): Record<RequiredPageType, string> {
  const raw = {} as Record<RequiredPageType, string>;
  for (const pageType of REQUIRED_PAGE_TYPES) {
    const path = join(STITCH_DIR, `${pageType}.html`);
    if (!existsSync(path)) {
      throw new Error(`Arquivo ausente: ${path}. Rode: npx tsx scripts/stitch-five-pages.ts`);
    }
    raw[pageType] = sanitizeStitchHtml(readFileSync(path, "utf8"));
  }
  return standardizeSiteChrome(raw, "home");
}

function projectIdFromManifest(): string {
  const manifestPath = join(STITCH_DIR, "manifest.json");
  if (!existsSync(manifestPath)) return "15792978214609424585";
  try {
    const m = JSON.parse(readFileSync(manifestPath, "utf8")) as { projectId?: string };
    return m.projectId ?? "15792978214609424585";
  } catch {
    return "15792978214609424585";
  }
}

async function main() {
  const sessionId = process.argv[2] ?? DEFAULT_SESSION;
  const origin = defaultDevOrigin();
  const pages = loadPages();
  const projectId = projectIdFromManifest();

  const row = await prisma.wizardSession.findUnique({ where: { id: sessionId } });
  if (!row) {
    console.error("Sessão não encontrada:", sessionId);
    process.exit(1);
  }

  const packed = unpackSessionData(row.data);
  const previewToken = newPreviewToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const snapshot: WizardSnapshot = {
    ...packed,
    state: "ready_to_publish",
    currentPage: null,
    approvedPages: [...WIZARD_PAGE_ORDER],
    previewToken,
    errorMessage: null,
  };

  await prisma.wizardSession.update({
    where: { id: sessionId },
    data: {
      state: "ready_to_publish",
      data: packSessionData(snapshot) as any,
      stitchProjectId: projectId,
      stitchScreenId: "stitch-five-pages",
      stitchHtmlUrl: null,
      stitchHtmlCached: pages.home.slice(0, 200_000),
      stitchPagesCached: serializeSessionStitchPages(pages) as any,
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
        `✅ **Preview Stitch** (5/5 páginas carregadas de tmp/stitch-five).\n\n` +
        WIZARD_PAGE_ORDER.map((p) => `• **${p}:** ${previewUrlForPage(origin, previewToken, p)}`).join("\n") +
        `\n\n_projectId Stitch: ${projectId}_`,
    },
  });

  const port3001 = origin.includes(":3000")
    ? origin.replace(":3000", ":3001")
    : origin;

  console.log(`\n═══ Preview Clube da Web (24h) — ${packed.answers.companyName ?? "site"} ═══\n`);
  if (port3001 !== origin) {
    console.log(`⚠️  NEXTAUTH_URL=${origin} — o Next.js costuma estar em :3001. Use os links abaixo:\n`);
  }
  console.log(`npm run dev → abra:\n`);
  for (const p of WIZARD_PAGE_ORDER) {
    console.log(`${p.padEnd(10)} ${previewUrlForPage(port3001, previewToken, p)}`);
  }
  console.log(`\nsessionId: ${sessionId}`);
  console.log(`previewToken: ${previewToken}`);
  console.log(`\nLocal (tmp): http://localhost:8765/index.html\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
