export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { isTokenValid } from "@/lib/social-media";

// POST - Publicar post de teste no Facebook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar conta do Facebook
    const account = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "facebook",
        isConnected: true,
        active: true
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: "Facebook não está conectado" },
        { status: 400 }
      );
    }

    // Verificar se token está válido
    if (!isTokenValid(account.expiresAt)) {
      await prisma.socialMediaAccount.update({
        where: { id: account.id },
        data: { 
          isConnected: false,
          lastError: "Token expirado. Reconecte a conta."
        }
      });
      return NextResponse.json(
        { error: "Token do Facebook expirado. Reconecte a conta." },
        { status: 401 }
      );
    }

    // Conteúdo do post de teste
    const testContent = `🧪 Post de Teste - M3Solutions\n\nEste é um post de teste do sistema de integração com o Facebook.\n\n✅ Se você está vendo isso, a integração está funcionando corretamente!\n\n#M3Solutions #TI #Teste`;

    // Publicar no Facebook usando Graph API
    const pageId = account.accountId;
    if (!pageId) {
      return NextResponse.json(
        { error: "ID da página não encontrado" },
        { status: 400 }
      );
    }

    const publishUrl = `https://graph.facebook.com/v25.0/${pageId}/feed`;
    const publishBody = {
      message: testContent,
      access_token: account.accessToken
    };

    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(publishBody)
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      console.error("Facebook test publish error:", publishResponse.status, errorData);
      
      await prisma.socialMediaAccount.update({
        where: { id: account.id },
        data: { 
          lastError: `Erro ${publishResponse.status}: ${errorData.error?.message || "Falha ao publicar"}`,
          lastUsedAt: new Date()
        }
      });

      return NextResponse.json(
        { error: errorData.error?.message || "Erro ao publicar no Facebook" },
        { status: publishResponse.status }
      );
    }

    const responseData = await publishResponse.json();
    const fbPostId = responseData.id;
    const fbPostUrl = fbPostId ? `https://www.facebook.com/${fbPostId}` : null;

    // Registrar publicação
    await prisma.socialPublication.create({
      data: {
        accountId: account.id,
        platform: "facebook",
        postId: fbPostId,
        postUrl: fbPostUrl,
        content: testContent,
        status: "published",
        publishedAt: new Date()
      }
    });

    // Atualizar última utilização
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: { 
        lastUsedAt: new Date(),
        lastError: null
      }
    });

    return NextResponse.json({
      success: true,
      message: "Post de teste publicado com sucesso no Facebook!",
      postId: fbPostId,
      postUrl: fbPostUrl
    });

  } catch (error: any) {
    console.error("Erro ao publicar post de teste no Facebook:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao publicar" },
      { status: 500 }
    );
  }
}
