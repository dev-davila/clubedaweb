export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Buscar configuração do Facebook
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const appIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "facebook_app_id" }
    });
    const appSecretConfig = await prisma.siteConfig.findFirst({
      where: { key: "facebook_app_secret" }
    });
    const pagesConfig = await prisma.siteConfig.findFirst({
      where: { key: "facebook_pages" }
    });

    let pages: any[] = [];
    if (pagesConfig?.value) {
      try {
        pages = JSON.parse(pagesConfig.value);
      } catch (e) {
        // ignore parse error
      }
    }

    return NextResponse.json({
      appId: appIdConfig?.value || "",
      appSecret: appSecretConfig?.value ? "********" : "",
      configured: !!(appIdConfig?.value && appSecretConfig?.value),
      pages
    });
  } catch (error) {
    console.error("Erro ao buscar config do Facebook:", error);
    return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 });
  }
}

// POST - Salvar configuração do Facebook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { appId, appSecret } = await request.json();

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: "App ID e App Secret são obrigatórios" },
        { status: 400 }
      );
    }

    // Salvar ou atualizar App ID
    await prisma.siteConfig.upsert({
      where: { key: "facebook_app_id" },
      update: { value: appId },
      create: { key: "facebook_app_id", value: appId, category: "social" }
    });

    // Salvar ou atualizar App Secret (só se não for placeholder)
    if (appSecret !== "********") {
      await prisma.siteConfig.upsert({
        where: { key: "facebook_app_secret" },
        update: { value: appSecret },
        create: { key: "facebook_app_secret", value: appSecret, category: "social" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar config do Facebook:", error);
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 });
  }
}
