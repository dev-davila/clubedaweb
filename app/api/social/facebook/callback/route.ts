export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { prisma } from "@/lib/db";

// GET - Callback do OAuth do Facebook
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
    console.error("Facebook OAuth error:", error, errorDescription);
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
      where: { key: "facebook_oauth_state" }
    });

    if (!savedState?.value || savedState.value !== state) {
      return NextResponse.redirect(
        `${redirectUrl}?error=Estado inválido`
      );
    }

    // Buscar credenciais
    const appIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "facebook_app_id" }
    });
    const appSecretConfig = await prisma.siteConfig.findFirst({
      where: { key: "facebook_app_secret" }
    });

    if (!appIdConfig?.value || !appSecretConfig?.value) {
      return NextResponse.redirect(
        `${redirectUrl}?error=Credenciais não configuradas`
      );
    }

    // Trocar code por access token
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/facebook/callback`;
    
    const tokenUrl = new URL("https://graph.facebook.com/v25.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appIdConfig.value);
    tokenUrl.searchParams.set("client_secret", appSecretConfig.value);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Facebook token error:", errorData);
      return NextResponse.redirect(
        `${redirectUrl}?error=Erro ao obter token: ${encodeURIComponent(errorData.error?.message || "Falha")}`
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

    // Buscar perfil do usuário
    const profileResponse = await fetch(
      `https://graph.facebook.com/v25.0/me?fields=id,name,picture&access_token=${longLivedToken}`
    );

    let profileData: any = {};
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    // Buscar páginas administradas pelo usuário
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token,picture&access_token=${longLivedToken}`
    );

    let pages: any[] = [];
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      pages = pagesData.data || [];
    }

    // Calcular expiração
    const expiresAt = new Date(Date.now() + tokenExpiry * 1000);

    // Se encontrou páginas, pegar a primeira (ou permitir escolha depois)
    const selectedPage = pages[0];

    // Salvar ou atualizar conta
    await prisma.socialMediaAccount.upsert({
      where: { platform: "facebook" },
      update: {
        accessToken: selectedPage?.access_token || longLivedToken,
        refreshToken: longLivedToken, // User token para refresh
        expiresAt,
        accountId: selectedPage?.id || profileData.id || null,
        accountName: selectedPage?.name || profileData.name || null,
        profileUrl: selectedPage?.id 
          ? `https://www.facebook.com/${selectedPage.id}` 
          : `https://www.facebook.com/${profileData.id}`,
        profileImage: selectedPage?.picture?.data?.url || profileData.picture?.data?.url || null,
        scope: "pages_manage_posts,pages_read_engagement",
        isConnected: true,
        lastError: null,
        active: true,
        updatedAt: new Date()
      },
      create: {
        platform: "facebook",
        accessToken: selectedPage?.access_token || longLivedToken,
        refreshToken: longLivedToken,
        expiresAt,
        accountId: selectedPage?.id || profileData.id || null,
        accountName: selectedPage?.name || profileData.name || null,
        profileUrl: selectedPage?.id 
          ? `https://www.facebook.com/${selectedPage.id}` 
          : `https://www.facebook.com/${profileData.id}`,
        profileImage: selectedPage?.picture?.data?.url || profileData.picture?.data?.url || null,
        scope: "pages_manage_posts,pages_read_engagement",
        isConnected: true,
        autoPost: true
      }
    });

    // Salvar lista de páginas para seleção posterior (se necessário)
    if (pages.length > 0) {
      await prisma.siteConfig.upsert({
        where: { key: "facebook_pages" },
        update: { value: JSON.stringify(pages.map(p => ({ id: p.id, name: p.name, picture: p.picture?.data?.url }))) },
        create: { key: "facebook_pages", value: JSON.stringify(pages.map(p => ({ id: p.id, name: p.name, picture: p.picture?.data?.url }))), category: "social" }
      });
    }

    // Limpar state
    await prisma.siteConfig.deleteMany({
      where: { key: "facebook_oauth_state" }
    });

    const successMessage = pages.length > 0 
      ? `Facebook conectado! Página: ${selectedPage?.name || 'N/A'}` 
      : "Facebook conectado (sem páginas encontradas)";

    return NextResponse.redirect(
      `${redirectUrl}?success=${encodeURIComponent(successMessage)}`
    );

  } catch (error) {
    console.error("Erro no callback do Facebook:", error);
    return NextResponse.redirect(
      `${redirectUrl}?error=Erro ao processar autorização`
    );
  }
}
