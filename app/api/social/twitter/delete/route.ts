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

    // Buscar a conta do Twitter
    const twitterAccount = await prisma.socialMediaAccount.findFirst({
      where: { platform: "twitter", active: true }
    });

    if (!twitterAccount || !twitterAccount.accessToken) {
      return NextResponse.json({ error: "Twitter/X não está conectado" }, { status: 400 });
    }

    // Buscar a publicação existente
    const publication = await prisma.socialPublication.findFirst({
      where: {
        blogPostId,
        platform: "twitter"
      }
    });

    if (!publication || !publication.postUrl) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    // Extrair o ID do tweet da URL
    const tweetIdMatch = publication.postUrl.match(/status\/(\d+)/);
    
    if (!tweetIdMatch && !forceDelete) {
      return NextResponse.json({ 
        success: false, 
        error: "Não foi possível identificar o ID do tweet. Deseja remover apenas do sistema?",
        canForceDelete: true
      }, { status: 400 });
    }

    if (forceDelete || !tweetIdMatch) {
      // Apenas remover do banco
      await prisma.socialPublication.delete({
        where: { id: publication.id }
      });
      return NextResponse.json({ 
        success: true, 
        message: "Registro removido do sistema" 
      });
    }

    const tweetId = tweetIdMatch[1];

    // Tentar excluir do Twitter usando OAuth 2.0 User Context
    try {
      const deleteResponse = await fetch(
        `https://api.twitter.com/2/tweets/${tweetId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${twitterAccount.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (deleteResponse.status === 200 || deleteResponse.status === 204) {
        await prisma.socialPublication.delete({
          where: { id: publication.id }
        });

        return NextResponse.json({ 
          success: true, 
          message: "Tweet excluído com sucesso" 
        });
      } else if (deleteResponse.status === 404) {
        await prisma.socialPublication.delete({
          where: { id: publication.id }
        });
        return NextResponse.json({ 
          success: true, 
          message: "Tweet já não existe. Registro removido." 
        });
      } else {
        const errorData = await deleteResponse.json();
        console.error("Twitter delete error:", deleteResponse.status, errorData);
        return NextResponse.json({ 
          success: false, 
          error: errorData.detail || errorData.title || "Erro ao excluir do Twitter/X",
          canForceDelete: true
        }, { status: 400 });
      }
    } catch (apiError: any) {
      console.error("Twitter API error:", apiError);
      return NextResponse.json({ 
        success: false, 
        error: "Erro de conexão com Twitter/X. Tente novamente.",
        canForceDelete: true
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Delete Twitter post error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
