export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Callback do OAuth do LinkedIn
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const redirectUrl = "/gestor/redes-sociais";

  // Verificar erros
  if (error) {
    console.error("LinkedIn OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`${redirectUrl}?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${redirectUrl}?error=Parâmetros inválidos`, request.url)
    );
  }

  try {
    // Verificar state para CSRF
    const savedState = await prisma.siteConfig.findFirst({
      where: { key: "linkedin_oauth_state" }
    });

    if (!savedState?.value || savedState.value !== state) {
      return NextResponse.redirect(
        new URL(`${redirectUrl}?error=Estado inválido`, request.url)
      );
    }

    // Buscar credenciais
    const clientIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "linkedin_client_id" }
    });
    const clientSecretConfig = await prisma.siteConfig.findFirst({
      where: { key: "linkedin_client_secret" }
    });

    if (!clientIdConfig?.value || !clientSecretConfig?.value) {
      return NextResponse.redirect(
        new URL(`${redirectUrl}?error=Credenciais não configuradas`, request.url)
      );
    }

    // Trocar code por access token
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/linkedin/callback`;
    
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: clientIdConfig.value,
        client_secret: clientSecretConfig.value
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("LinkedIn token error:", errorData);
      return NextResponse.redirect(
        new URL(`${redirectUrl}?error=Erro ao obter token`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = tokenData;

    // Buscar informações do perfil
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    let profileData: any = {};
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    // Calcular expirações
    const expiresAt = new Date(Date.now() + (expires_in || 5184000) * 1000); // Default 60 dias
    const refreshExpiresAt = refresh_token_expires_in 
      ? new Date(Date.now() + refresh_token_expires_in * 1000)
      : null;

    // Tentar buscar o vanity URL do perfil (se disponível)
    let vanityUrl: string | null = null;
    try {
      // A API v2/me pode retornar o vanityName em alguns casos
      const meResponse = await fetch("https://api.linkedin.com/v2/me?projection=(id,vanityName)", {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        if (meData.vanityName) {
          vanityUrl = `https://www.linkedin.com/in/${meData.vanityName}`;
        }
      }
    } catch (e) {
      console.log("Não foi possível obter vanityName do LinkedIn");
    }

    // Se não conseguiu o vanityName, usa a URL da empresa M3Solutions
    const profileUrl = vanityUrl || "https://www.linkedin.com/company/m3solutionsbr";

    // Salvar ou atualizar conta
    await prisma.socialMediaAccount.upsert({
      where: { platform: "linkedin" },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || null,
        expiresAt,
        refreshExpiresAt,
        accountId: profileData.sub || null,
        accountName: profileData.name || profileData.given_name || null,
        profileUrl,
        profileImage: profileData.picture || null,
        scope: "openid profile w_member_social",
        isConnected: true,
        lastError: null,
        active: true,
        updatedAt: new Date()
      },
      create: {
        platform: "linkedin",
        accessToken: access_token,
        refreshToken: refresh_token || null,
        expiresAt,
        refreshExpiresAt,
        accountId: profileData.sub || null,
        accountName: profileData.name || profileData.given_name || null,
        profileUrl,
        profileImage: profileData.picture || null,
        scope: "openid profile w_member_social",
        isConnected: true,
        autoPost: true
      }
    });

    // Limpar state
    await prisma.siteConfig.delete({
      where: { key: "linkedin_oauth_state" }
    }).catch(() => {}); // Ignorar erro se não existir

    return NextResponse.redirect(
      new URL(`${redirectUrl}?success=LinkedIn conectado com sucesso!`, request.url)
    );

  } catch (error) {
    console.error("Erro no callback do LinkedIn:", error);
    return NextResponse.redirect(
      new URL(`${redirectUrl}?error=Erro ao processar autorização`, request.url)
    );
  }
}
