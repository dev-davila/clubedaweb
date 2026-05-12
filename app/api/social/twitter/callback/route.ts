import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// Helper para obter URL base correta
function getBaseUrl(): string {
  const headersList = headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  
  // Se o host parece ser interno (container ID), usar NEXTAUTH_URL de produção
  if (host.includes("localhost") || /^[a-f0-9]{12}/.test(host) || host.includes(":3000")) {
    return getSiteUrl();
  }
  
  return `${protocol}://${host}`;
}

// GET - Callback do OAuth do Twitter/X
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = getBaseUrl();
  const redirectUrl = `${baseUrl}/gestor/redes-sociais`;

  // Verificar erros
  if (error) {
    console.error("Twitter OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${redirectUrl}?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${redirectUrl}?error=Parâmetros inválidos`
    );
  }

  try {
    // Verificar state e buscar code_verifier para PKCE
    const savedState = await prisma.siteConfig.findFirst({
      where: { key: "twitter_oauth_state" }
    });
    const savedCodeVerifier = await prisma.siteConfig.findFirst({
      where: { key: "twitter_code_verifier" }
    });

    if (!savedState?.value || savedState.value !== state) {
      return NextResponse.redirect(
        `${redirectUrl}?error=Estado inválido`
      );
    }

    // Buscar credenciais
    const clientIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "twitter_client_id" }
    });
    const clientSecretConfig = await prisma.siteConfig.findFirst({
      where: { key: "twitter_client_secret" }
    });

    if (!clientIdConfig?.value || !clientSecretConfig?.value) {
      return NextResponse.redirect(
        `${redirectUrl}?error=Credenciais não configuradas`
      );
    }

    // Trocar code por access token (usar a mesma URL base)
    const redirectUri = `${baseUrl}/api/social/twitter/callback`;
    
    const basicAuth = Buffer.from(`${clientIdConfig.value}:${clientSecretConfig.value}`).toString("base64");
    
    const tokenBody: Record<string, string> = {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientIdConfig.value
    };
    
    // Adicionar code_verifier se existir (PKCE)
    if (savedCodeVerifier?.value) {
      tokenBody.code_verifier = savedCodeVerifier.value;
    }

    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`
      },
      body: new URLSearchParams(tokenBody)
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Twitter token error:", errorData);
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent(`Erro ao obter token: ${errorData.error_description || errorData.error}`)}`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in, refresh_token, scope } = tokenData;

    // Buscar informações do perfil
    const profileResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username", {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    let profileData: any = { data: {} };
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    // Calcular expirações
    const expiresAt = new Date(Date.now() + (expires_in || 7200) * 1000); // Default 2 horas

    // Salvar ou atualizar conta
    await prisma.socialMediaAccount.upsert({
      where: { platform: "twitter" },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || null,
        expiresAt,
        accountId: profileData.data?.id || null,
        accountName: profileData.data?.name || profileData.data?.username || null,
        profileUrl: profileData.data?.username ? `https://x.com/${profileData.data.username}` : null,
        profileImage: profileData.data?.profile_image_url || null,
        scope: scope || "tweet.read tweet.write users.read offline.access",
        isConnected: true,
        lastError: null,
        active: true,
        updatedAt: new Date()
      },
      create: {
        platform: "twitter",
        accessToken: access_token,
        refreshToken: refresh_token || null,
        expiresAt,
        accountId: profileData.data?.id || null,
        accountName: profileData.data?.name || profileData.data?.username || null,
        profileUrl: profileData.data?.username ? `https://x.com/${profileData.data.username}` : null,
        profileImage: profileData.data?.profile_image_url || null,
        scope: scope || "tweet.read tweet.write users.read offline.access",
        isConnected: true,
        autoPost: true
      }
    });

    // Limpar state e code_verifier
    await prisma.siteConfig.deleteMany({
      where: { key: { in: ["twitter_oauth_state", "twitter_code_verifier"] } }
    });

    return NextResponse.redirect(
      `${redirectUrl}?success=${encodeURIComponent("Twitter/X conectado com sucesso!")}`
    );

  } catch (error) {
    console.error("Erro no callback do Twitter:", error);
    return NextResponse.redirect(
      `${redirectUrl}?error=${encodeURIComponent("Erro ao processar autorização")}`
    );
  }
}
