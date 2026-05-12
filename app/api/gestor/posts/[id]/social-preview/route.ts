import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  formatForLinkedIn,
  formatForTwitter,
  formatForFacebook,
  formatForInstagram,
  generateHashtags,
  PLATFORM_LIMITS,
  isTokenValid
} from "@/lib/social-media";

export const dynamic = "force-dynamic";

interface SocialPreview {
  platform: string;
  text: string;
  characterCount: number;
  maxCharacters: number;
  hashtags: string[];
  connected: boolean;
  tokenValid: boolean;
  autoPostEnabled: boolean;
  accountName: string | null;
  accountImage: string | null;
  expiresAt: Date | null;
  lastError: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Buscar post
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: {
        category: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Sub-páginas regionais não têm publicação em redes sociais
    if (post.geoState || post.geoCity || (post.seoLevel && post.seoLevel !== "GLOBAL")) {
      return NextResponse.json({ error: "Publicação em redes sociais disponível apenas para posts globais/nacionais" }, { status: 403 });
    }

    // Buscar todas as contas de redes sociais
    const accounts = await prisma.socialMediaAccount.findMany({
      where: { active: true }
    });

    const baseUrl = getSiteUrl();
    const postUrl = `${baseUrl}/noticias/${post.slug}`;

    // Gerar hashtags baseadas no post
    const hashtags = generateHashtags(
      post.title,
      post.category?.name,
      []
    );

    // Gerar previews para cada plataforma
    const previews: SocialPreview[] = [];

    // LinkedIn
    const linkedinAccount = accounts.find(a => a.platform === "linkedin");
    const linkedinContent = formatForLinkedIn(
      post.title,
      post.excerpt,
      postUrl,
      hashtags
    );
    previews.push({
      platform: "linkedin",
      text: linkedinContent.text,
      characterCount: linkedinContent.text.length,
      maxCharacters: PLATFORM_LIMITS.linkedin.maxChars,
      hashtags: linkedinContent.hashtags,
      connected: linkedinAccount?.isConnected || false,
      tokenValid: linkedinAccount ? isTokenValid(linkedinAccount.expiresAt) : false,
      autoPostEnabled: linkedinAccount?.autoPost || false,
      accountName: linkedinAccount?.accountName || null,
      accountImage: linkedinAccount?.profileImage || null,
      expiresAt: linkedinAccount?.expiresAt || null,
      lastError: linkedinAccount?.lastError || null
    });

    // Twitter/X
    const twitterAccount = accounts.find(a => a.platform === "twitter");
    const twitterContent = formatForTwitter(
      post.title,
      post.excerpt,
      postUrl,
      post.category?.name
    );
    previews.push({
      platform: "twitter",
      text: twitterContent.text,
      characterCount: twitterContent.text.length,
      maxCharacters: PLATFORM_LIMITS.twitter.maxChars,
      hashtags: twitterContent.hashtags,
      connected: twitterAccount?.isConnected || false,
      tokenValid: twitterAccount ? isTokenValid(twitterAccount.expiresAt) : false,
      autoPostEnabled: twitterAccount?.autoPost || false,
      accountName: twitterAccount?.accountName || null,
      accountImage: twitterAccount?.profileImage || null,
      expiresAt: twitterAccount?.expiresAt || null,
      lastError: twitterAccount?.lastError || null
    });

    // Facebook
    const facebookAccount = accounts.find(a => a.platform === "facebook");
    const facebookContent = formatForFacebook(
      post.title,
      post.excerpt,
      postUrl,
      post.category?.name
    );
    previews.push({
      platform: "facebook",
      text: facebookContent.text,
      characterCount: facebookContent.text.length,
      maxCharacters: PLATFORM_LIMITS.facebook.maxChars,
      hashtags: facebookContent.hashtags,
      connected: facebookAccount?.isConnected || false,
      tokenValid: facebookAccount ? isTokenValid(facebookAccount.expiresAt) : false,
      autoPostEnabled: facebookAccount?.autoPost || false,
      accountName: facebookAccount?.accountName || null,
      accountImage: facebookAccount?.profileImage || null,
      expiresAt: facebookAccount?.expiresAt || null,
      lastError: facebookAccount?.lastError || null
    });

    // Instagram
    const instagramAccount = accounts.find(a => a.platform === "instagram");
    
    // Buscar URL configurada da bio para Instagram
    const bioLinkConfig = await prisma.siteConfig.findFirst({
      where: { key: "instagram_bio_link_url" }
    });
    const bioLinkPath = bioLinkConfig?.value || "/noticias";
    const bioLinkUrl = `${baseUrl}${bioLinkPath.startsWith("/") ? bioLinkPath : "/" + bioLinkPath}`;
    
    const instagramContent = formatForInstagram(
      post.title,
      post.excerpt,
      postUrl,
      post.category?.name,
      undefined, // customTemplate
      bioLinkUrl
    );
    previews.push({
      platform: "instagram",
      text: instagramContent.text,
      characterCount: instagramContent.text.length,
      maxCharacters: PLATFORM_LIMITS.instagram.maxChars,
      hashtags: instagramContent.hashtags,
      connected: instagramAccount?.isConnected || false,
      tokenValid: instagramAccount ? isTokenValid(instagramAccount.expiresAt) : false,
      autoPostEnabled: instagramAccount?.autoPost || false,
      accountName: instagramAccount?.accountName || null,
      accountImage: instagramAccount?.profileImage || null,
      expiresAt: instagramAccount?.expiresAt || null,
      lastError: instagramAccount?.lastError || null
    });

    // Verificar publicações anteriores deste post
    const existingPublications = await prisma.socialPublication.findMany({
      where: {
        blogPostId: postId,
        status: "published"
      },
      select: {
        platform: true,
        postUrl: true,
        publishedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      postId,
      postTitle: post.title,
      postUrl,
      featuredImage: post.featuredImage,
      previews,
      existingPublications
    });

  } catch (error) {
    console.error("Erro ao gerar previews:", error);
    return NextResponse.json(
      { error: "Erro ao gerar previews" },
      { status: 500 }
    );
  }
}
