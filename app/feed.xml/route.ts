import { prisma } from "@/lib/db";
import { SITE_BASE_URL } from "@/lib/constants";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function getSiteUrl(): string {
  const headersList = headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "https";
  if (host && !host.includes("preview.abacusai.app")) {
    return `${protocol}://${host}`;
  }
  return SITE_BASE_URL;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = getSiteUrl();

  const posts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      geoCity: null,
      geoState: null,
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: { category: true, author: true },
  });

  const items = posts
    .map((post) => {
      const pubDate = post.publishedAt || post.createdAt;
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/noticias/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/noticias/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || post.title)}</description>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      ${post.category ? `<category>${escapeXml(post.category.name)}</category>` : ""}
      ${post.author ? `<dc:creator>${escapeXml(post.author.name)}</dc:creator>` : ""}
      ${post.featuredImage ? `<enclosure url="${escapeXml(post.featuredImage)}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>M3Solutions - Not\u00edcias de Tecnologia</title>
    <link>${siteUrl}/noticias</link>
    <description>Fique por dentro das \u00faltimas novidades sobre tecnologia, cloud, seguran\u00e7a e TI.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
