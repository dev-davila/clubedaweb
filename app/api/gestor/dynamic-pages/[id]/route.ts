export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Obter página por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const page = await prisma.dynamicPage.findUnique({
      where: { id },
      include: { children: true, parent: { select: { id: true, title: true, slug: true } } }
    });

    if (!page) return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    return NextResponse.json(page);
  } catch (error) {
    console.error("[DYNAMIC-PAGES] GET by ID error:", error);
    return NextResponse.json({ error: "Erro ao buscar página" }, { status: 500 });
  }
}

// PUT - Atualizar página
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const data = await request.json();

    // Check slug uniqueness if changed
    if (data.slug) {
      const existing = await prisma.dynamicPage.findFirst({
        where: { slug: data.slug, id: { not: id } }
      });
      if (existing) {
        return NextResponse.json({ error: "Já existe outra página com esse slug" }, { status: 409 });
      }
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.pageType !== undefined) updateData.pageType = data.pageType;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.parentId !== undefined) updateData.parentId = data.parentId || null;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.layoutConfig !== undefined) updateData.layoutConfig = typeof data.layoutConfig === 'string' ? data.layoutConfig : JSON.stringify(data.layoutConfig);
    
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "PUBLISHED" && !data.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const page = await prisma.dynamicPage.update({ where: { id }, data: updateData });
    return NextResponse.json(page);
  } catch (error) {
    console.error("[DYNAMIC-PAGES] PUT error:", error);
    return NextResponse.json({ error: "Erro ao atualizar página" }, { status: 500 });
  }
}

// DELETE - Excluir página
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    
    // Remove children references first
    await prisma.dynamicPage.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    });

    await prisma.dynamicPage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DYNAMIC-PAGES] DELETE error:", error);
    return NextResponse.json({ error: "Erro ao excluir página" }, { status: 500 });
  }
}
