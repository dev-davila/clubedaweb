export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import crypto from "crypto";

// GET - Iniciar fluxo OAuth do Instagram (via Facebook)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar credenciais do Facebook (Instagram usa as mesmas)
    const appIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "instagram_app_id" }
    });

    if (!appIdConfig?.value) {
      return NextResponse.json(
        { error: "App ID do Instagram não configurado" },
        { status: 400 }
      );
    }

    // Gerar state para CSRF protection
    const state = crypto.randomBytes(16).toString("hex");

    // Salvar state temporariamente
    await prisma.siteConfig.upsert({
      where: { key: "instagram_oauth_state" },
      update: { value: state },
      create: { key: "instagram_oauth_state", value: state, category: "temp" }
    });

    // Montar URL de autorização do Facebook (Instagram usa Facebook OAuth)
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/instagram/callback`;
    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement",
      "business_management"
    ];
    
    const authUrl = new URL("https://www.facebook.com/v25.0/dialog/oauth");
    authUrl.searchParams.set("client_id", appIdConfig.value);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes.join(","));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("Erro ao iniciar OAuth do Instagram:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar autorização" },
      { status: 500 }
    );
  }
}
