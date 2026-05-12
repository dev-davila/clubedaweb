export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// POST - Publica um post de teste no LinkedIn
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar conta do LinkedIn
    const account = await prisma.socialMediaAccount.findFirst({
      where: { platform: "linkedin", isConnected: true, active: true }
    });

    if (!account || !account.accessToken) {
      return NextResponse.json(
        { error: "LinkedIn não conectado" },
        { status: 400 }
      );
    }

    // Verificar se token expirou
    if (account.expiresAt && new Date(account.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Token expirado. Por favor, reconecte o LinkedIn." },
        { status: 400 }
      );
    }

    // Conteúdo do post de teste
    const testContent = `🧪 Post de Teste - M3Solutions\n\nEste é um post de teste do sistema de integração com redes sociais.\n\n✅ Se você está vendo isso, a integração está funcionando corretamente!\n\n#M3Solutions #TI #Teste`;

    const accessToken = account.accessToken;

    // Função auxiliar para criar post no LinkedIn
    async function createLinkedInPost(authorUrn: string, content: string): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
      const postResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: content
              },
              shareMediaCategory: "NONE"
            }
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        })
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        return { success: false, error: errorData.message || JSON.stringify(errorData) };
      }

      const postData = await postResponse.json();
      const postId = postData.id;
      const postUrl = postId ? `https://www.linkedin.com/feed/update/${postId}/` : "";
      
      return { success: true, postId, postUrl };
    }

    // Determinar onde postar
    const results: Array<{ target: string; success: boolean; postId?: string; postUrl?: string; error?: string }> = [];
    
    // Se configurado para postar em ambos
    if (account.postAsBoth && account.organizationId) {
      // Postar no perfil pessoal
      const personalUrn = `urn:li:person:${account.accountId}`;
      console.log(`Postando no perfil pessoal: ${personalUrn}`);
      const personalResult = await createLinkedInPost(personalUrn, testContent);
      results.push({ target: "Perfil Pessoal", ...personalResult });
      
      // Postar na página da empresa
      const orgUrn = `urn:li:organization:${account.organizationId}`;
      console.log(`Postando na empresa: ${orgUrn}`);
      const orgResult = await createLinkedInPost(orgUrn, testContent);
      results.push({ target: account.organizationName || "Empresa", ...orgResult });
    } 
    // Se configurado para postar apenas como organização
    else if (account.postAsOrganization && account.organizationId) {
      const orgUrn = `urn:li:organization:${account.organizationId}`;
      console.log(`Postando apenas na empresa: ${orgUrn}`);
      const orgResult = await createLinkedInPost(orgUrn, testContent);
      results.push({ target: account.organizationName || "Empresa", ...orgResult });
    } 
    // Postar apenas no perfil pessoal
    else {
      const personalUrn = `urn:li:person:${account.accountId}`;
      console.log(`Postando apenas no perfil pessoal: ${personalUrn}`);
      const personalResult = await createLinkedInPost(personalUrn, testContent);
      results.push({ target: "Perfil Pessoal", ...personalResult });
    }

    // Verificar resultados
    const successResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    // Registrar publicações bem-sucedidas
    for (const result of successResults) {
      await prisma.socialPublication.create({
        data: {
          accountId: account.id,
          platform: "linkedin",
          postId: result.postId || null,
          postUrl: result.postUrl || null,
          content: `[${result.target}] ${testContent}`,
          status: "published",
          publishedAt: new Date()
        }
      });
    }

    // Atualizar última utilização
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: { 
        lastUsedAt: new Date(),
        lastError: failedResults.length > 0 ? failedResults.map(r => `${r.target}: ${r.error}`).join("; ") : null
      }
    });

    // Retornar resultado
    if (successResults.length === 0) {
      return NextResponse.json(
        { error: `Falha ao publicar: ${failedResults.map(r => r.error).join(", ")}` },
        { status: 400 }
      );
    }

    const message = results.length > 1
      ? `Post de teste publicado em ${successResults.length} de ${results.length} destinos!`
      : "Post de teste publicado com sucesso!";

    return NextResponse.json({
      success: true,
      message,
      results,
      postUrl: successResults[0]?.postUrl
    });

  } catch (error: any) {
    console.error("Erro ao publicar post de teste:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
