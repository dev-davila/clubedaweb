/**
 * TEMPORÁRIO — reset do estado do site Stitch + wizard + blog.
 * Usado uma vez pra testes de pipeline. Será removido após uso.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const log: Record<string, number> = {};

  log.blogPostTags = (await prisma.blogPostTag.deleteMany({})).count;
  log.blogTags = (await prisma.blogTag.deleteMany({})).count;
  log.blogPosts = (await prisma.blogPost.deleteMany({})).count;
  log.blogCategories = (await prisma.blogCategory.deleteMany({})).count;
  log.blogAuthors = (await prisma.blogAuthor.deleteMany({})).count;

  const keys = await prisma.siteConfig.findMany({
    where: {
      OR: [
        { key: { startsWith: "stitch_html_" } },
        { key: "stitch_menu_items" },
        { key: "stitch_project_id" },
        { key: "site_render_mode" },
        { key: "logo_url" },
        { key: "favicon_url" },
        { key: "og_image_url" },
        { key: { startsWith: "contact_" } },
        { key: "company_name" },
        { key: { startsWith: "social_" } },
      ],
    },
  });
  log.siteConfigs = (
    await prisma.siteConfig.deleteMany({
      where: { key: { in: keys.map((r) => r.key) } },
    })
  ).count;

  log.wizardMessages = (await prisma.wizardMessage.deleteMany({})).count;
  log.wizardSessions = (await prisma.wizardSession.deleteMany({})).count;

  return NextResponse.json({ ok: true, deleted: log });
}
