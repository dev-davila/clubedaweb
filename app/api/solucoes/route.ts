import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public GET /api/solucoes - List active solutions grouped by category
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    // Single solution by slug
    if (slug) {
      const solution = await prisma.solution.findFirst({
        where: { slug, active: true },
      });
      if (!solution) return NextResponse.json(null);
      return NextResponse.json(solution);
    }

    // All active solutions
    const solutions = await prisma.solution.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
    });

    return NextResponse.json(solutions);
  } catch (error: any) {
    console.error("Error fetching solutions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
