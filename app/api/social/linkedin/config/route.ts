export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Verificar se LinkedIn está configurado
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const clientIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "linkedin_client_id" }
    });
    const clientSecretConfig = await prisma.siteConfig.findFirst({
      where: { key: "linkedin_client_secret" }
    });

    const configured = !!(clientIdConfig?.value && clientSecretConfig?.value);

    return NextResponse.json({
      clientId: clientIdConfig?.value ? "***" + clientIdConfig.value.slice(-4) : "",
      clientSecret: clientSecretConfig?.value ? "••••••••" : "",
      configured
    });
  } catch (error) {
    console.error("Erro ao buscar config:", error);
    return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 });
  }
}

// POST - Salvar credenciais do LinkedIn
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Client ID e Client Secret são obrigatórios" }, { status: 400 });
    }

    // Salvar Client ID
    await prisma.siteConfig.upsert({
      where: { key: "linkedin_client_id" },
      update: { value: clientId, updatedAt: new Date() },
      create: { key: "linkedin_client_id", value: clientId, category: "social" }
    });

    // Salvar Client Secret
    await prisma.siteConfig.upsert({
      where: { key: "linkedin_client_secret" },
      update: { value: clientSecret, updatedAt: new Date() },
      create: { key: "linkedin_client_secret", value: clientSecret, category: "social" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar config:", error);
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 });
  }
}
