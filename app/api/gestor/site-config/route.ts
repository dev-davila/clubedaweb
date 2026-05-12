export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    // Check rate limit (50 requests per minute)
    const ip = getClientIP(req);
    if (!checkRateLimit(`site-config-get-${ip}`, 50, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const configs = await prisma.siteConfig.findMany({
      where: category ? { category } : undefined,
      orderBy: { key: 'asc' }
    });

    // Converter para objeto key-value
    const result: Record<string, string> = {};
    configs.forEach(c => {
      result[c.key] = c.value;
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check rate limit (5 updates per minute)
    const ip = getClientIP(req);
    if (!checkRateLimit(`site-config-update-${ip}`, 5, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();

    // Atualizar ou criar cada configuração
    const results: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        const result = await prisma.siteConfig.upsert({
          where: { key },
          update: { value },
          create: {
            key,
            value,
            category: key.startsWith('analytics_') ? 'analytics' : 
                      key.startsWith('webmaster_') ? 'webmaster' :
                      key.startsWith('seo_') ? 'seo' :
                      key.startsWith('lgpd_') ? 'general' :
                      key.startsWith('ai_') ? 'general' :
                      key.startsWith('social_') ? 'general' :
                      key.startsWith('contact_') ? 'general' :
                      key.startsWith('smtp_') ? 'smtp' :
                      key.startsWith('sitemap_') ? 'sitemap' : 'general'
          }
        });
        results.push(result);
      }
    }

    return NextResponse.json({ success: true, updated: results.length });
  } catch (error) {
    return handleAPIError(error);
  }
}