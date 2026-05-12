export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { formatForTwitter } from "@/lib/social-media";
import * as crypto from "crypto";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { socialPublishSchema } from "@/lib/validation-schemas";

// Carregar credenciais do Twitter das variáveis de ambiente
function getTwitterCredentials() {
  return {
    consumerKey: process.env.TWITTER_CONSUMER_KEY || "",
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET || "",
    accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || ""
  };
}

// Gerar assinatura OAuth 1.0a
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
}

// Gerar header OAuth 1.0a para API v2
function generateOAuth1Header(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0"
  };

  oauthParams.oauth_signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret,
    accessTokenSecret
  );

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`);
  
  return `OAuth ${headerParts.join(", ")}`;
}

// POST - Publicar no Twitter/X usando API v2 com OAuth 1.0a
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (20 publishes per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`social-publish-twitter-${ip}`, 20, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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

    // Carregar credenciais OAuth 1.0a
    const credentials = getTwitterCredentials();
    if (!credentials || !credentials.consumerKey || !credentials.accessToken) {
      return NextResponse.json(
        { error: "Credenciais do Twitter não configuradas" },
        { status: 400 }
      );
    }

    let tweetText = customText;
    let blogPost: any = null;

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
        const postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
        const content = formatForTwitter(
          blogPost.title,
          blogPost.excerpt,
          postUrl,
          blogPost.category?.name
        );
        tweetText = content.text;
      }
    }

    if (!tweetText) {
      return NextResponse.json(
        { error: "Texto do tweet é obrigatório" },
        { status: 400 }
      );
    }

    // Gerar header OAuth 1.0a para API v2
    const twitterApiUrl = "https://api.twitter.com/2/tweets";
    const authHeader = generateOAuth1Header(
      "POST",
      twitterApiUrl,
      credentials.consumerKey,
      credentials.consumerSecret,
      credentials.accessToken,
      credentials.accessTokenSecret
    );

    // Publicar no Twitter usando API v2 com OAuth 1.0a
    const publishResponse = await fetch(twitterApiUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: tweetText
      })
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      console.error("Twitter publish error:", publishResponse.status, errorData);
      
      const errorMessage = errorData.detail || errorData.title || errorData.errors?.[0]?.message || `HTTP ${publishResponse.status}`;

      return NextResponse.json(
        { error: `Erro ao publicar no Twitter: ${errorMessage}` },
        { status: publishResponse.status }
      );
    }

    const responseData = await publishResponse.json();
    const tweetId = responseData.data?.id;
    const tweetUrl = tweetId ? `https://x.com/i/status/${tweetId}` : null;

    return NextResponse.json({
      success: true,
      tweetId,
      tweetUrl,
      blogPostId: blogPost?.id
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

    // Verificar se credenciais estão configuradas
    const credentials = getTwitterCredentials();
    const isConfigured = !!(credentials?.consumerKey && credentials?.accessToken);

    const baseUrl = getSiteUrl();
    const postUrl = `${baseUrl}/noticias/${blogPost.slug}`;
    
    const content = formatForTwitter(
      blogPost.title,
      blogPost.excerpt,
      postUrl,
      blogPost.category?.name
    );

    return NextResponse.json({
      content,
      postUrl,
      account: {
        isConnected: isConfigured,
        accountName: isConfigured ? "Twitter/X (OAuth 1.0a)" : null,
        tokenValid: isConfigured
      }
    });

  } catch (error) {
    console.error("Erro ao gerar preview:", error);
    return NextResponse.json(
      { error: "Erro ao gerar preview" },
      { status: 500 }
    );
  }
}
