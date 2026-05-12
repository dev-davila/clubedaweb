import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET - List products with optional filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { vendor: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.softwareProduct.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: { category: { select: { id: true, slug: true, name: true } } },
    });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create product
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const body = await req.json();
    const { slug, name, categoryId } = body;
    if (!slug || !name || !categoryId) return NextResponse.json({ error: "slug, name e categoryId obrigatórios" }, { status: 400 });
    const existing = await prisma.softwareProduct.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    const product = await prisma.softwareProduct.create({ data: body });
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
