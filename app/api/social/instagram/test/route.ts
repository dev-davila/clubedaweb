export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { isTokenValid } from "@/lib/social-media";

// POST - Publicar post de teste no Instagram
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar conta do Instagram
    const account = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "instagram",
        isConnected: true,
        active: true
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: "Instagram não está conectado" },
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
        { error: "Token do Instagram expirado. Reconecte a conta." },
        { status: 401 }
      );
    }

    // Conteúdo do post de teste
    const testContent = `🧪 Post de Teste - M3Solutions\n\nEste é um post de teste do sistema de integração com o Instagram.\n\n✅ Se você está vendo isso, a integração está funcionando corretamente!\n\n#M3Solutions #TI #Teste #Tecnologia #Inovação`;

    // Instagram requer imagem - usar imagem pública do site
    const baseUrl = getSiteUrl();
    const testImageUrl = `${baseUrl}/images/cloud_computing_16x9.png`;

    const igUserId = account.accountId;
    if (!igUserId) {
      return NextResponse.json(
        { error: "ID da conta Instagram não encontrado" },
        { status: 400 }
      );
    }

    // Etapa 1: Criar container de mídia
    const containerUrl = `https://graph.facebook.com/v25.0/${igUserId}/media`;
    const containerParams = new URLSearchParams({
      image_url: testImageUrl,
      caption: testContent,
      access_token: account.accessToken
    });

    const containerResponse = await fetch(containerUrl, {
      method: "POST",
      body: containerParams
    });

    if (!containerResponse.ok) {
      const errorData = await containerResponse.json().catch(() => ({}));
      console.error("Instagram container error:", containerResponse.status, errorData);
      
      await prisma.socialMediaAccount.update({
        where: { id: account.id },
        data: { 
          lastError: `Erro ${containerResponse.status}: ${errorData.error?.message || "Falha ao criar container"}`,
          lastUsedAt: new Date()
        }
      });

      return NextResponse.json(
        { error: errorData.error?.message || "Erro ao criar mídia no Instagram" },
        { status: containerResponse.status }
      );
    }

    const containerData = await containerResponse.json();
    const containerId = containerData.id;

    // Aguardar um pouco para o Instagram processar a imagem
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Etapa 2: Publicar o container
    const publishUrl = `https://graph.facebook.com/v25.0/${igUserId}/media_publish`;
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: account.accessToken
    });

    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      body: publishParams
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      console.error("Instagram publish error:", publishResponse.status, errorData);
      
      await prisma.socialMediaAccount.update({
        where: { id: account.id },
        data: { 
          lastError: `Erro ${publishResponse.status}: ${errorData.error?.message || "Falha ao publicar"}`,
          lastUsedAt: new Date()
        }
      });

      return NextResponse.json(
        { error: errorData.error?.message || "Erro ao publicar no Instagram" },
        { status: publishResponse.status }
      );
    }

    const responseData = await publishResponse.json();
    const igPostId = responseData.id;

    // Buscar permalink do post
    let igPostUrl = null;
    try {
      const permalinkResponse = await fetch(
        `https://graph.facebook.com/v25.0/${igPostId}?fields=permalink&access_token=${account.accessToken}`
      );
      if (permalinkResponse.ok) {
        const permalinkData = await permalinkResponse.json();
        igPostUrl = permalinkData.permalink;
      }
    } catch (e) {
      console.error("Erro ao buscar permalink:", e);
    }

    // Registrar publicação
    await prisma.socialPublication.create({
      data: {
        accountId: account.id,
        platform: "instagram",
        postId: igPostId,
        postUrl: igPostUrl,
        content: testContent,
        imageUrl: testImageUrl,
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
      message: "Post de teste publicado com sucesso no Instagram!",
      postId: igPostId,
      postUrl: igPostUrl
    });

  } catch (error: any) {
    console.error("Erro ao publicar post de teste no Instagram:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao publicar" },
      { status: 500 }
    );
  }
}
