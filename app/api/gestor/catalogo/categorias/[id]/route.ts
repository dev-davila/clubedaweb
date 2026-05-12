import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const body = await req.json();
    const { id: _id, createdAt: _ca, updatedAt: _ua, products: _p, _count: _c, ...data } = body;
    const cat = await prisma.softwareCategory.update({ where: { id: params.id }, data });
    return NextResponse.json(cat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    // Check if category has products
    const count = await prisma.softwareProduct.count({ where: { categoryId: params.id } });
    if (count > 0) return NextResponse.json({ error: `Categoria tem ${count} produtos. Remova-os primeiro.` }, { status: 400 });
    await prisma.softwareCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
