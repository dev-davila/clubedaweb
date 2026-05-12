import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/gestor/solucoes - List all solutions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const solutions = await prisma.solution.findMany({
      where,
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }, { title: "asc" }],
    });

    return NextResponse.json(solutions);
  } catch (error: any) {
    console.error("Error fetching solutions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/gestor/solucoes - Create a new solution
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { slug, category, title, ...rest } = body;

    if (!slug || !category || !title) {
      return NextResponse.json({ error: "slug, category e title são obrigatórios" }, { status: 400 });
    }

    const existing = await prisma.solution.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    const solution = await prisma.solution.create({
      data: { slug, category, title, ...rest },
    });

    return NextResponse.json(solution, { status: 201 });
  } catch (error: any) {
    console.error("Error creating solution:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
