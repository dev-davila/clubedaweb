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

    // Buscar a conta do LinkedIn
    const linkedinAccount = await prisma.socialMediaAccount.findFirst({
      where: { platform: "linkedin", active: true }
    });

    if (!linkedinAccount || !linkedinAccount.accessToken) {
      return NextResponse.json({ error: "LinkedIn não está conectado" }, { status: 400 });
    }

    // Buscar a publicação existente
    const publication = await prisma.socialPublication.findFirst({
      where: {
        blogPostId,
        platform: "linkedin"
      }
    });

    if (!publication || !publication.postUrl) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    // Extrair o ID do post do LinkedIn da URL
    const postUrlMatch = publication.postUrl.match(/urn:li:(share|ugcPost):(\d+)/);
    
    if (!postUrlMatch && !forceDelete) {
      return NextResponse.json({ 
        success: false, 
        error: "Não foi possível identificar o ID do post. Deseja remover apenas do sistema?",
        canForceDelete: true
      }, { status: 400 });
    }

    if (forceDelete || !postUrlMatch) {
      // Apenas remover do banco
      await prisma.socialPublication.delete({
        where: { id: publication.id }
      });
      return NextResponse.json({ 
        success: true, 
        message: "Registro removido do sistema" 
      });
    }

    const postUrn = `urn:li:${postUrlMatch[1]}:${postUrlMatch[2]}`;

    // Tentar excluir do LinkedIn
    try {
      const deleteResponse = await fetch(
        `https://api.linkedin.com/v2/ugcPosts/${encodeURIComponent(postUrn)}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${linkedinAccount.accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0"
          }
        }
      );

      // LinkedIn retorna 204 para sucesso ou 404 se já foi deletado
      if (deleteResponse.status === 204 || deleteResponse.status === 404 || deleteResponse.status === 200) {
        await prisma.socialPublication.delete({
          where: { id: publication.id }
        });

        return NextResponse.json({ 
          success: true, 
          message: "Post excluído do LinkedIn com sucesso" 
        });
      } else {
        const errorText = await deleteResponse.text();
        console.error("LinkedIn delete error:", deleteResponse.status, errorText);
        
        return NextResponse.json({ 
          success: false, 
          error: `Erro ao excluir do LinkedIn (${deleteResponse.status}). O post pode precisar ser excluído manualmente.`,
          canForceDelete: true
        }, { status: 400 });
      }
    } catch (apiError: any) {
      console.error("LinkedIn API error:", apiError);
      return NextResponse.json({ 
        success: false, 
        error: "Erro de conexão com LinkedIn. Tente novamente.",
        canForceDelete: true
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Delete LinkedIn post error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
