export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Buscar configuração do Instagram
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const appIdConfig = await prisma.siteConfig.findFirst({
      where: { key: "instagram_app_id" }
    });

    const appSecretConfig = await prisma.siteConfig.findFirst({
      where: { key: "instagram_app_secret" }
    });

    const bioLinkConfig = await prisma.siteConfig.findFirst({
      where: { key: "instagram_bio_link_url" }
    });

    return NextResponse.json({
      appId: appIdConfig?.value || "",
      appSecretConfigured: !!appSecretConfig?.value,
      bioLinkUrl: bioLinkConfig?.value || "/noticias",
      configured: !!(appIdConfig?.value && appSecretConfig?.value)
    });
  } catch (error) {
    console.error("Erro ao buscar config do Instagram:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuração" },
      { status: 500 }
    );
  }
}

// POST - Salvar configuração do Instagram
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { appId, appSecret, bioLinkUrl } = body;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: "App ID e App Secret são obrigatórios" },
        { status: 400 }
      );
    }

    // Salvar configurações
    await prisma.siteConfig.upsert({
      where: { key: "instagram_app_id" },
      update: { value: appId },
      create: { key: "instagram_app_id", value: appId, category: "social" }
    });

    await prisma.siteConfig.upsert({
      where: { key: "instagram_app_secret" },
      update: { value: appSecret },
      create: { key: "instagram_app_secret", value: appSecret, category: "social" }
    });

    // Salvar URL padrão da bio
    if (bioLinkUrl !== undefined) {
      await prisma.siteConfig.upsert({
        where: { key: "instagram_bio_link_url" },
        update: { value: bioLinkUrl || "/noticias" },
        create: { key: "instagram_bio_link_url", value: bioLinkUrl || "/noticias", category: "social" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar config do Instagram:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 }
    );
  }
}
