export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { formatForInstagram, isTokenValid } from "@/lib/social-media";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { socialPublishSchema } from "@/lib/validation-schemas";

// POST - Publicar no Instagram
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (20 publishes per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`social-publish-instagram-${ip}`, 20, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Parse body once
    const body = await request.json();
    
    // Validate with Zod (validates required fields)
    let validatedData;
    try {
      validatedData = socialPublishSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: "Dados de publicação inválidos" },
        { status: 400 }
      );
    }

    const { blogPostId, customText } = validatedData as any;
    const customImageUrl = body.imageUrl;

    // Buscar conta do Instagram
    const instagramAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "instagram",
        isConnected: true,
        active: true
      }
    });

    if (!instagramAccount) {
      return NextResponse.json(
        { error: "Conta do Instagram não conectada" },
        { status: 400 }
      );
    }

    // Verificar se token está válido
    if (!isTokenValid(instagramAccount.expiresAt)) {
      await prisma.socialMediaAccount.update({
        where: { id: instagramAccount.id },
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

    let postText = customText;
    let blogPost: any = null;
    let imageUrl = customImageUrl;
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

      // Instagram requer imagem - usar featured image do post
      if (!imageUrl && blogPost.featuredImage) {
        // Se a imagem for relativa, converter para URL absoluta
        if (blogPost.featuredImage.startsWith("/")) {
          imageUrl = `${process.env.NEXTAUTH_URL}${blogPost.featuredImage}`;
        } else {
          imageUrl = blogPost.featuredImage;
        }
      }

      if (!imageUrl) {
        return NextResponse.json(
          { error: "Instagram requer uma imagem para publicação. O post não tem imagem destacada." },
          { status: 400 }
        );
      }

      if (!customText) {
        const baseUrl = getSiteUrl();
        postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
        
        // Buscar URL configurada da bio
        const bioLinkConfig = await prisma.siteConfig.findFirst({
          where: { key: "instagram_bio_link_url" }
        });
        const bioLinkPath = bioLinkConfig?.value || "/noticias";
        const bioLinkUrl = `${baseUrl}${bioLinkPath.startsWith("/") ? bioLinkPath : "/" + bioLinkPath}`;
        
        const content = formatForInstagram(
          blogPost.title,
          blogPost.excerpt,
          postUrl,
          blogPost.category?.name,
          undefined, // customTemplate
          bioLinkUrl
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

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Instagram requer uma imagem para publicação" },
        { status: 400 }
      );
    }

    // Publicar no Instagram usando Graph API (processo em 2 etapas)
    const igUserId = instagramAccount.accountId;
    if (!igUserId) {
      return NextResponse.json(
        { error: "ID da conta Instagram não encontrado" },
        { status: 400 }
      );
    }

    // Etapa 1: Criar container de mídia
    const containerUrl = `https://graph.facebook.com/v25.0/${igUserId}/media`;
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption: postText,
      access_token: instagramAccount.accessToken
    });

    const containerResponse = await fetch(containerUrl, {
      method: "POST",
      body: containerParams
    });

    if (!containerResponse.ok) {
      const errorData = await containerResponse.json().catch(() => ({}));
      console.error("Instagram container error:", containerResponse.status, errorData);
      
      await prisma.socialMediaAccount.update({
        where: { id: instagramAccount.id },
        data: { 
          lastError: `Erro ${containerResponse.status}: ${errorData.error?.message || "Falha ao criar container"}`,
          lastUsedAt: new Date()
        }
      });

      // Registrar publicação falha
      await prisma.socialPublication.create({
        data: {
          accountId: instagramAccount.id,
          blogPostId: blogPost?.id || null,
          platform: "instagram",
          content: postText,
          imageUrl: imageUrl,
          status: "failed",
          errorMessage: errorData.error?.message || `HTTP ${containerResponse.status}`
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
      access_token: instagramAccount.accessToken
    });

    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      body: publishParams
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      console.error("Instagram publish error:", publishResponse.status, errorData);
      
      await prisma.socialMediaAccount.update({
        where: { id: instagramAccount.id },
        data: { 
          lastError: `Erro ${publishResponse.status}: ${errorData.error?.message || "Falha ao publicar"}`,
          lastUsedAt: new Date()
        }
      });

      // Registrar publicação falha
      await prisma.socialPublication.create({
        data: {
          accountId: instagramAccount.id,
          blogPostId: blogPost?.id || null,
          platform: "instagram",
          content: postText,
          imageUrl: imageUrl,
          status: "failed",
          errorMessage: errorData.error?.message || `HTTP ${publishResponse.status}`
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
        `https://graph.facebook.com/v25.0/${igPostId}?fields=permalink&access_token=${instagramAccount.accessToken}`
      );
      if (permalinkResponse.ok) {
        const permalinkData = await permalinkResponse.json();
        igPostUrl = permalinkData.permalink;
      }
    } catch (e) {
      console.error("Erro ao buscar permalink:", e);
    }

    // Atualizar conta
    await prisma.socialMediaAccount.update({
      where: { id: instagramAccount.id },
      data: { 
        lastUsedAt: new Date(),
        lastError: null
      }
    });

    // Registrar publicação bem-sucedida
    const publication = await prisma.socialPublication.create({
      data: {
        accountId: instagramAccount.id,
        blogPostId: blogPost?.id || null,
        platform: "instagram",
        postId: igPostId,
        postUrl: igPostUrl,
        content: postText,
        imageUrl: imageUrl,
        status: "published",
        publishedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      postId: igPostId,
      postUrl: igPostUrl,
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
    const instagramAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "instagram",
        active: true
      }
    });

    const baseUrl = getSiteUrl();
    const postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
    
    // Buscar URL configurada da bio
    const bioLinkConfig = await prisma.siteConfig.findFirst({
      where: { key: "instagram_bio_link_url" }
    });
    const bioLinkPath = bioLinkConfig?.value || "/noticias";
    const bioLinkUrl = `${baseUrl}${bioLinkPath.startsWith("/") ? bioLinkPath : "/" + bioLinkPath}`;
    
    const content = formatForInstagram(
      blogPost.title,
      blogPost.excerpt,
      postUrl,
      blogPost.category?.name,
      undefined, // customTemplate
      bioLinkUrl
    );

    // Verificar imagem
    let imageUrl = blogPost.featuredImage;
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }

    return NextResponse.json({
      content,
      postUrl,
      imageUrl,
      hasImage: !!imageUrl,
      account: instagramAccount ? {
        isConnected: instagramAccount.isConnected,
        accountName: instagramAccount.accountName,
        expiresAt: instagramAccount.expiresAt,
        tokenValid: isTokenValid(instagramAccount.expiresAt)
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
