import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  REQUIRED_PAGE_TYPES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";
import { stitchHtmlConfigKey } from "@/lib/stitch/published-pages";

export const dynamic = "force-dynamic";

function parsePageType(raw: string): RequiredPageType | null {
  if (REQUIRED_PAGE_TYPES.includes(raw as RequiredPageType)) {
    return raw as RequiredPageType;
  }
  return null;
}

const putSchema = z.object({
  html: z.string().min(50).max(500_000),
});

interface Params {
  params: { pageType: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const pageType = parsePageType(params.pageType);
  if (!pageType) return NextResponse.json({ error: "invalid_page" }, { status: 400 });
  const row = await prisma.siteConfig.findUnique({ where: { key: stitchHtmlConfigKey(pageType) } });
  return NextResponse.json({ pageType, html: row?.value ?? "", bytes: row?.value?.length ?? 0 });
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const pageType = parsePageType(params.pageType);
    if (!pageType) return NextResponse.json({ error: "invalid_page" }, { status: 400 });
    const body = putSchema.parse(await request.json());

    // Backup do estado atual antes de sobrescrever
    const current = await prisma.siteConfig.findUnique({ where: { key: stitchHtmlConfigKey(pageType) } });
    if (current?.value) {
      await prisma.siteConfig.upsert({
        where: { key: `${stitchHtmlConfigKey(pageType)}_prev` },
        update: { value: current.value, category: "wizard" },
        create: {
          key: `${stitchHtmlConfigKey(pageType)}_prev`,
          value: current.value,
          category: "wizard",
          label: `${current.label ?? pageType} (versão anterior — antes da edição manual)`,
        },
      });
    }

    await prisma.siteConfig.upsert({
      where: { key: stitchHtmlConfigKey(pageType) },
      update: { value: body.html.slice(0, 180_000), category: "wizard" },
      create: {
        key: stitchHtmlConfigKey(pageType),
        value: body.html.slice(0, 180_000),
        category: "wizard",
        label: `HTML Stitch — ${pageType} (editado)`,
      },
    });

    return NextResponse.json({ ok: true, bytes: body.html.length });
  } catch (err) {
    logger.error("[stitch-page] PUT", err instanceof Error ? err.stack : String(err));
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
