export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar conta do Twitter
    const twitterAccount = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: "twitter",
        active: true
      }
    });

    if (!twitterAccount) {
      return NextResponse.json(
        { error: "Conta do Twitter não encontrada" },
        { status: 404 }
      );
    }

    if (!twitterAccount.refreshToken) {
      return NextResponse.json(
        { error: "Refresh token não disponível. Reconecte a conta." },
        { status: 400 }
      );
    }

    // Buscar credenciais do Twitter
    const clientIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "twitter_client_id" }
    });
    const clientSecretConfig = await prisma.siteConfig.findFirst({
      where: { key: "twitter_client_secret" }
    });

    if (!clientIdConfig?.value || !clientSecretConfig?.value) {
      return NextResponse.json(
        { error: "Credenciais do Twitter não configuradas" },
        { status: 400 }
      );
    }

    // Renovar token usando o refresh token
    const basicAuth = Buffer.from(
      `${clientIdConfig.value}:${clientSecretConfig.value}`
    ).toString("base64");

    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: twitterAccount.refreshToken,
        client_id: clientIdConfig.value
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("Twitter token refresh error:", tokenResponse.status, errorData);
      
      // Marcar conta como desconectada se o refresh token for inválido
      if (tokenResponse.status === 400 || tokenResponse.status === 401) {
        await prisma.socialMediaAccount.update({
          where: { id: twitterAccount.id },
          data: {
            isConnected: false,
            lastError: "Refresh token inválido. Reconecte a conta."
          }
        });
      }

      return NextResponse.json(
        { error: errorData.error_description || "Erro ao renovar token" },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();

    // Calcular nova data de expiração
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 7200));

    // Atualizar conta com novo token
    await prisma.socialMediaAccount.update({
      where: { id: twitterAccount.id },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || twitterAccount.refreshToken,
        expiresAt,
        isConnected: true,
        lastError: null
      }
    });

    return NextResponse.json({
      success: true,
      message: "Token renovado com sucesso",
      expiresAt
    });

  } catch (error) {
    console.error("Erro ao renovar token do Twitter:", error);
    return NextResponse.json(
      { error: "Erro interno ao renovar token" },
      { status: 500 }
    );
  }
}
