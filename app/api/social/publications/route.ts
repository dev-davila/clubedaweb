export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Listar histórico de publicações
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get("platform");
  const status = searchParams.get("status");
  const blogPostId = searchParams.get("blogPostId");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const publications = await prisma.socialPublication.findMany({
      where: {
        ...(platform && { platform }),
        ...(status && { status }),
        ...(blogPostId && { blogPostId })
      },
      include: {
        account: {
          select: {
            platform: true,
            accountName: true,
            profileImage: true
          }
        },
        blogPost: {
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    // Estatísticas
    const stats = await prisma.socialPublication.groupBy({
      by: ["platform", "status"],
      _count: true
    });

    return NextResponse.json({ 
      publications,
      stats: stats.reduce((acc, item) => {
        if (!acc[item.platform]) acc[item.platform] = {};
        acc[item.platform][item.status] = item._count;
        return acc;
      }, {} as Record<string, Record<string, number>>)
    });

  } catch (error) {
    console.error("Erro ao buscar publicações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar publicações" },
      { status: 500 }
    );
  }
}
