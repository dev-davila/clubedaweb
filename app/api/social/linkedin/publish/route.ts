export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { 
  formatForLinkedIn, 
  generateHashtags, 
  buildLinkedInPayload,
  isTokenValid 
} from "@/lib/social-media";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { socialPublishSchema } from "@/lib/validation-schemas";

export async function POST(request: NextRequest) {
  // Check rate limit (20 publishes per minute per IP)
  const ip = getClientIP(request);
  if (!checkRateLimit(`social-publish-linkedin-${ip}`, 20, 60000)) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate with Zod
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
    const customHashtags = body.customHashtags;

    // Buscar conta do LinkedIn
    const linkedinAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "linkedin",
        isConnected: true,
        active: true
      }
    });

    if (!linkedinAccount) {
      return NextResponse.json(
        { error: "LinkedIn não conectado. Configure em Redes Sociais." },
        { status: 400 }
      );
    }

    // Verificar se token está válido
    if (!isTokenValid(linkedinAccount.expiresAt)) {
      // Atualizar status da conta
      await prisma.socialMediaAccount.update({
        where: { id: linkedinAccount.id },
        data: { 
          isConnected: false,
          lastError: "Token expirado. Reconecte a conta."
        }
      });
      
      return NextResponse.json(
        { error: "Token do LinkedIn expirado. Reconecte a conta." },
        { status: 401 }
      );
    }

    // Buscar post do blog se fornecido
    let blogPost: any = null;
    if (blogPostId) {
      blogPost = await prisma.blogPost.findUnique({
        where: { id: blogPostId },
        include: { 
          category: true,
          tags: { include: { tag: true } }
        }
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
    }

    // Preparar conteúdo
    let postText: string;
    let postUrl: string | undefined;
    let postTitle: string | undefined;

    if (blogPost) {
      const baseUrl = getSiteUrl();
      postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
      postTitle = blogPost.title;
      
      // Gerar hashtags se não customizadas
      const hashtags = customHashtags || generateHashtags(
        blogPost.title,
        blogPost.category?.name,
        blogPost.keywords || []
      );
      
      // Formatar conteúdo
      const content = formatForLinkedIn(
        blogPost.title,
        blogPost.excerpt,
        postUrl,
        hashtags,
        customText
      );
      
      postText = content.text;
    } else if (customText) {
      postText = customText;
    } else {
      return NextResponse.json(
        { error: "Forneça um blogPostId ou customText" },
        { status: 400 }
      );
    }

    // Construir URN do autor
    const authorUrn = linkedinAccount.postAsOrganization && linkedinAccount.organizationId
      ? `urn:li:organization:${linkedinAccount.organizationId}`
      : `urn:li:person:${linkedinAccount.accountId}`;

    let imageAsset: string | undefined;

    // Se tiver imagem, fazer upload para o LinkedIn
    if (blogPost?.featuredImage) {
      try {
        // 1. Registrar upload da imagem
        const registerUploadBody = {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: authorUrn,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent"
              }
            ]
          }
        };

        const registerResponse = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${linkedinAccount.accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
          },
          body: JSON.stringify(registerUploadBody)
        });

        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          const uploadUrl = registerData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
          imageAsset = registerData.value?.asset;

          if (uploadUrl && imageAsset) {
            // 2. Baixar a imagem
            const imageResponse = await fetch(blogPost.featuredImage);
            if (imageResponse.ok) {
              const imageBuffer = await imageResponse.arrayBuffer();

              // 3. Fazer upload para o LinkedIn
              const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${linkedinAccount.accessToken}`,
                  "Content-Type": "application/octet-stream"
                },
                body: imageBuffer
              });

              if (!uploadResponse.ok) {
                console.error("LinkedIn image upload failed:", uploadResponse.status);
                imageAsset = undefined; // Falhar silenciosamente, postar sem imagem
              }
            }
          }
        }
      } catch (imageError) {
        console.error("Error uploading image to LinkedIn:", imageError);
        // Continuar sem imagem
      }
    }

    // Montar payload com ou sem imagem
    let payload: any;
    
    if (imageAsset) {
      // Post com imagem
      payload = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: postText
            },
            shareMediaCategory: "IMAGE",
            media: [
              {
                status: "READY",
                media: imageAsset,
                title: postTitle ? { text: postTitle } : undefined
              }
            ]
          }
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      };
    } else {
      // Post sem imagem (com link se disponível)
      payload = buildLinkedInPayload(authorUrn, postText, postUrl, postTitle);
    }

    // Publicar no LinkedIn
    const publishResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${linkedinAccount.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify(payload)
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      console.error("LinkedIn publish error:", publishResponse.status, errorData);
      
      // Atualizar erro na conta
      await prisma.socialMediaAccount.update({
        where: { id: linkedinAccount.id },
        data: { 
          lastError: `Erro ${publishResponse.status}: ${errorData.message || "Falha ao publicar"}`,
          lastUsedAt: new Date()
        }
      });

      // Registrar publicação falha
      await prisma.socialPublication.create({
        data: {
          accountId: linkedinAccount.id,
          blogPostId: blogPost?.id,
          platform: "linkedin",
          content: postText,
          status: "failed",
          errorMessage: errorData.message || `HTTP ${publishResponse.status}`
        }
      });

      return NextResponse.json(
        { error: errorData.message || "Erro ao publicar no LinkedIn" },
        { status: publishResponse.status }
      );
    }

    const responseData = await publishResponse.json();
    const linkedinPostId = responseData.id; // URN do post

    // Extrair ID para montar URL
    const postIdMatch = linkedinPostId?.match(/urn:li:share:(\d+)/) || 
                        linkedinPostId?.match(/urn:li:ugcPost:(\d+)/);
    const linkedinPostUrl = postIdMatch 
      ? `https://www.linkedin.com/feed/update/${linkedinPostId}`
      : null;

    // Atualizar conta
    await prisma.socialMediaAccount.update({
      where: { id: linkedinAccount.id },
      data: { 
        lastUsedAt: new Date(),
        lastError: null
      }
    });

    // Registrar publicação bem-sucedida
    const publication = await prisma.socialPublication.create({
      data: {
        accountId: linkedinAccount.id,
        blogPostId: blogPost?.id,
        platform: "linkedin",
        postId: linkedinPostId,
        postUrl: linkedinPostUrl,
        content: postText,
        imageUrl: blogPost?.featuredImage,
        status: "published",
        publishedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      publication: {
        id: publication.id,
        postId: linkedinPostId,
        postUrl: linkedinPostUrl,
        content: postText
      }
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

// GET - Preview do conteúdo formatado
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const blogPostId = searchParams.get("blogPostId");

  if (!blogPostId) {
    return NextResponse.json(
      { error: "blogPostId é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      include: { 
        category: true,
        tags: { include: { tag: true } }
      }
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    const baseUrl = getSiteUrl();
    const postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
    
    const hashtags = generateHashtags(
      blogPost.title,
      blogPost.category?.name,
      blogPost.keywords || []
    );
    
    const content = formatForLinkedIn(
      blogPost.title,
      blogPost.excerpt,
      postUrl,
      hashtags
    );

    // Verificar conta do LinkedIn
    const linkedinAccount = await prisma.socialMediaAccount.findFirst({
      where: { platform: "linkedin", isConnected: true, active: true }
    });

    return NextResponse.json({
      preview: content,
      linkedinConnected: !!linkedinAccount,
      linkedinTokenValid: linkedinAccount ? isTokenValid(linkedinAccount.expiresAt) : false,
      characterCount: content.text.length,
      maxCharacters: 3000
    });

  } catch (error) {
    console.error("Erro ao gerar preview:", error);
    return NextResponse.json(
      { error: "Erro ao gerar preview" },
      { status: 500 }
    );
  }
}
