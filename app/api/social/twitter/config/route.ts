export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Buscar configuração do Twitter (OAuth 1.0a)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const apiKeyConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_api_key" }});
    const apiSecretConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_api_secret" }});
    const accessTokenConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_access_token" }});
    const accessSecretConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_access_token_secret" }});

    return NextResponse.json({
      apiKey: apiKeyConfig?.value || "",
      apiSecret: apiSecretConfig?.value ? "********" : "",
      accessToken: accessTokenConfig?.value || "",
      accessTokenSecret: accessSecretConfig?.value ? "********" : "",
      configured: !!(apiKeyConfig?.value && apiSecretConfig?.value && accessTokenConfig?.value && accessSecretConfig?.value)
    });
  } catch (error) {
    console.error("Erro ao buscar config do Twitter:", error);
    return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 });
  }
}

// POST - Salvar configuração do Twitter (OAuth 1.0a)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { apiKey, apiSecret, accessToken, accessTokenSecret } = await request.json();

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return NextResponse.json(
        { error: "Todas as credenciais são obrigatórias: API Key, API Secret, Access Token e Access Token Secret" },
        { status: 400 }
      );
    }

    // Salvar API Key
    await prisma.siteConfig.upsert({
      where: { key: "twitter_api_key" },
      update: { value: apiKey },
      create: { key: "twitter_api_key", value: apiKey, category: "social" }
    });

    // Salvar API Secret (só se não for placeholder)
    if (apiSecret !== "********") {
      await prisma.siteConfig.upsert({
        where: { key: "twitter_api_secret" },
        update: { value: apiSecret },
        create: { key: "twitter_api_secret", value: apiSecret, category: "social" }
      });
    }

    // Salvar Access Token
    await prisma.siteConfig.upsert({
      where: { key: "twitter_access_token" },
      update: { value: accessToken },
      create: { key: "twitter_access_token", value: accessToken, category: "social" }
    });

    // Salvar Access Token Secret (só se não for placeholder)
    if (accessTokenSecret !== "********") {
      await prisma.siteConfig.upsert({
        where: { key: "twitter_access_token_secret" },
        update: { value: accessTokenSecret },
        create: { key: "twitter_access_token_secret", value: accessTokenSecret, category: "social" }
      });
    }

    // Marcar conta como conectada
    await prisma.socialMediaAccount.upsert({
      where: { platform: "twitter" },
      update: { isConnected: true, active: true, lastError: null },
      create: { platform: "twitter", accessToken: "oauth1.0a", isConnected: true, active: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar config do Twitter:", error);
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 });
  }
}
