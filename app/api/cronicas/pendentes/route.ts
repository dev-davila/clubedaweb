export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending_review";

    const chronicles = await prisma.chronicle.findMany({
      where: { status: status as any },
      orderBy: { createdAt: "desc" },
      include: {
        article: {
          include: {
            site: { select: { id: true, name: true, url: true } }
          }
        },
        category: true,
        author: true
      }
    });

    return NextResponse.json(chronicles);
  } catch (error) {
    console.error("Error fetching pending chronicles:", error);
    return NextResponse.json({ error: "Erro ao buscar crônicas pendentes" }, { status: 500 });
  }
}
