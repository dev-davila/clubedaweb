export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { sendEmail as sendSmtpEmail } from "@/lib/email";
import crypto from "crypto";
import { 
  formatForLinkedIn, 
  formatForTwitter,
  formatForFacebook,
  formatForInstagram,
  generateHashtags, 
  buildLinkedInPayload,
  isTokenValid 
} from "@/lib/social-media";

// Tipo de status (evitar import issues com Prisma)
type PostStatus = "BRIEFING" | "GENERATING" | "DRAFT" | "REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

const validTransitions: Record<PostStatus, PostStatus[]> = {
  BRIEFING: ["GENERATING"],
  GENERATING: ["DRAFT", "BRIEFING"],
  DRAFT: ["REVIEW", "GENERATING", "ARCHIVED"],
  REVIEW: ["DRAFT", "APPROVED"],
  APPROVED: ["PUBLISHED", "SCHEDULED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "APPROVED", "DRAFT"],
  PUBLISHED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: ["DRAFT"]
};

// Função para publicar automaticamente no LinkedIn
async function autoPublishToLinkedIn(blogPost: any): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    // Verificar se há conta LinkedIn conectada com autoPost habilitado
    const linkedinAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "linkedin",
        isConnected: true,
        autoPost: true,
        active: true
      }
    });

    if (!linkedinAccount) {
      return { success: false, error: "LinkedIn não configurado para auto-post" };
    }

    // Verificar se token está válido
    if (!isTokenValid(linkedinAccount.expiresAt)) {
      await prisma.socialMediaAccount.update({
        where: { id: linkedinAccount.id },
        data: { 
          isConnected: false,
          lastError: "Token expirado. Reconecte a conta."
        }
      });
      return { success: false, error: "Token do LinkedIn expirado" };
    }

    // Preparar conteúdo
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

    // Construir URN do autor
    const authorUrn = `urn:li:person:${linkedinAccount.accountId}`;

    // Montar payload
    const payload = buildLinkedInPayload(authorUrn, content.text, postUrl, blogPost.title);

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
      console.error("LinkedIn auto-publish error:", publishResponse.status, errorData);
      
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
          blogPostId: blogPost.id,
          platform: "linkedin",
          content: content.text,
          status: "failed",
          errorMessage: errorData.message || `HTTP ${publishResponse.status}`
        }
      });

      return { success: false, error: errorData.message || "Erro ao publicar no LinkedIn" };
    }

    const responseData = await publishResponse.json();
    const linkedinPostId = responseData.id;

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
    await prisma.socialPublication.create({
      data: {
        accountId: linkedinAccount.id,
        blogPostId: blogPost.id,
        platform: "linkedin",
        postId: linkedinPostId,
        postUrl: linkedinPostUrl,
        content: content.text,
        imageUrl: blogPost.featuredImage,
        status: "published",
        publishedAt: new Date()
      }
    });

    return { success: true, postUrl: linkedinPostUrl || undefined };
  } catch (error) {
    console.error("Erro ao auto-publicar no LinkedIn:", error);
    return { success: false, error: "Erro interno ao publicar" };
  }
}

// Função para publicar automaticamente no Twitter/X
async function autoPublishToTwitter(blogPost: any): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    // Verificar se há conta Twitter conectada com autoPost habilitado
    const twitterAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "twitter",
        isConnected: true,
        autoPost: true,
        active: true
      }
    });

    if (!twitterAccount) {
      return { success: false, error: "Twitter não configurado para auto-post" };
    }

    // Verificar se token está válido
    if (!isTokenValid(twitterAccount.expiresAt)) {
      // Tentar refresh do token
      const refreshed = await refreshTwitterToken(twitterAccount);
      if (!refreshed) {
        await prisma.socialMediaAccount.update({
          where: { id: twitterAccount.id },
          data: { 
            isConnected: false,
            lastError: "Token expirado. Reconecte a conta."
          }
        });
        return { success: false, error: "Token do Twitter expirado" };
      }
      // Recarregar conta com novo token
      const updatedAccount = await prisma.socialMediaAccount.findUnique({
        where: { id: twitterAccount.id }
      });
      if (updatedAccount) {
        twitterAccount.accessToken = updatedAccount.accessToken;
      }
    }

    // Preparar conteúdo
    const baseUrl = getSiteUrl();
    const postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
    
    const content = formatForTwitter(
      blogPost.title,
      blogPost.excerpt,
      postUrl,
      blogPost.category?.name
    );

    // Publicar no Twitter usando API v2
    const publishResponse = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${twitterAccount.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: content.text
      })
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      console.error("Twitter auto-publish error:", publishResponse.status, errorData);
      
      await prisma.socialMediaAccount.update({
        where: { id: twitterAccount.id },
        data: { 
          lastError: `Erro ${publishResponse.status}: ${errorData.detail || errorData.title || "Falha ao publicar"}`,
          lastUsedAt: new Date()
        }
      });

      // Registrar publicação falha
      await prisma.socialPublication.create({
        data: {
          accountId: twitterAccount.id,
          blogPostId: blogPost.id,
          platform: "twitter",
          content: content.text,
          status: "failed",
          errorMessage: errorData.detail || errorData.title || `HTTP ${publishResponse.status}`
        }
      });

      return { success: false, error: errorData.detail || errorData.title || "Erro ao publicar no Twitter" };
    }

    const responseData = await publishResponse.json();
    const tweetId = responseData.data?.id;
    const tweetUrl = tweetId ? `https://x.com/i/status/${tweetId}` : null;

    // Atualizar conta
    await prisma.socialMediaAccount.update({
      where: { id: twitterAccount.id },
      data: { 
        lastUsedAt: new Date(),
        lastError: null
      }
    });

    // Registrar publicação bem-sucedida
    await prisma.socialPublication.create({
      data: {
        accountId: twitterAccount.id,
        blogPostId: blogPost.id,
        platform: "twitter",
        postId: tweetId,
        postUrl: tweetUrl,
        content: content.text,
        imageUrl: blogPost.featuredImage,
        status: "published",
        publishedAt: new Date()
      }
    });

    return { success: true, postUrl: tweetUrl || undefined };
  } catch (error) {
    console.error("Erro ao auto-publicar no Twitter:", error);
    return { success: false, error: "Erro interno ao publicar" };
  }
}

// Função auxiliar para refresh do token do Twitter
async function refreshTwitterToken(account: any): Promise<boolean> {
  if (!account.refreshToken) return false;

  try {
    const clientIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "twitter_client_id" }
    });
    const clientSecretConfig = await prisma.siteConfig.findFirst({
      where: { key: "twitter_client_secret" }
    });

    if (!clientIdConfig?.value || !clientSecretConfig?.value) return false;

    const basicAuth = Buffer.from(`${clientIdConfig.value}:${clientSecretConfig.value}`).toString("base64");

    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: account.refreshToken,
        client_id: clientIdConfig.value
      })
    });

    if (!response.ok) return false;

    const data = await response.json();
    const expiresAt = new Date(Date.now() + (data.expires_in || 7200) * 1000);

    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || account.refreshToken,
        expiresAt,
        lastError: null
      }
    });

    return true;
  } catch (error) {
    console.error("Erro ao renovar token do Twitter:", error);
    return false;
  }
}

// Função para publicar automaticamente no Facebook
async function autoPublishToFacebook(blogPost: any): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    // Verificar se há conta Facebook conectada com autoPost habilitado
    const facebookAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "facebook",
        isConnected: true,
        autoPost: true,
        active: true
      }
    });

    if (!facebookAccount) {
      return { success: false, error: "Facebook não configurado para auto-post" };
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
      return { success: false, error: "Token do Facebook expirado" };
    }

    // Preparar conteúdo
    const baseUrl = getSiteUrl();
    const postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
    
    const content = formatForFacebook(
      blogPost.title,
      blogPost.excerpt,
      postUrl,
      blogPost.category?.name
    );

    // Verificar se tem ID da página
    const pageId = facebookAccount.accountId;
    if (!pageId) {
      return { success: false, error: "ID da página Facebook não encontrado" };
    }

    // Publicar no Facebook usando Graph API
    const publishUrl = `https://graph.facebook.com/v25.0/${pageId}/feed`;
    const publishBody: any = {
      message: content.text,
      access_token: facebookAccount.accessToken,
      link: postUrl
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
      console.error("Facebook auto-publish error:", publishResponse.status, errorData);
      
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
          blogPostId: blogPost.id,
          platform: "facebook",
          content: content.text,
          status: "failed",
          errorMessage: errorData.error?.message || `HTTP ${publishResponse.status}`
        }
      });

      return { success: false, error: errorData.error?.message || "Erro ao publicar no Facebook" };
    }

    const responseData = await publishResponse.json();
    const fbPostId = responseData.id;
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
    await prisma.socialPublication.create({
      data: {
        accountId: facebookAccount.id,
        blogPostId: blogPost.id,
        platform: "facebook",
        postId: fbPostId,
        postUrl: fbPostUrl,
        content: content.text,
        imageUrl: blogPost.featuredImage,
        status: "published",
        publishedAt: new Date()
      }
    });

    return { success: true, postUrl: fbPostUrl || undefined };
  } catch (error) {
    console.error("Erro ao auto-publicar no Facebook:", error);
    return { success: false, error: "Erro interno ao publicar" };
  }
}

// Imagens de fallback para Instagram por categoria - Pool expandido
const INSTAGRAM_FALLBACK_IMAGES: Record<string, string[]> = {
  'seguranca': [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?w=1080&h=1080&fit=crop',
  ],
  'cloud': [
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1560732488-6b0df240254a?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1535557597501-0fee0a500c57?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1080&h=1080&fit=crop',
  ],
  'gestao': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1080&h=1080&fit=crop',
  ],
  'suporte': [
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1560264280-88b68371db39?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1553484771-371a605b060b?w=1080&h=1080&fit=crop',
  ],
  'infraestrutura': [
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1600267185393-e158a98703de?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=1080&h=1080&fit=crop',
  ],
  'transformacao': [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1080&h=1080&fit=crop',
  ],
  'default': [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=1080&h=1080&fit=crop',
  ]
};

// Armazenar imagens usadas recentemente para Instagram
const recentInstagramImages: string[] = [];
const MAX_RECENT_INSTAGRAM = 15;

// Função para selecionar imagem de fallback para Instagram (evitando repetição)
function selectInstagramFallbackImage(serviceType: string, title: string, categoryName?: string): string {
  const searchText = `${serviceType || ''} ${title || ''} ${categoryName || ''}`.toLowerCase();
  
  let category = 'default';
  if (searchText.includes('segurança') || searchText.includes('antivírus') || searchText.includes('proteção') || searchText.includes('firewall') || searchText.includes('ransomware') || searchText.includes('hacker') || searchText.includes('cyber')) {
    category = 'seguranca';
  } else if (searchText.includes('cloud') || searchText.includes('nuvem') || searchText.includes('backup') || searchText.includes('azure') || searchText.includes('aws')) {
    category = 'cloud';
  } else if (searchText.includes('gestão') || searchText.includes('gerenciamento') || searchText.includes('monitoramento') || searchText.includes('ti')) {
    category = 'gestao';
  } else if (searchText.includes('suporte') || searchText.includes('help desk') || searchText.includes('noc') || searchText.includes('atendimento')) {
    category = 'suporte';
  } else if (searchText.includes('servidor') || searchText.includes('infraestrutura') || searchText.includes('rede') || searchText.includes('datacenter')) {
    category = 'infraestrutura';
  } else if (searchText.includes('transformação') || searchText.includes('digital') || searchText.includes('consultoria') || searchText.includes('projeto') || searchText.includes('ia') || searchText.includes('inteligência')) {
    category = 'transformacao';
  }
  
  const categoryImages = INSTAGRAM_FALLBACK_IMAGES[category];
  
  // Filtrar imagens que não foram usadas recentemente
  let availableImages = categoryImages.filter(img => !recentInstagramImages.includes(img));
  
  // Se todas foram usadas, limpar histórico
  if (availableImages.length === 0) {
    recentInstagramImages.splice(0, Math.floor(recentInstagramImages.length / 2));
    availableImages = categoryImages;
  }
  
  // Selecionar imagem aleatória
  const selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];
  
  // Adicionar ao histórico
  recentInstagramImages.push(selectedImage);
  if (recentInstagramImages.length > MAX_RECENT_INSTAGRAM) {
    recentInstagramImages.shift();
  }
  
  return selectedImage;
}

// Função para publicar automaticamente no Instagram
async function autoPublishToInstagram(blogPost: any): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    // Verificar se há conta Instagram conectada com autoPost habilitado
    const instagramAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "instagram",
        isConnected: true,
        autoPost: true,
        active: true
      }
    });

    if (!instagramAccount) {
      return { success: false, error: "Instagram não configurado para auto-post" };
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
      return { success: false, error: "Token do Instagram expirado" };
    }

    // Preparar conteúdo
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

    // Verificar se tem ID da conta Instagram
    const igUserId = instagramAccount.accountId;
    if (!igUserId) {
      return { success: false, error: "ID da conta Instagram não encontrado" };
    }

    // Instagram requer imagem - usar featured image do post ou gerar fallback
    let imageUrl = blogPost.featuredImage;
    
    // Se não tem imagem destacada, usar imagem de fallback baseada no tema
    if (!imageUrl) {
      console.log("Instagram: Post sem imagem destacada, usando fallback inteligente");
      imageUrl = selectInstagramFallbackImage(
        blogPost.serviceType,
        blogPost.title,
        blogPost.category?.name
      );
    }
    
    // Se a imagem for relativa (local), converter para URL absoluta
    if (imageUrl.startsWith("/")) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }

    // Etapa 1: Criar container de mídia
    const containerUrl = `https://graph.facebook.com/v25.0/${igUserId}/media`;
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption: content.text,
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
          blogPostId: blogPost.id,
          platform: "instagram",
          content: content.text,
          imageUrl: imageUrl,
          status: "failed",
          errorMessage: errorData.error?.message || `HTTP ${containerResponse.status}`
        }
      });

      return { success: false, error: errorData.error?.message || "Erro ao criar mídia no Instagram" };
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
          blogPostId: blogPost.id,
          platform: "instagram",
          content: content.text,
          imageUrl: imageUrl,
          status: "failed",
          errorMessage: errorData.error?.message || `HTTP ${publishResponse.status}`
        }
      });

      return { success: false, error: errorData.error?.message || "Erro ao publicar no Instagram" };
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
    await prisma.socialPublication.create({
      data: {
        accountId: instagramAccount.id,
        blogPostId: blogPost.id,
        platform: "instagram",
        postId: igPostId,
        postUrl: igPostUrl,
        content: content.text,
        imageUrl: imageUrl,
        status: "published",
        publishedAt: new Date()
      }
    });

    return { success: true, postUrl: igPostUrl || undefined };
  } catch (error) {
    console.error("Erro ao auto-publicar no Instagram:", error);
    return { success: false, error: "Erro interno ao publicar" };
  }
}

// Função para enviar email de notificação
async function sendNotificationEmail(
  subject: string,
  htmlBody: string,
  recipientEmail?: string
) {
  try {
    const result = await sendSmtpEmail({
      to: recipientEmail || "marcio@m3solutions.com.br",
      subject,
      html: htmlBody,
    });
    return result.success;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { action, scheduledAt } = await request.json();

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    let newStatus: PostStatus;
    let updateData: any = {};

    switch (action) {
      case "submit_review":
        newStatus = "REVIEW";
        updateData.reviewToken = crypto.randomBytes(32).toString("hex");
        break;
      case "approve":
        newStatus = "APPROVED";
        updateData.approvedById = (session.user as any).id;
        updateData.approvedAt = new Date();
        break;
      case "reject":
        newStatus = "DRAFT";
        break;
      case "publish":
        newStatus = "PUBLISHED";
        updateData.publishedAt = new Date();
        break;
      case "schedule":
        if (!scheduledAt) {
          return NextResponse.json({ error: "Data de agendamento é obrigatória" }, { status: 400 });
        }
        newStatus = "SCHEDULED";
        updateData.scheduledAt = new Date(scheduledAt);
        break;
      case "archive":
        newStatus = "ARCHIVED";
        break;
      case "unarchive":
        newStatus = "DRAFT";
        break;
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    // Validate transition
    const allowedTransitions = validTransitions[post.status];
    if (!allowedTransitions?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Transição de ${post.status} para ${newStatus} não é permitida` },
        { status: 400 }
      );
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        status: newStatus,
        ...updateData
      },
      include: {
        category: true,
        author: true,
        createdBy: { select: { email: true, name: true } }
      }
    });

    // Se o post é GLOBAL e foi aprovado ou publicado, propagar para sub-páginas regionais
    if (updatedPost.seoLevel === "GLOBAL" && updatedPost.serviceType) {
      const shouldPropagateStatus = ["approve", "publish", "schedule"].includes(action);
      
      if (shouldPropagateStatus) {
        // Buscar todas as sub-páginas regionais do mesmo serviceType
        const regionalPosts = await prisma.blogPost.findMany({
          where: {
            serviceType: updatedPost.serviceType,
            seoLevel: { in: ["CITY", "STATE"] },
            id: { not: id }, // Excluir o próprio post
            // Só propagar se a sub-página estiver em um status anterior
            status: { in: action === "approve" ? ["DRAFT", "REVIEW"] : action === "publish" ? ["APPROVED", "SCHEDULED"] : ["APPROVED"] }
          },
          select: { id: true, title: true, status: true }
        });

        if (regionalPosts.length > 0) {
          // Preparar dados de atualização para sub-páginas
          const regionalUpdateData: any = { status: newStatus };
          
          if (action === "approve") {
            regionalUpdateData.approvedById = (session.user as any).id;
            regionalUpdateData.approvedAt = new Date();
          } else if (action === "publish") {
            regionalUpdateData.publishedAt = new Date();
          } else if (action === "schedule" && scheduledAt) {
            regionalUpdateData.scheduledAt = new Date(scheduledAt);
          }

          // Atualizar todas as sub-páginas regionais
          const updateResult = await prisma.blogPost.updateMany({
            where: {
              id: { in: regionalPosts.map(p => p.id) }
            },
            data: regionalUpdateData
          });

          console.log(`[Workflow] Propagado ${action} do post GLOBAL "${updatedPost.title}" para ${updateResult.count} sub-páginas regionais`);

          // Log audit para propagação
          await prisma.auditLog.create({
            data: {
              action: `POST_BULK_${action.toUpperCase()}`,
              entityType: "BlogPost",
              entityId: id,
              details: `Status propagado de GLOBAL para ${updateResult.count} sub-páginas regionais (${updatedPost.serviceType})`,
              userId: (session.user as any).id
            }
          });
        }
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: `POST_${action.toUpperCase()}`,
        entityType: "BlogPost",
        entityId: id,
        details: `Status alterado de ${post.status} para ${newStatus}: ${post.title}`,
        userId: (session.user as any).id
      }
    });

    // Enviar email de notificação para ações específicas
    const baseUrl = getSiteUrl();
    const postUrl = `${baseUrl}/noticias/${updatedPost.slug}`;
    const editorUrl = `${baseUrl}/gestor/posts/${id}/editar`;

    if (action === "submit_review") {
      // Email para o aprovador quando post é enviado para revisão
      // Link público com token - não requer login
      const reviewUrl = `${baseUrl}/revisar/${id}?token=${updateData.reviewToken}`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #F97316; padding-bottom: 10px;">
            📝 Novo Post Aguardando Revisão
          </h2>
          <div style="background: #FFF7ED; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Título:</strong> ${updatedPost.title}</p>
            <p style="margin: 10px 0;"><strong>Categoria:</strong> ${updatedPost.category?.name || "Sem categoria"}</p>
            <p style="margin: 10px 0;"><strong>Autor:</strong> ${updatedPost.author?.name || "Não definido"}</p>
            <p style="margin: 10px 0;"><strong>Enviado por:</strong> ${(session.user as any).name || (session.user as any).email}</p>
          </div>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Resumo:</strong></p>
            <p style="color: #666;">${updatedPost.excerpt || "Sem resumo"}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}" style="background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Revisar e Aprovar Post
            </a>
          </div>
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
            Este link é exclusivo para revisão desta pauta. Não compartilhe com terceiros.
          </p>
          <p style="color: #666; font-size: 12px;">
            Enviado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </p>
        </div>
      `;
      await sendNotificationEmail(`[Revisão] Novo post: ${updatedPost.title}`, htmlBody);
    }

    if (action === "approve") {
      // Email para o redator quando post é aprovado
      const creatorEmail = updatedPost.createdBy?.email;
      if (creatorEmail) {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
              ✅ Seu Post foi Aprovado!
            </h2>
            <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Título:</strong> ${updatedPost.title}</p>
              <p style="margin: 10px 0;"><strong>Aprovado por:</strong> ${(session.user as any).name || (session.user as any).email}</p>
            </div>
            <p style="color: #666; margin: 20px 0;">
              O post está pronto para ser publicado ou agendado. Acesse o editor para definir a data de publicação.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${editorUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Ver Post
              </a>
            </div>
          </div>
        `;
        await sendNotificationEmail(`[Aprovado] ${updatedPost.title}`, htmlBody, creatorEmail);
      }
    }

    if (action === "reject") {
      // Email para o redator quando post é rejeitado
      const creatorEmail = updatedPost.createdBy?.email;
      if (creatorEmail) {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #EF4444; padding-bottom: 10px;">
              ⚠️ Revisão Solicitada
            </h2>
            <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Título:</strong> ${updatedPost.title}</p>
              <p style="margin: 10px 0;"><strong>Revisado por:</strong> ${(session.user as any).name || (session.user as any).email}</p>
            </div>
            <p style="color: #666; margin: 20px 0;">
              O post precisa de ajustes antes de ser aprovado. Por favor, revise o conteúdo e reenvie para revisão.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${editorUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Editar Post
              </a>
            </div>
          </div>
        `;
        await sendNotificationEmail(`[Revisão Solicitada] ${updatedPost.title}`, htmlBody, creatorEmail);
      }
    }

    if (action === "publish") {
      // Email para o redator quando post é publicado
      const creatorEmail = updatedPost.createdBy?.email;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
            🎉 Post Publicado com Sucesso!
          </h2>
          <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Título:</strong> ${updatedPost.title}</p>
            <p style="margin: 10px 0;"><strong>URL do Post:</strong></p>
            <a href="${postUrl}" style="color: #10B981; word-break: break-all;">${postUrl}</a>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${postUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ver Post Publicado
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            Publicado em: ${new Date().toLocaleString("pt-BR")}
          </p>
        </div>
      `;
      // Envia para o redator e para o admin
      if (creatorEmail) {
        await sendNotificationEmail(`[Publicado] ${updatedPost.title}`, htmlBody, creatorEmail);
      }
      await sendNotificationEmail(`[Publicado] ${updatedPost.title}`, htmlBody);

      // Auto-publicar nas redes sociais configuradas (apenas posts globais/nacionais)
      const isSubPage = updatedPost.geoState || updatedPost.geoCity || (updatedPost.seoLevel && updatedPost.seoLevel !== "GLOBAL");
      
      if (!isSubPage) {
        const [linkedinResult, twitterResult, facebookResult, instagramResult] = await Promise.all([
          autoPublishToLinkedIn(updatedPost),
          autoPublishToTwitter(updatedPost),
          autoPublishToFacebook(updatedPost),
          autoPublishToInstagram(updatedPost)
        ]);
        
        return NextResponse.json({
          ...updatedPost,
          socialPublish: {
            linkedin: linkedinResult,
            twitter: twitterResult,
            facebook: facebookResult,
            instagram: instagramResult
          }
        });
      } else {
        console.log(`[Workflow] Publicação social ignorada para sub-página regional: "${updatedPost.title}"`);
      }
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json({ error: "Erro ao atualizar workflow" }, { status: 500 });
  }
}
