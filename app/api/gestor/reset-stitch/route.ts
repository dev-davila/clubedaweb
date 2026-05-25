/**
 * Reset do site gerado pelo Wizard: apaga HTML das páginas, menu, contatos,
 * branding, redes sociais e todo o conteúdo de blog, e reseta as WizardSessions.
 *
 * DESTRUTIVO — exige body { confirm: true } pra evitar disparo acidental.
 * Usado quando o gestor quer recomeçar o site do zero (ex.: testar com outra
 * empresa, ou descartar uma geração ruim).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const schema = z.object({ confirm: z.literal(true) });

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "confirm_required", message: "Envie { confirm: true } pra confirmar o reset destrutivo." },
        { status: 400 },
      );
    }

    const deleted: Record<string, number> = {};

    deleted.blogPostTags = (await prisma.blogPostTag.deleteMany({})).count;
    deleted.blogTags = (await prisma.blogTag.deleteMany({})).count;
    deleted.blogPosts = (await prisma.blogPost.deleteMany({})).count;
    deleted.blogCategories = (await prisma.blogCategory.deleteMany({})).count;
    deleted.blogAuthors = (await prisma.blogAuthor.deleteMany({})).count;

    const keys = await prisma.siteConfig.findMany({
      where: {
        OR: [
          { key: { startsWith: "stitch_html_" } },
          { key: "stitch_menu_items" },
          { key: "stitch_project_id" },
          { key: "site_render_mode" },
          { key: "logo_url" },
          { key: "favicon_url" },
          { key: "og_image_url" },
          { key: { startsWith: "contact_" } },
          { key: "company_name" },
          { key: { startsWith: "social_" } },
        ],
      },
    });
    deleted.siteConfigs = (
      await prisma.siteConfig.deleteMany({ where: { key: { in: keys.map((r) => r.key) } } })
    ).count;

    deleted.wizardMessages = (await prisma.wizardMessage.deleteMany({})).count;
    deleted.wizardSessions = (await prisma.wizardSession.deleteMany({})).count;

    logger.info("[reset-stitch] site resetado", deleted);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    logger.error("[reset-stitch] POST", err instanceof Error ? err.stack : String(err));
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
