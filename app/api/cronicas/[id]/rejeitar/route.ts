export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { reason } = await request.json();

    const chronicle = await prisma.chronicle.findUnique({
      where: { id },
      select: { articleId: true }
    });

    if (!chronicle) {
      return NextResponse.json({ error: "Crônica não encontrada" }, { status: 404 });
    }

    // Update chronicle status
    await prisma.chronicle.update({
      where: { id },
      data: { status: "rejected" }
    });

    // Update article status
    await prisma.collectedArticle.update({
      where: { id: chronicle.articleId },
      data: { status: "rejected" }
    });

    return NextResponse.json({
      success: true,
      message: "Crônica rejeitada"
    });
  } catch (error) {
    console.error("Error rejecting chronicle:", error);
    return NextResponse.json({ error: "Erro ao rejeitar crônica" }, { status: 500 });
  }
}
