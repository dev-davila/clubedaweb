export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  DEFAULT_HERO, DEFAULT_SERVICES, DEFAULT_SOLUTIONS, DEFAULT_FEATURES, DEFAULT_TESTIMONIALS
} from "@/lib/home-config";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "N\u00e3o autorizado" }, { status: 401 });
    }

    const sections = [
      { key: "home_hero", value: JSON.stringify(DEFAULT_HERO), label: "Home - Hero" },
      { key: "home_services", value: JSON.stringify(DEFAULT_SERVICES), label: "Home - Servi\u00e7os" },
      { key: "home_solutions", value: JSON.stringify(DEFAULT_SOLUTIONS), label: "Home - Solu\u00e7\u00f5es" },
      { key: "home_features", value: JSON.stringify(DEFAULT_FEATURES), label: "Home - Diferenciais" },
      { key: "home_testimonials", value: JSON.stringify(DEFAULT_TESTIMONIALS), label: "Home - Depoimentos" }
    ];

    let created = 0;
    let skipped = 0;

    for (const section of sections) {
      const existing = await prisma.siteConfig.findUnique({ where: { key: section.key } });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.siteConfig.create({
        data: {
          key: section.key,
          value: section.value,
          category: "home",
          label: section.label
        }
      });
      created++;
    }

    return NextResponse.json({ success: true, created, skipped });
  } catch (error) {
    console.error("Error seeding home config:", error);
    return NextResponse.json({ error: "Erro ao inicializar" }, { status: 500 });
  }
}
