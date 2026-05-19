/**
 * Reprocessa HTML em cache (Tailwind + cores) sem regerar via LLM.
 * npx tsx scripts/wizard-refresh-preview-html.ts [sessionId]
 */
import "dotenv/config";
import { prisma } from "../lib/db";
import { ensurePreviewHtml } from "../lib/ai-site/ensure-preview-html";
import { REQUIRED_PAGE_TYPES } from "../lib/themes/required-pages";
import { serializeSessionStitchPages } from "../lib/wizard/stitch-session-pages";
import { parseSessionStitchPages } from "../lib/wizard/stitch-session-pages";

const sessionId = process.argv[2] ?? "cmpa7p0wc0001124uxcjfxp9k";

async function main() {
  const row = await prisma.wizardSession.findUnique({ where: { id: sessionId } });
  if (!row?.previewToken) throw new Error("Sessão sem preview");

  const pages = parseSessionStitchPages(row);
  const out: Record<string, string> = {};
  for (const t of REQUIRED_PAGE_TYPES) {
    const raw = pages[t];
    if (raw) out[t] = ensurePreviewHtml(raw);
  }

  await prisma.wizardSession.update({
    where: { id: sessionId },
    data: {
      stitchPagesCached: serializeSessionStitchPages(out) as any,
      stitchHtmlCached: out.home?.slice(0, 200_000),
    },
  });

  const origin = (process.env.NEXTAUTH_URL ?? "http://localhost:3001").replace(/\/$/, "");
  console.log(`OK — ${Object.keys(out).length} páginas\n${origin}/preview/${row.previewToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
