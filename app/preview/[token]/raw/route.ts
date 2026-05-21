/**
 * Serve o HTML do Stitch CRU (sem wrapper Next.js, sem iframe, sem banner).
 * Resultado idêntico a abrir o arquivo localmente — fiel ao que o Stitch gerou.
 *
 * URLs:
 *   /preview/<token>/raw            → home
 *   /preview/<token>/raw?page=about → outra página
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { findByPreviewToken } from "@/lib/wizard/repository";
import { polishStitchPage } from "@/lib/stitch/polish-stitch-pages";
import { unpackSessionData } from "@/lib/wizard/session-data";
import {
  parseSessionStitchPages,
  resolvePreviewPageType,
} from "@/lib/wizard/stitch-session-pages";

export const dynamic = "force-dynamic";

interface Params {
  params: { token: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await findByPreviewToken(params.token);
  if (!session) {
    return new Response("Preview não encontrado", { status: 404 });
  }
  if (session.previewExpiresAt && session.previewExpiresAt < new Date()) {
    return new Response("Preview expirado", { status: 410 });
  }

  const url = new URL(req.url);
  const pageType = resolvePreviewPageType(url.searchParams.get("page"));
  if (!pageType) {
    return new Response("Página inválida", { status: 400 });
  }

  const pages = parseSessionStitchPages(session);
  if (!pages[pageType]?.trim()) {
    return new Response("HTML da página não disponível", { status: 404 });
  }
  const { answers } = unpackSessionData(session.data);
  const logoRow = await prisma.siteConfig.findUnique({ where: { key: "logo_url" } }).catch(() => null);
  const logoUrl = logoRow?.value?.trim() || null;
  const html = polishStitchPage(pageType, pages, { answers, logoUrl });
  if (!html) {
    return new Response("HTML da página não disponível", { status: 404 });
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
