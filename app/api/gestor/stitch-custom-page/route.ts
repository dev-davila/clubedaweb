import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  generateCustomPage,
  isReservedSlug,
  normalizeSlug,
} from "@/lib/stitch/custom-page-generator";
import {
  getStitchMenuItems,
  saveStitchMenuItems,
  type StitchMenuItem,
} from "@/lib/stitch/menu-items";
import { stitchCustomHtmlConfigKey } from "@/lib/stitch/published-pages";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

const schema = z.object({
  slug: z.string().min(2).max(60),
  prompt: z.string().min(8).max(1000),
  addToMenu: z.boolean().optional(),
  menuLabel: z.string().max(40).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = schema.parse(await request.json());
    const slug = normalizeSlug(body.slug);
    if (!slug || isReservedSlug(slug)) {
      return NextResponse.json({ error: "slug_reserved_or_invalid", slug }, { status: 400 });
    }

    // Pega sessão published mais recente pra reusar projectId + answers
    const wizardSession = await prisma.wizardSession.findFirst({
      where: { state: "published" },
      orderBy: { updatedAt: "desc" },
    });
    if (!wizardSession) {
      return NextResponse.json({ error: "no_published_site" }, { status: 400 });
    }
    const answers = (wizardSession.data as { answers?: Record<string, unknown> } | null)?.answers ?? {};

    const logoRow = await prisma.siteConfig.findUnique({ where: { key: "logo_url" } }).catch(() => null);

    const result = await generateCustomPage({
      projectId: wizardSession.stitchProjectId ?? null,
      slug,
      userPrompt: body.prompt,
      answers: answers as Record<string, never>,
      logoUrl: logoRow?.value ?? null,
    });

    await prisma.siteConfig.upsert({
      where: { key: stitchCustomHtmlConfigKey(slug) },
      update: {
        value: result.html,
        category: "wizard",
        label: `HTML Stitch — /${slug} (custom)`,
      },
      create: {
        key: stitchCustomHtmlConfigKey(slug),
        value: result.html,
        category: "wizard",
        label: `HTML Stitch — /${slug} (custom)`,
      },
    });

    // Adiciona ao menu se solicitado — insere antes do item "contact"
    if (body.addToMenu !== false) {
      const items = await getStitchMenuItems();
      const exists = items.some((i) => i.route === `/${slug}`);
      if (!exists) {
        const label = (body.menuLabel || slug.replace(/-/g, " "))
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .slice(0, 40);
        const newItem: StitchMenuItem = {
          type: "custom",
          label,
          route: `/${slug}`,
          order: items.length,
          visible: true,
        };
        // Insere antes do Contact se possível
        const contactIdx = items.findIndex((i) => i.type === "contact");
        const inserted = contactIdx >= 0
          ? [...items.slice(0, contactIdx), newItem, ...items.slice(contactIdx)]
          : [...items, newItem];
        // Reaplica orders sequenciais
        const reordered = inserted.map((i, idx) => ({ ...i, order: idx }));
        try {
          await saveStitchMenuItems(reordered);
        } catch (err) {
          logger.warn("[stitch-custom-page] add to menu falhou: " + String(err));
        }
      }
    }

    return NextResponse.json({
      ok: true,
      slug,
      bytes: result.html.length,
      previewUrl: `/${slug}`,
      editUrl: `/gestor/editor/stitch/${slug}`,
    });
  } catch (err) {
    logger.error("[stitch-custom-page] POST", err instanceof Error ? err.stack : String(err));
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: "generation_failed", message: message.slice(0, 200) }, { status: 500 });
  }
}
