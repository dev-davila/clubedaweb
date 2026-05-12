import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// Função para gerar code verifier para PKCE
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

// Função para gerar code challenge a partir do verifier
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

// GET - Iniciar fluxo OAuth do Twitter
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar credenciais
    const clientIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "twitter_client_id" }
    });

    if (!clientIdConfig?.value) {
      return NextResponse.json(
        { error: "Client ID do Twitter não configurado" },
        { status: 400 }
      );
    }

    // Gerar state para CSRF protection
    const state = crypto.randomBytes(16).toString("hex");
    
    // Gerar PKCE code verifier e challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Salvar state e code_verifier temporariamente
    await prisma.siteConfig.upsert({
      where: { key: "twitter_oauth_state" },
      update: { value: state },
      create: { key: "twitter_oauth_state", value: state, category: "temp" }
    });

    await prisma.siteConfig.upsert({
      where: { key: "twitter_code_verifier" },
      update: { value: codeVerifier },
      create: { key: "twitter_code_verifier", value: codeVerifier, category: "temp" }
    });

    // Obter URL base dinamicamente
    const headersList = headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const baseUrl = host.includes("localhost") 
      ? process.env.NEXTAUTH_URL 
      : `${protocol}://${host}`;
    
    // Montar URL de autorização do Twitter OAuth 2.0
    const redirectUri = `${baseUrl}/api/social/twitter/callback`;
    const scopes = ["tweet.read", "tweet.write", "users.read", "offline.access"];
    
    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientIdConfig.value);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("Erro ao iniciar OAuth do Twitter:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar autorização" },
      { status: 500 }
    );
  }
}
