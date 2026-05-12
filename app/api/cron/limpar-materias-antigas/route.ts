import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.replace("Bearer ", "");
  return provided === secret || provided === process.env.ABACUSAI_API_KEY;
}

// POST: Delete articles older than 30 days that are still pending
export async function POST(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find old pending articles
    const oldArticles = await prisma.collectedArticle.findMany({
      where: {
        collectedAt: { lt: thirtyDaysAgo },
        status: "pending"
      },
      select: { id: true, title: true, collectedAt: true }
    });

    if (oldArticles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma materia antiga para limpar",
        deletedCount: 0
      });
    }

    // Delete old articles
    const deleted = await prisma.collectedArticle.deleteMany({
      where: {
        collectedAt: { lt: thirtyDaysAgo },
        status: "pending"
      }
    });

    console.log(`Cleaned ${deleted.count} old articles (> 30 days)`);

    return NextResponse.json({
      success: true,
      message: `${deleted.count} materia(s) antiga(s) removida(s)`,
      deletedCount: deleted.count,
      deletedArticles: oldArticles.map(a => a.title)
    });
  } catch (error: any) {
    console.error("Error cleaning old articles:", error);
    return NextResponse.json(
      { error: "Erro ao limpar materias antigas", details: error.message },
      { status: 500 }
    );
  }
}

// GET: Check how many old articles exist
export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldCount = await prisma.collectedArticle.count({
      where: {
        collectedAt: { lt: thirtyDaysAgo },
        status: "pending"
      }
    });

    const totalPending = await prisma.collectedArticle.count({
      where: { status: "pending" }
    });

    return NextResponse.json({
      oldArticlesCount: oldCount,
      totalPendingCount: totalPending,
      cutoffDate: thirtyDaysAgo.toISOString()
    });
  } catch (error: any) {
    console.error("Error checking old articles:", error);
    return NextResponse.json(
      { error: "Erro ao verificar materias antigas", details: error.message },
      { status: 500 }
    );
  }
}
