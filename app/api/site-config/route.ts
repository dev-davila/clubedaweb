import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// API pública para buscar configurações de contato
export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: {
        category: {
          in: ['contact', 'general']
        }
      }
    });

    const result: Record<string, string> = {};
    configs.forEach(c => {
      result[c.key] = c.value;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({});
  }
}
