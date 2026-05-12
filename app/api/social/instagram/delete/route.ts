export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { blogPostId, forceDelete } = await req.json();
    if (!blogPostId) {
      return NextResponse.json({ error: "blogPostId é obrigatório" }, { status: 400 });
    }

    // Buscar a publicação existente
    const publication = await prisma.socialPublication.findFirst({
      where: {
        blogPostId,
        platform: "instagram"
      }
    });

    if (!publication) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    // Instagram não permite exclusão via API para a maioria das contas
    // A exclusão deve ser feita manualmente no app/site do Instagram
    // Podemos apenas remover o registro do nosso sistema

    if (forceDelete) {
      await prisma.socialPublication.delete({
        where: { id: publication.id }
      });
      return NextResponse.json({ 
        success: true, 
        message: "Registro removido do sistema. O post no Instagram precisa ser excluído manualmente." 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: "O Instagram não permite exclusão de posts via API. O post precisa ser excluído manualmente no app do Instagram.",
      canForceDelete: true,
      requiresManualDeletion: true
    }, { status: 400 });

  } catch (error: any) {
    console.error("Delete Instagram post error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
