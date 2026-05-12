export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sites = await prisma.monitoredSite.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { articles: true } }
      }
    });
    return NextResponse.json(sites);
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json({ error: "Erro ao buscar sites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, url, feedUrl, selector, checkInterval, active } = await request.json();

    if (!name || !url) {
      return NextResponse.json({ error: "Nome e URL são obrigatórios" }, { status: 400 });
    }

    const site = await prisma.monitoredSite.create({
      data: {
        name,
        url,
        feedUrl: feedUrl || null,
        selector: selector || null,
        checkInterval: checkInterval || 3,
        active: active !== false
      },
      include: {
        _count: { select: { articles: true } }
      }
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error creating site:", error);
    return NextResponse.json({ error: "Erro ao criar site" }, { status: 500 });
  }
}
