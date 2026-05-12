export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { THEME_PRESETS } from "@/lib/themes/presets";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { themeKey } = await request.json();
    const preset = THEME_PRESETS[themeKey];
    if (!preset) return NextResponse.json({ error: "Tema inválido" }, { status: 400 });

    // 1) BrandTokens
    const existing = await prisma.brandTokens.findFirst({ where: { active: true }, orderBy: { updatedAt: "desc" } });
    const brandData = {
      ...preset.brand,
      logoIconUrl: null,
      iconStyle: "solid",
      active: true,
    };
    if (existing) {
      await prisma.brandTokens.update({ where: { id: existing.id }, data: brandData });
    } else {
      await prisma.brandTokens.create({ data: brandData });
    }

    // 2) SiteConfig: company_name + tagline + theme_layout
    const layoutVariant = themeKey === "bitdefender" ? "bd" : "m3";
    const generalConfig = { ...preset.siteConfig, theme_layout: layoutVariant };
    for (const [key, value] of Object.entries(generalConfig)) {
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: { key, value, category: "general", label: key },
      });
    }

    // 3) Home content (home_hero, home_services, home_solutions, home_features, home_testimonials)
    const homeMap: Record<string, any> = {
      home_hero: preset.home.hero,
      home_services: preset.home.services,
      home_solutions: preset.home.solutions,
      home_features: preset.home.features,
      home_testimonials: preset.home.testimonials,
    };
    for (const [key, value] of Object.entries(homeMap)) {
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value: JSON.stringify(value), updatedAt: new Date() },
        create: { key, value: JSON.stringify(value), category: "home", label: key },
      });
    }

    return NextResponse.json({ success: true, applied: themeKey });
  } catch (error) {
    console.error("[THEMES] apply error:", error);
    return NextResponse.json({ error: "Erro ao aplicar tema" }, { status: 500 });
  }
}
