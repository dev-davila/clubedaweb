export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getHomeConfig } from "@/lib/home-config";

const HOME_KEYS = ["home_hero", "home_services", "home_solutions", "home_features", "home_testimonials"];

export async function GET() {
  try {
    const config = await getHomeConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching home config:", error);
    return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json({ error: "Seção e dados são obrigatórios" }, { status: 400 });
    }

    const key = `home_${section}`;
    if (!HOME_KEYS.includes(key)) {
      return NextResponse.json({ error: "Seção inválida" }, { status: 400 });
    }

    const jsonValue = JSON.stringify(data);

    await prisma.siteConfig.upsert({
      where: { key },
      update: { value: jsonValue, updatedAt: new Date() },
      create: {
        key,
        value: jsonValue,
        category: "home",
        label: `Home - ${section}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating home config:", error);
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 });
  }
}
