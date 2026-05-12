export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const where = {
      status: { in: ["published", "approved", "scheduled"] as any[] }
    };

    const [chronicles, total] = await Promise.all([
      prisma.chronicle.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          createdAt: true,
          publishedAt: true,
          scheduledFor: true,
          linkedinPostUrl: true,
          twitterPostUrl: true,
          facebookPostUrl: true,
          instagramPostUrl: true,
          article: {
            select: {
              id: true,
              title: true,
              originalUrl: true,
              site: { select: { id: true, name: true } }
            }
          },
          category: { select: { id: true, name: true } },
          author: { select: { id: true, name: true } },
          blogPost: { select: { id: true, slug: true, title: true } }
        }
      }),
      prisma.chronicle.count({ where })
    ]);

    return NextResponse.json({
      chronicles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 });
  }
}
