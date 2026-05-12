export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import crypto from "crypto";

// GET - Gerar URL de autorização OAuth
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // Buscar credenciais
    const clientIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "linkedin_client_id" }
    });

    if (!clientIdConfig?.value) {
      return NextResponse.json({ error: "LinkedIn não configurado" }, { status: 400 });
    }

    // Gerar state para CSRF protection
    const state = crypto.randomBytes(16).toString("hex");

    // Salvar state temporariamente
    await prisma.siteConfig.upsert({
      where: { key: "linkedin_oauth_state" },
      update: { value: state, updatedAt: new Date() },
      create: { key: "linkedin_oauth_state", value: state, category: "social" }
    });

    // Montar URL de autorização
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/linkedin/callback`;
    const scopes = ["openid", "profile", "w_member_social"];

    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientIdConfig.value);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", scopes.join(" "));

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("Erro ao gerar URL de auth:", error);
    return NextResponse.json({ error: "Erro ao iniciar autorização" }, { status: 500 });
  }
}
