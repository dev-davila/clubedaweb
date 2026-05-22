import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateBlogPostContent } from "@/lib/wizard/blog-content-generator";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Params {
  params: { id: string };
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
      include: { category: true, author: true },
    });
    if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Pega tom/empresa do publish atual (sessão Stitch published)
    const wizardSession = await prisma.wizardSession.findFirst({
      where: { state: "published" },
      orderBy: { updatedAt: "desc" },
    });
    const answers = (wizardSession?.data as { answers?: Record<string, unknown> } | null)?.answers as
      | { tone?: string; companyName?: string; industry?: string }
      | undefined;

    const content = await generateBlogPostContent({
      title: post.title,
      excerpt: post.excerpt,
      category: post.category?.name,
      tone: answers?.tone,
      companyName: answers?.companyName,
      industry: answers?.industry,
    });

    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        content,
        aiGenerated: true,
        aiModel: "claude-via-abacus",
        aiGeneratedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, bytes: content.length });
  } catch (err) {
    logger.error("[posts/regenerate-content] POST", err instanceof Error ? err.stack : String(err));
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
