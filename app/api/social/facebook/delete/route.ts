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

    // Buscar a conta do Facebook
    const facebookAccount = await prisma.socialMediaAccount.findFirst({
      where: { platform: "facebook", active: true }
    });

    if (!facebookAccount || !facebookAccount.accessToken) {
      return NextResponse.json({ error: "Facebook não está conectado" }, { status: 400 });
    }

    // Buscar a publicação existente
    const publication = await prisma.socialPublication.findFirst({
      where: {
        blogPostId,
        platform: "facebook"
      }
    });

    if (!publication || !publication.postUrl) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    // Extrair o ID do post do Facebook da URL
    const postIdMatch = publication.postUrl.match(/(?:posts\/|photos\/[^/]+\/|)(\d+_\d+|\d+)(?:\/|$)/);
    
    if (!postIdMatch && !forceDelete) {
      return NextResponse.json({ 
        success: false, 
        error: "Não foi possível identificar o ID do post. Deseja remover apenas do sistema?",
        canForceDelete: true
      }, { status: 400 });
    }

    if (forceDelete || !postIdMatch) {
      // Apenas remover do banco
      await prisma.socialPublication.delete({
        where: { id: publication.id }
      });
      return NextResponse.json({ 
        success: true, 
        message: "Registro removido do sistema" 
      });
    }

    const postId = postIdMatch[1];

    // Tentar excluir do Facebook
    try {
      const deleteResponse = await fetch(
        `https://graph.facebook.com/v18.0/${postId}?access_token=${facebookAccount.accessToken}`,
        {
          method: "DELETE"
        }
      );

      const data = await deleteResponse.json();

      if (data.success || deleteResponse.status === 200) {
        await prisma.socialPublication.delete({
          where: { id: publication.id }
        });

        return NextResponse.json({ 
          success: true, 
          message: "Post excluído do Facebook com sucesso" 
        });
      } else if (data.error?.code === 100 || data.error?.code === 190) {
        // Post não existe ou token inválido
        await prisma.socialPublication.delete({
          where: { id: publication.id }
        });
        return NextResponse.json({ 
          success: true, 
          message: "Post já não existe no Facebook. Registro removido." 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: data.error?.message || "Erro ao excluir do Facebook",
          canForceDelete: true
        }, { status: 400 });
      }
    } catch (apiError: any) {
      console.error("Facebook API error:", apiError);
      return NextResponse.json({ 
        success: false, 
        error: "Erro de conexão com Facebook. Tente novamente.",
        canForceDelete: true
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Delete Facebook post error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
