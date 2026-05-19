export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { listSystemPagesForMenu, dynamicPagePublicPath } from "@/lib/cms/page-url";

/** Páginas e rotas disponíveis para adicionar ao menu (estilo WordPress). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const systemPages = listSystemPagesForMenu();

    const dynamicPages = await prisma.dynamicPage.findMany({
      where: { status: { in: ["PUBLISHED", "DRAFT"] } },
      orderBy: [{ order: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        pageType: true,
        parentId: true,
      },
    });

    return NextResponse.json({
      systemPages,
      dynamicPages: dynamicPages.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        pageType: p.pageType,
        parentId: p.parentId,
        url: dynamicPagePublicPath(p.slug),
      })),
    });
  } catch (error) {
    console.error("[CMS linkable] GET error:", error);
    return NextResponse.json({ error: "Erro ao carregar páginas" }, { status: 500 });
  }
}
