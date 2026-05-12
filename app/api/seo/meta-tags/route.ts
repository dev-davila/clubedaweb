import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: ["seo_bing_meta_tag", "seo_google_meta_tag"]
        }
      }
    });

    const result: Record<string, string> = {};
    for (const config of configs) {
      if (config.key === "seo_bing_meta_tag" && config.value) {
        result.bingMetaTag = config.value;
      }
      if (config.key === "seo_google_meta_tag" && config.value) {
        result.googleMetaTag = config.value;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao buscar meta tags:", error);
    return NextResponse.json({});
  }
}
