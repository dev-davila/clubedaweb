export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { prisma } from "@/lib/db";

// GET - Callback do OAuth do Instagram
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Usar NEXTAUTH_URL para redirecionamento correto
  const baseUrl = getSiteUrl();
  const redirectUrl = `${baseUrl}/gestor/redes-sociais`;

  // Verificar erros
  if (error) {
    console.error("Instagram OAuth error:", error, errorDescription);
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
    // Verificar state
    const savedState = await prisma.siteConfig.findFirst({
      where: { key: "instagram_oauth_state" }
    });

    if (!savedState?.value || savedState.value !== state) {
      return NextResponse.redirect(
        `${redirectUrl}?error=Estado inválido`
      );
    }

    // Buscar credenciais
    const appIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "instagram_app_id" }
    });
    const appSecretConfig = await prisma.siteConfig.findFirst({
      where: { key: "instagram_app_secret" }
    });

    if (!appIdConfig?.value || !appSecretConfig?.value) {
      return NextResponse.redirect(
        `${redirectUrl}?error=Credenciais não configuradas`
      );
    }

    // Trocar code por access token
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/instagram/callback`;
    
    const tokenUrl = new URL("https://graph.facebook.com/v25.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appIdConfig.value);
    tokenUrl.searchParams.set("client_secret", appSecretConfig.value);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Instagram token error:", errorData);
      return NextResponse.redirect(
        `${redirectUrl}?error=Erro ao obter token: ${errorData.error?.message || "Falha"}`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    // Trocar por Long-Lived Token (válido por ~60 dias)
    const longLivedUrl = new URL("https://graph.facebook.com/v25.0/oauth/access_token");
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", appIdConfig.value);
    longLivedUrl.searchParams.set("client_secret", appSecretConfig.value);
    longLivedUrl.searchParams.set("fb_exchange_token", access_token);

    const longLivedResponse = await fetch(longLivedUrl.toString());
    let longLivedToken = access_token;
    let tokenExpiry = expires_in || 3600;

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json();
      longLivedToken = longLivedData.access_token;
      tokenExpiry = longLivedData.expires_in || 5184000; // ~60 dias
    }

    // Buscar páginas administradas pelo usuário com Instagram conectado
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url,name}&access_token=${longLivedToken}`
    );

    let pages: any[] = [];
    let instagramAccount: any = null;
    let pageAccessToken: string | null = null;

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      pages = pagesData.data || [];
      
      // Encontrar a primeira página com Instagram Business Account conectado
      for (const page of pages) {
        if (page.instagram_business_account) {
          instagramAccount = page.instagram_business_account;
          pageAccessToken = page.access_token;
          break;
        }
      }
    }

    if (!instagramAccount) {
      return NextResponse.redirect(
        `${redirectUrl}?error=Nenhuma conta Instagram Business encontrada. Conecte uma página do Facebook ao seu Instagram Business.`
      );
    }

    // Calcular expiração
    const expiresAt = new Date(Date.now() + tokenExpiry * 1000);

    // Salvar ou atualizar conta Instagram
    await prisma.socialMediaAccount.upsert({
      where: { platform: "instagram" },
      update: {
        accessToken: pageAccessToken || longLivedToken,
        refreshToken: longLivedToken, // User token para refresh
        expiresAt,
        accountId: instagramAccount.id,
        accountName: instagramAccount.username || instagramAccount.name,
        profileUrl: `https://instagram.com/${instagramAccount.username}`,
        profileImage: instagramAccount.profile_picture_url || null,
        scope: "instagram_basic,instagram_content_publish",
        isConnected: true,
        lastError: null,
        active: true,
        updatedAt: new Date()
      },
      create: {
        platform: "instagram",
        accessToken: pageAccessToken || longLivedToken,
        refreshToken: longLivedToken,
        expiresAt,
        accountId: instagramAccount.id,
        accountName: instagramAccount.username || instagramAccount.name,
        profileUrl: `https://instagram.com/${instagramAccount.username}`,
        profileImage: instagramAccount.profile_picture_url || null,
        scope: "instagram_basic,instagram_content_publish",
        isConnected: true,
        autoPost: true
      }
    });

    // Limpar state
    await prisma.siteConfig.deleteMany({
      where: { key: "instagram_oauth_state" }
    });

    const successMessage = `Instagram conectado! Conta: @${instagramAccount.username || instagramAccount.name}`;

    return NextResponse.redirect(
      `${redirectUrl}?success=${encodeURIComponent(successMessage)}`
    );

  } catch (error) {
    console.error("Erro no callback do Instagram:", error);
    return NextResponse.redirect(
      `${redirectUrl}?error=Erro ao processar autorização`
    );
  }
}
