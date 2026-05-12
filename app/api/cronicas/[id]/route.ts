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
    const chronicle = await prisma.chronicle.findUnique({
      where: { id },
      include: {
        article: {
          include: { site: true }
        },
        category: true,
        author: true,
        blogPost: true
      }
    });

    if (!chronicle) {
      return NextResponse.json({ error: "Crônica não encontrada" }, { status: 404 });
    }

    return NextResponse.json(chronicle);
  } catch (error) {
    console.error("Error fetching chronicle:", error);
    return NextResponse.json({ error: "Erro ao buscar crônica" }, { status: 500 });
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
    const data = await request.json();

    const chronicle = await prisma.chronicle.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        featuredImage: data.featuredImage,
        sourceReference: data.sourceReference,
        categoryId: data.categoryId,
        authorId: data.authorId,
        publishToSocial: data.publishToSocial,
        socialPlatforms: data.socialPlatforms || [],
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null
      },
      include: {
        article: { include: { site: true } },
        category: true,
        author: true
      }
    });

    return NextResponse.json(chronicle);
  } catch (error) {
    console.error("Error updating chronicle:", error);
    return NextResponse.json({ error: "Erro ao atualizar crônica" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    
    // Get chronicle to update article status
    const chronicle = await prisma.chronicle.findUnique({
      where: { id },
      select: { articleId: true }
    });

    if (chronicle) {
      // Update article status back to pending
      await prisma.collectedArticle.update({
        where: { id: chronicle.articleId },
        data: { status: "pending" }
      });
    }

    await prisma.chronicle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chronicle:", error);
    return NextResponse.json({ error: "Erro ao excluir crônica" }, { status: 500 });
  }
}
