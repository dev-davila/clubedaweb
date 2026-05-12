export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await prisma.collectedArticle.findUnique({
      where: { id },
      include: {
        site: true,
        chronicle: {
          include: {
            category: true,
            author: true,
            blogPost: true
          }
        }
      }
    });

    if (!article) {
      return NextResponse.json({ error: "Matéria não encontrada" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Erro ao buscar matéria" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    const article = await prisma.collectedArticle.update({
      where: { id },
      data: {
        status,
        selectedAt: status === "selected" ? new Date() : undefined
      }
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Erro ao atualizar matéria" }, { status: 500 });
  }
}
