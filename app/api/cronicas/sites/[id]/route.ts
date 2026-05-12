export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const site = await prisma.monitoredSite.findUnique({
      where: { id },
      include: {
        _count: { select: { articles: true } },
        articles: {
          take: 10,
          orderBy: { collectedAt: "desc" }
        }
      }
    });

    if (!site) {
      return NextResponse.json({ error: "Site não encontrado" }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json({ error: "Erro ao buscar site" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { name, url, feedUrl, selector, checkInterval, active } = await request.json();

    const site = await prisma.monitoredSite.update({
      where: { id },
      data: {
        name,
        url,
        feedUrl: feedUrl || null,
        selector: selector || null,
        checkInterval: checkInterval || 3,
        active
      },
      include: {
        _count: { select: { articles: true } }
      }
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error updating site:", error);
    return NextResponse.json({ error: "Erro ao atualizar site" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    
    // Delete cascades to articles
    await prisma.monitoredSite.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json({ error: "Erro ao excluir site" }, { status: 500 });
  }
}
