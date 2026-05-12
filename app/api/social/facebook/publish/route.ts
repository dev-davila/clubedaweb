export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { formatForFacebook, isTokenValid } from "@/lib/social-media";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { socialPublishSchema } from "@/lib/validation-schemas";

// POST - Publicar no Facebook
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (20 publishes per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`social-publish-facebook-${ip}`, 20, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Validate request body
    const validatedData = await validateRequest(request, socialPublishSchema);
    const { blogPostId, customText } = validatedData as any;

    // Buscar conta do Facebook
    const facebookAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "facebook",
        isConnected: true,
        active: true
      }
    });

    if (!facebookAccount) {
      return NextResponse.json(
        { error: "Conta do Facebook não conectada" },
        { status: 400 }
      );
    }

    // Verificar se token está válido
    if (!isTokenValid(facebookAccount.expiresAt)) {
      await prisma.socialMediaAccount.update({
        where: { id: facebookAccount.id },
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

    let postText = customText;
    let blogPost: any = null;
    let postUrl = "";

    // Se tiver blogPostId, buscar e formatar
    if (blogPostId) {
      blogPost = await prisma.blogPost.findUnique({
        where: { id: blogPostId },
        include: { category: true }
      });

      if (!blogPost) {
        return NextResponse.json(
          { error: "Post não encontrado" },
          { status: 404 }
        );
      }

      // Sub-páginas regionais não podem publicar em redes sociais
      if (blogPost.geoState || blogPost.geoCity || (blogPost.seoLevel && blogPost.seoLevel !== "GLOBAL")) {
        return NextResponse.json(
          { error: "Publicação em redes sociais disponível apenas para posts globais/nacionais" },
          { status: 403 }
        );
      }

      if (!customText) {
        const baseUrl = getSiteUrl();
        postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
        const content = formatForFacebook(
          blogPost.title,
          blogPost.excerpt,
          postUrl,
          blogPost.category?.name
        );
        postText = content.text;
      }
    }

    if (!postText) {
      return NextResponse.json(
        { error: "Texto do post é obrigatório" },
        { status: 400 }
      );
    }

    // Publicar no Facebook usando Graph API
    const pageId = facebookAccount.accountId;
    if (!pageId) {
      return NextResponse.json(
        { error: "ID da página não encontrado" },
        { status: 400 }
      );
    }

    let publishResponse: Response;
    let fbPostId: string | undefined;

    // Se tiver imagem, postar como foto com link no texto
    if (blogPost?.featuredImage) {
      const photoApiUrl = `https://graph.facebook.com/v25.0/${pageId}/photos`;
      
      // Adicionar o link no final do texto
      const messageWithLink = postUrl 
        ? `${postText}\n\n🔗 Leia mais: ${postUrl}`
        : postText;

      const photoBody = {
        url: blogPost.featuredImage,
        caption: messageWithLink,
        access_token: facebookAccount.accessToken
      };

      publishResponse = await fetch(photoApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(photoBody)
      });

      if (publishResponse.ok) {
        const photoData = await publishResponse.json();
        fbPostId = photoData.post_id || photoData.id;
      }
    } else {
      // Sem imagem, postar apenas com link
      const feedUrl = `https://graph.facebook.com/v25.0/${pageId}/feed`;
      const feedBody: any = {
        message: postText,
        access_token: facebookAccount.accessToken
      };

      if (postUrl) {
        feedBody.link = postUrl;
      }

      publishResponse = await fetch(feedUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(feedBody)
      });

      if (publishResponse.ok) {
        const feedData = await publishResponse.json();
        fbPostId = feedData.id;
      }
    }

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      console.error("Facebook publish error:", publishResponse.status, errorData);
      
      await prisma.socialMediaAccount.update({
        where: { id: facebookAccount.id },
        data: { 
          lastError: `Erro ${publishResponse.status}: ${errorData.error?.message || "Falha ao publicar"}`,
          lastUsedAt: new Date()
        }
      });

      // Registrar publicação falha
      await prisma.socialPublication.create({
        data: {
          accountId: facebookAccount.id,
          blogPostId: blogPost?.id || null,
          platform: "facebook",
          content: postText,
          status: "failed",
          errorMessage: errorData.error?.message || `HTTP ${publishResponse.status}`
        }
      });

      return NextResponse.json(
        { error: errorData.error?.message || "Erro ao publicar no Facebook" },
        { status: publishResponse.status }
      );
    }

    // fbPostId já foi definido acima nos blocos if/else
    const fbPostUrl = fbPostId ? `https://www.facebook.com/${fbPostId}` : null;

    // Atualizar conta
    await prisma.socialMediaAccount.update({
      where: { id: facebookAccount.id },
      data: { 
        lastUsedAt: new Date(),
        lastError: null
      }
    });

    // Registrar publicação bem-sucedida
    const publication = await prisma.socialPublication.create({
      data: {
        accountId: facebookAccount.id,
        blogPostId: blogPost?.id || null,
        platform: "facebook",
        postId: fbPostId,
        postUrl: fbPostUrl,
        content: postText,
        imageUrl: blogPost?.featuredImage || null,
        status: "published",
        publishedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      postId: fbPostId,
      postUrl: fbPostUrl,
      publicationId: publication.id
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

// GET - Preview do conteúdo formatado
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blogPostId = searchParams.get("blogPostId");

    if (!blogPostId) {
      return NextResponse.json(
        { error: "blogPostId é obrigatório" },
        { status: 400 }
      );
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      include: { category: true }
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Verificar conta conectada
    const facebookAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "facebook",
        active: true
      }
    });

    const baseUrl = getSiteUrl();
    const postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
    
    const content = formatForFacebook(
      blogPost.title,
      blogPost.excerpt,
      postUrl,
      blogPost.category?.name
    );

    return NextResponse.json({
      content,
      postUrl,
      account: facebookAccount ? {
        isConnected: facebookAccount.isConnected,
        accountName: facebookAccount.accountName,
        expiresAt: facebookAccount.expiresAt,
        tokenValid: isTokenValid(facebookAccount.expiresAt)
      } : null
    });

  } catch (error) {
    console.error("Erro ao gerar preview:", error);
    return NextResponse.json(
      { error: "Erro ao gerar preview" },
      { status: 500 }
    );
  }
}
