export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const siteId = searchParams.get("siteId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const where: any = {};
    if (status) where.status = status;
    if (siteId) where.siteId = siteId;

    const [articles, total] = await Promise.all([
      prisma.collectedArticle.findMany({
        where,
        orderBy: { collectedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          site: { select: { id: true, name: true, url: true } },
          chronicle: { select: { id: true, status: true } }
        }
      }),
      prisma.collectedArticle.count({ where })
    ]);

    return NextResponse.json({
      articles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Erro ao buscar matérias" }, { status: 500 });
  }
}
