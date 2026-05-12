import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: ["analytics_ga4_id", "analytics_gtm_id"]
        }
      }
    });

    const result: Record<string, string> = {};
    for (const config of configs) {
      result[config.key] = config.value || "";
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching analytics config:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
