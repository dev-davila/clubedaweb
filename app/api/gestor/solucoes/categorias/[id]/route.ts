import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET single category
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const category = await prisma.solutionCategory.findUnique({ where: { id: params.id } });
    if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update category
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { slug, label, subtitle, displayOrder, gridCols, bgVariant, defaultCardVariant, parentSlug, partnerLogos, active } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await prisma.solutionCategory.findFirst({
        where: { slug, id: { not: params.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
      }
    }

    const data: any = {};
    if (slug !== undefined) data.slug = slug;
    if (label !== undefined) data.label = label;
    if (subtitle !== undefined) data.subtitle = subtitle || null;
    if (displayOrder !== undefined) data.displayOrder = displayOrder;
    if (gridCols !== undefined) data.gridCols = gridCols;
    if (bgVariant !== undefined) data.bgVariant = bgVariant;
    if (defaultCardVariant !== undefined) data.defaultCardVariant = defaultCardVariant;
    if (parentSlug !== undefined) data.parentSlug = parentSlug || null;
    if (partnerLogos !== undefined) data.partnerLogos = partnerLogos;
    if (active !== undefined) data.active = active;

    const category = await prisma.solutionCategory.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Error updating solution category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // Check if any solutions use this category
    const cat = await prisma.solutionCategory.findUnique({ where: { id: params.id } });
    if (!cat) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });

    const solutionsCount = await prisma.solution.count({ where: { category: cat.slug } });
    if (solutionsCount > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: ${solutionsCount} solução(ões) usam esta categoria. Mova-as para outra categoria antes.` },
        { status: 400 }
      );
    }

    await prisma.solutionCategory.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting solution category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
