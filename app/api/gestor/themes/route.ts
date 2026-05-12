export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { THEME_LIST } from "@/lib/themes/presets";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const active = await prisma.brandTokens.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    });
    const company = await prisma.siteConfig.findUnique({ where: { key: "company_name" } });
    return NextResponse.json({
      themes: THEME_LIST.map((t) => ({
        key: t.key,
        name: t.name,
        tagline: t.tagline,
        description: t.description,
        preview: t.preview,
      })),
      active: company?.value === "M3Solutions" ? "m3" : company?.value === "Bitdefender" ? "bitdefender" : null,
      activePrimary: active?.primaryColor ?? null,
    });
  } catch (e) {
    return NextResponse.json({ themes: [], active: null }, { status: 200 });
  }
}
