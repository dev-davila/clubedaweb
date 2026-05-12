export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import * as crypto from "crypto";

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

// Gerar header OAuth 1.0a
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

// GET - Testar conexão com Twitter API v2 usando OAuth 1.0a
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const credentials = getTwitterCredentials();
    if (!credentials || !credentials.consumerKey || !credentials.accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Credenciais do Twitter não configuradas",
          configured: false
        },
        { status: 400 }
      );
    }

    // Testar com API v2 - /users/me
    const apiUrl = "https://api.twitter.com/2/users/me";
    const authHeader = generateOAuth1Header(
      "GET",
      apiUrl,
      credentials.consumerKey,
      credentials.consumerSecret,
      credentials.accessToken,
      credentials.accessTokenSecret
    );

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Twitter test error:", response.status, errorData);
      
      return NextResponse.json({
        success: false,
        configured: true,
        error: errorData.detail || errorData.title || errorData.errors?.[0]?.message || `HTTP ${response.status}`,
        status: response.status
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      configured: true,
      user: {
        id: data.data?.id,
        name: data.data?.name,
        username: data.data?.username
      }
    });

  } catch (error) {
    console.error("Erro ao testar Twitter:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao testar conexão" },
      { status: 500 }
    );
  }
}
