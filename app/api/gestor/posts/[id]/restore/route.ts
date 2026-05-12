export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// Item 12: Restore soft-deleted post
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

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }
    if (!post.deletedAt) {
      return NextResponse.json({ error: "Post não está na lixeira" }, { status: 400 });
    }

    await prisma.blogPost.update({
      where: { id },
      data: { deletedAt: null }
    });

    await prisma.auditLog.create({
      data: {
        action: "POST_RESTORED",
        entityType: "BlogPost",
        entityId: id,
        details: `Post restaurado: ${post.title}`,
        userId: (session.user as any).id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESTORE] Erro ao restaurar post:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
