export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST: Incrementar view count de um post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await prisma.blogPost.updateMany({
      where: { slug, status: "PUBLISHED", deletedAt: null },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("View count error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
