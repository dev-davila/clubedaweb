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
import {
  stitchHtmlConfigKey,
  stitchCustomHtmlConfigKey,
} from "@/lib/stitch/published-pages";
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

/** Resolve o identificador da URL pra:
 *  - { kind: "required", pageType } quando é uma das 5 obrigatórias (home/about/...)
 *  - { kind: "custom", slug } quando é uma página criada via chat
 *  - null quando inválido
 */
function resolvePageId(raw: string):
  | { kind: "required"; pageType: RequiredPageType }
  | { kind: "custom"; slug: string }
  | null {
  if (REQUIRED_PAGE_TYPES.includes(raw as RequiredPageType)) {
    return { kind: "required", pageType: raw as RequiredPageType };
  }
  if (/^[a-z0-9-]{2,60}$/.test(raw)) {
    return { kind: "custom", slug: raw };
  }
  return null;
}

function configKeyFor(id: { kind: "required"; pageType: RequiredPageType } | { kind: "custom"; slug: string }): string {
  return id.kind === "required"
    ? stitchHtmlConfigKey(id.pageType)
    : stitchCustomHtmlConfigKey(id.slug);
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
  const id = resolvePageId(params.pageType);
  if (!id) return NextResponse.json({ error: "invalid_page" }, { status: 400 });
  const row = await prisma.siteConfig.findUnique({ where: { key: configKeyFor(id) } });
  return NextResponse.json({ pageType: params.pageType, html: row?.value ?? "", bytes: row?.value?.length ?? 0 });
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const id = resolvePageId(params.pageType);
    if (!id) return NextResponse.json({ error: "invalid_page" }, { status: 400 });
    const body = putSchema.parse(await request.json());
    const key = configKeyFor(id);

    // Backup do estado atual antes de sobrescrever
    const current = await prisma.siteConfig.findUnique({ where: { key } });
    if (current?.value) {
      await prisma.siteConfig.upsert({
        where: { key: `${key}_prev` },
        update: { value: current.value, category: "wizard" },
        create: {
          key: `${key}_prev`,
          value: current.value,
          category: "wizard",
          label: `${current.label ?? params.pageType} (versão anterior — antes da edição manual)`,
        },
      });
    }

    await prisma.siteConfig.upsert({
      where: { key },
      update: { value: body.html.slice(0, 180_000), category: "wizard" },
      create: {
        key,
        value: body.html.slice(0, 180_000),
        category: "wizard",
        label: `HTML Stitch — ${params.pageType} (editado)`,
      },
    });

    // Header e footer são globais — se mudaram nessa página, propaga
    // automaticamente pras outras 4 obrigatórias + páginas custom.
    let propagated: string[] = [];
    if (id.kind === "required") {
      try {
        const newChrome = extractChromeFromHome(body.html);
        const prevChrome = current?.value ? safeExtractChrome(current.value) : null;
        const headerChanged = !prevChrome || newChrome.headerShell !== prevChrome.headerShell;
        const footerChanged = !prevChrome || newChrome.footer !== prevChrome.footer;
        if (headerChanged || footerChanged) {
          // 4 obrigatórias restantes
          for (const target of REQUIRED_PAGE_TYPES) {
            if (target === id.pageType) continue;
            const targetKey = stitchHtmlConfigKey(target);
            const targetRow = await prisma.siteConfig.findUnique({ where: { key: targetKey } });
            if (!targetRow?.value?.trim()) continue;
            await prisma.siteConfig.upsert({
              where: { key: `${targetKey}_prev` },
              update: { value: targetRow.value, category: "wizard" },
              create: {
                key: `${targetKey}_prev`,
                value: targetRow.value,
                category: "wizard",
                label: `${targetRow.label ?? target} (anterior)`,
              },
            });
            const updated = replaceChromeInHtml(targetRow.value, newChrome.headerShell, newChrome.footer);
            if (updated !== targetRow.value) {
              await prisma.siteConfig.update({ where: { key: targetKey }, data: { value: updated.slice(0, 180_000) } });
              propagated.push(target);
            }
          }
          // Páginas custom
          const customRows = await prisma.siteConfig.findMany({
            where: { key: { startsWith: "stitch_html_custom_" } },
          });
          for (const r of customRows) {
            if (!r.value?.trim()) continue;
            const updated = replaceChromeInHtml(r.value, newChrome.headerShell, newChrome.footer);
            if (updated !== r.value) {
              await prisma.siteConfig.update({ where: { key: r.key }, data: { value: updated.slice(0, 180_000) } });
              propagated.push(r.key.replace("stitch_html_custom_", "/"));
            }
          }
        }
      } catch (err) {
        logger.warn("[stitch-page] propagação chrome falhou: " + String(err));
      }
    }

    return NextResponse.json({ ok: true, bytes: body.html.length, propagated });
  } catch (err) {
    logger.error("[stitch-page] PUT", err instanceof Error ? err.stack : String(err));
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
