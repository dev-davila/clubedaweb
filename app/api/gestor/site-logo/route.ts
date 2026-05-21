import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { injectClientLogo } from "@/lib/stitch/inject-logo";
import {
  REQUIRED_PAGE_TYPES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";
import {
  isStitchSitePublished,
  stitchHtmlConfigKey,
} from "@/lib/stitch/published-pages";

export const dynamic = "force-dynamic";

const schema = z.object({
  logoUrl: z.string().url().or(z.literal("")),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = schema.parse(await request.json());
    const newLogo = body.logoUrl.trim();

    // Persiste o logo cadastrado em siteConfig.logo_url
    await prisma.siteConfig.upsert({
      where: { key: "logo_url" },
      update: { value: newLogo, category: "branding" },
      create: { key: "logo_url", value: newLogo, category: "branding", label: "Logo principal (URL)" },
    });

    // Se há site Stitch publicado, re-injeta o logo em cada página
    let updatedPages = 0;
    if (await isStitchSitePublished()) {
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

    return NextResponse.json({ ok: true, updatedPages, logoUrl: newLogo });
  } catch (err) {
    logger.error("[site-logo] PUT", err instanceof Error ? err.stack : String(err));
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
