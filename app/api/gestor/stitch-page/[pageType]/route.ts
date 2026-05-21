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
import {
  extractChromeFromHome,
  replaceChromeInHtml,
} from "@/lib/stitch/standardize-chrome";

export const dynamic = "force-dynamic";

function safeExtractChrome(html: string) {
  try {
    return extractChromeFromHome(html);
  } catch {
    return null;
  }
}

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

    // Header e footer são globais — se mudaram nessa página, propaga
    // automaticamente pras outras 4. Detecta por diff do chrome contra o
    // backup imediatamente anterior.
    let propagated: RequiredPageType[] = [];
    try {
      const newChrome = extractChromeFromHome(body.html);
      const prevChrome = current?.value ? safeExtractChrome(current.value) : null;
      const headerChanged = !prevChrome || newChrome.headerShell !== prevChrome.headerShell;
      const footerChanged = !prevChrome || newChrome.footer !== prevChrome.footer;
      if (headerChanged || footerChanged) {
        for (const target of REQUIRED_PAGE_TYPES) {
          if (target === pageType) continue;
          const targetRow = await prisma.siteConfig.findUnique({
            where: { key: stitchHtmlConfigKey(target) },
          });
          if (!targetRow?.value?.trim()) continue;
          // Backup antes de propagar
          await prisma.siteConfig.upsert({
            where: { key: `${stitchHtmlConfigKey(target)}_prev` },
            update: { value: targetRow.value, category: "wizard" },
            create: {
              key: `${stitchHtmlConfigKey(target)}_prev`,
              value: targetRow.value,
              category: "wizard",
              label: `${targetRow.label ?? target} (anterior)`,
            },
          });
          const updated = replaceChromeInHtml(
            targetRow.value,
            newChrome.headerShell,
            newChrome.footer,
          );
          if (updated !== targetRow.value) {
            await prisma.siteConfig.update({
              where: { key: targetRow.key },
              data: { value: updated.slice(0, 180_000) },
            });
            propagated.push(target);
          }
        }
      }
    } catch (err) {
      logger.warn("[stitch-page] propagação chrome falhou: " + String(err));
    }

    return NextResponse.json({ ok: true, bytes: body.html.length, propagated });
  } catch (err) {
    logger.error("[stitch-page] PUT", err instanceof Error ? err.stack : String(err));
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
