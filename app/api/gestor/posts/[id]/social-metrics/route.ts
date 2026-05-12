export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// Item 16: Social metrics endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Get all social publications for this post
    const publications = await prisma.socialPublication.findMany({
      where: { blogPostId: id },
      include: {
        metrics: {
          orderBy: { fetchedAt: "desc" },
          take: 1
        }
      }
    });

    // Aggregate metrics
    const totals = {
      likes: 0,
      shares: 0,
      comments: 0,
      impressions: 0,
      clicks: 0
    };

    const byPlatform = publications.map((pub) => {
      const latest = pub.metrics[0];
      if (latest) {
        totals.likes += latest.likes;
        totals.shares += latest.shares;
        totals.comments += latest.comments;
        totals.impressions += latest.impressions;
        totals.clicks += latest.clicks;
      }
      return {
        platform: pub.platform,
        publishedAt: pub.publishedAt,
        postUrl: pub.postUrl,
        metrics: latest || null
      };
    });

    return NextResponse.json({ totals, byPlatform });
  } catch (error) {
    console.error("[SOCIAL-METRICS] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
