import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/gestor/solucoes/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const solution = await prisma.solution.findUnique({ where: { id: params.id } });
    if (!solution) return NextResponse.json({ error: "Solução não encontrada" }, { status: 404 });

    return NextResponse.json(solution);
  } catch (error: any) {
    console.error("Error fetching solution:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/gestor/solucoes/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...data } = body;

    // If slug changed, check for conflicts
    if (data.slug) {
      const existing = await prisma.solution.findFirst({
        where: { slug: data.slug, NOT: { id: params.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
      }
    }

    const solution = await prisma.solution.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(solution);
  } catch (error: any) {
    console.error("Error updating solution:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/gestor/solucoes/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await prisma.solution.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting solution:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
