import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/gestor/solucoes/categorias - List all solution categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const categories = await prisma.solutionCategory.findMany({
      orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Error fetching solution categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/gestor/solucoes/categorias - Create a new category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { slug, label, subtitle, displayOrder, gridCols, bgVariant, defaultCardVariant, parentSlug, partnerLogos } = body;

    if (!slug || !label) {
      return NextResponse.json({ error: "slug e label são obrigatórios" }, { status: 400 });
    }

    const existing = await prisma.solutionCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    const category = await prisma.solutionCategory.create({
      data: {
        slug,
        label,
        subtitle: subtitle || null,
        displayOrder: displayOrder ?? 0,
        gridCols: gridCols ?? 3,
        bgVariant: bgVariant || "white",
        defaultCardVariant: defaultCardVariant || "card",
        parentSlug: parentSlug || null,
        partnerLogos: partnerLogos || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating solution category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
