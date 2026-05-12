export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Listar páginas dinâmicas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const pageType = searchParams.get("pageType");

    const where: any = {};
    if (status) where.status = status;
    if (pageType) where.pageType = pageType;

    const pages = await prisma.dynamicPage.findMany({
      where,
      orderBy: [{ order: "asc" }, { title: "asc" }],
      include: { children: { select: { id: true, title: true, slug: true } } }
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error("[DYNAMIC-PAGES] GET error:", error);
    return NextResponse.json({ error: "Erro ao listar páginas" }, { status: 500 });
  }
}

// POST - Criar nova página
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const data = await request.json();
    const { title, slug, pageType, content, excerpt, featuredImage, metaTitle, metaDescription, status: pageStatus, parentId, layoutConfig } = data;

    if (!title || !slug) {
      return NextResponse.json({ error: "Título e slug são obrigatórios" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.dynamicPage.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Já existe uma página com esse slug" }, { status: 409 });
    }

    const page = await prisma.dynamicPage.create({
      data: {
        title,
        slug,
        pageType: pageType || "institutional",
        content: content || "",
        excerpt,
        featuredImage,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        status: pageStatus || "DRAFT",
        parentId: parentId || null,
        layoutConfig: layoutConfig ? JSON.stringify(layoutConfig) : null,
        publishedAt: pageStatus === "PUBLISHED" ? new Date() : null
      }
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("[DYNAMIC-PAGES] POST error:", error);
    return NextResponse.json({ error: "Erro ao criar página" }, { status: 500 });
  }
}
