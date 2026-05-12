import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET - List all categories with product counts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const include = searchParams.get("include");

    if (include === "products") {
      const categories = await prisma.softwareCategory.findMany({
        orderBy: { displayOrder: "asc" },
        include: {
          products: {
            orderBy: { displayOrder: "asc" },
          },
        },
      });
      return NextResponse.json(categories);
    }

    const categories = await prisma.softwareCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
