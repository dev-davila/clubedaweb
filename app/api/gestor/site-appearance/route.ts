/**
 * Endpoint unificado pra editar imagens (logo/favicon/og) e redes sociais.
 * Persiste em SiteConfig. Quando o logo muda, re-injeta no HTML salvo (igual
 * o /api/gestor/site-logo legado). Favicon/og/sociais aplicam no render path.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { injectClientLogo } from "@/lib/stitch/inject-logo";
import {
  isStitchSitePublished,
  stitchHtmlConfigKey,
} from "@/lib/stitch/published-pages";
import {
  REQUIRED_PAGE_TYPES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";

export const dynamic = "force-dynamic";

const FIELDS = [
  // Imagens
  { key: "logo_url", label: "Logo principal", category: "branding" },
  { key: "favicon_url", label: "Favicon", category: "branding" },
  { key: "og_image_url", label: "Imagem OG (compartilhamento)", category: "branding" },
  // Redes sociais
  { key: "social_instagram", label: "Instagram", category: "social" },
  { key: "social_facebook", label: "Facebook", category: "social" },
  { key: "social_linkedin", label: "LinkedIn", category: "social" },
  { key: "social_youtube", label: "YouTube", category: "social" },
  { key: "social_tiktok", label: "TikTok", category: "social" },
] as const;

const SCHEMA_SHAPE = Object.fromEntries(
  FIELDS.map((f) => [f.key, z.string().max(500).optional()]),
);
const schema = z.object(SCHEMA_SHAPE);

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = schema.parse(await request.json());

    const previousLogoRow = await prisma.siteConfig.findUnique({ where: { key: "logo_url" } });
    const previousLogo = previousLogoRow?.value?.trim() ?? "";

    // Persiste cada campo (incluindo strings vazias — significa "limpar")
    for (const def of FIELDS) {
      const raw = (body as Record<string, string | undefined>)[def.key];
      if (raw === undefined) continue;
      const value = raw.trim();
      await prisma.siteConfig.upsert({
        where: { key: def.key },
        update: { value, category: def.category },
        create: { key: def.key, value, category: def.category, label: def.label },
      });
    }

    // Re-injetar logo no HTML salvo (caso tenha mudado) — favicon/og/sociais
    // aplicam-se no render path, sem persistência.
    let updatedPages = 0;
    const newLogo = body.logo_url?.trim() ?? "";
    if (newLogo !== previousLogo && (await isStitchSitePublished())) {
      const wizardSession = await prisma.wizardSession.findFirst({
        where: { state: "published" },
        orderBy: { updatedAt: "desc" },
      });
      const answers = (wizardSession?.data as { answers?: Record<string, unknown> } | null)
        ?.answers as { companyName?: string } | undefined;

      for (const pageType of REQUIRED_PAGE_TYPES as readonly RequiredPageType[]) {
        const row = await prisma.siteConfig.findUnique({
          where: { key: stitchHtmlConfigKey(pageType) },
        });
        if (!row?.value?.trim()) continue;
        const next = newLogo
          ? injectClientLogo(row.value, newLogo, answers ?? {})
          : row.value;
        if (next !== row.value) {
          await prisma.siteConfig.update({
            where: { key: row.key },
            data: { value: next },
          });
          updatedPages++;
        }
      }
    }

    return NextResponse.json({ ok: true, updatedPages });
  } catch (err) {
    logger.error("[site-appearance] PUT", err instanceof Error ? err.stack : String(err));
    const msg = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: "internal_error", message: msg.slice(0, 200) }, { status: 500 });
  }
}
