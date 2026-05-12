import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { generateSelectionEmailHtml } from "@/lib/cronicas/email-templates";

export const dynamic = "force-dynamic";

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  enclosure?: { url: string };
  "media:content"?: { $: { url: string } };
  "media:thumbnail"?: { $: { url: string } };
}

interface SyncResult {
  siteId: string;
  siteName: string;
  found: number;
  added: number;
  skipped: number;
  error?: string;
}

// Extract text from HTML
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Realistic browser User-Agents to avoid bot detection
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Parse RSS feed and extract items
async function parseRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": getRandomUserAgent(),
      "Accept": "application/rss+xml, application/xml, text/xml, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status}`);
  }

  const xml = await response.text();
  const items: RSSItem[] = [];

  // Simple RSS/Atom parsing
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || 
                      xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];

  for (const itemXml of itemMatches.slice(0, 50)) { // Limit to 50 items
    const title = itemXml.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] ||
                  itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
    
    const link = itemXml.match(/<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i)?.[1] ||
                 itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ||
                 itemXml.match(/<link[^>]*href="([^"]+)"/i)?.[1] || "";
    
    const description = itemXml.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] ||
                        itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ||
                        itemXml.match(/<summary[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/summary>/i)?.[1] ||
                        itemXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] || "";
    
    const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ||
                    itemXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] ||
                    itemXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || "";
    
    // Extract image from various sources
    let imageUrl = itemXml.match(/<media:content[^>]*url="([^"]+)"/i)?.[1] ||
                   itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1] ||
                   itemXml.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i)?.[1] ||
                   itemXml.match(/<image[^>]*>([\s\S]*?)<\/image>/i)?.[1]?.match(/<url>([^<]+)/)?.[1] ||
                   description.match(/<img[^>]*src="([^"]+)"/i)?.[1] || "";

    if (title && link) {
      items.push({
        title: stripHtml(title),
        link: link.trim(),
        description: stripHtml(description).slice(0, 500),
        pubDate: pubDate.trim(),
        enclosure: imageUrl ? { url: imageUrl } : undefined
      });
    }
  }

  return items;
}

// Scrape page for articles (fallback when no RSS)
async function scrapePage(url: string, selector?: string | null): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0"
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const items: RSSItem[] = [];

    // Try to find common article patterns
    const articlePatterns = [
      // CNN Brasil pattern
      /<article[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<h\d[^>]*>([^<]+)<\/h\d>/gi,
      // Generic pattern with h2/h3 links
      /<h[23][^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi,
      // Card pattern
      /<a[^>]*href="([^"]+)"[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<h[23][^>]*>([^<]+)/gi,
      // G1 pattern
      /<div[^>]*class="[^"]*feed-post[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<p[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)/gi
    ];

    const seenUrls = new Set<string>();

    for (const pattern of articlePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && items.length < 15) {
        const [, link, title] = match;
        const cleanUrl = link.startsWith("http") ? link : new URL(link, url).href;
        
        if (!seenUrls.has(cleanUrl) && title.trim().length > 10) {
          seenUrls.add(cleanUrl);
          
          // Try to find image near the article
          const imgMatch = html.slice(Math.max(0, match.index - 500), match.index + 1000)
            .match(/<img[^>]*src="([^"]+)"/i);
          
          items.push({
            title: stripHtml(title),
            link: cleanUrl,
            enclosure: imgMatch ? { url: imgMatch[1] } : undefined
          });
        }
      }
    }

    return items;
  } catch (error) {
    console.error("Scrape error:", error);
    return [];
  }
}

// Find RSS feed URL from page
async function findRSSFeed(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(pageUrl, {
      headers: { 
        "User-Agent": getRandomUserAgent(),
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9"
      },
      next: { revalidate: 0 }
    });
    const html = await response.text();
    
    // Look for RSS link in page
    const rssMatch = html.match(/<link[^>]*type="application\/rss\+xml"[^>]*href="([^"]+)"/i) ||
                     html.match(/<link[^>]*href="([^"]+)"[^>]*type="application\/rss\+xml"/i) ||
                     html.match(/<a[^>]*href="([^"]+\/feed[^"]*)"/i) ||
                     html.match(/<a[^>]*href="([^"]+\/rss[^"]*)"/i);
    
    if (rssMatch) {
      const feedUrl = rssMatch[1];
      return feedUrl.startsWith("http") ? feedUrl : new URL(feedUrl, pageUrl).href;
    }

    // Common RSS paths
    const baseUrl = new URL(pageUrl).origin;
    const commonPaths = ["/feed", "/rss", "/feed.xml", "/rss.xml", "/feeds/posts/default"];
    
    for (const path of commonPaths) {
      try {
        const testUrl = baseUrl + path;
        const testRes = await fetch(testUrl, { method: "HEAD" });
        if (testRes.ok) {
          return testUrl;
        }
      } catch {}
    }

    return null;
  } catch {
    return null;
  }
}

// Sync a single site
async function syncSite(site: { id: string; name: string; url: string; feedUrl: string | null; selector: string | null }): Promise<SyncResult> {
  const result: SyncResult = {
    siteId: site.id,
    siteName: site.name,
    found: 0,
    added: 0,
    skipped: 0
  };

  try {
    let items: RSSItem[] = [];

    // Try RSS feed first
    let feedUrl = site.feedUrl;
    if (!feedUrl) {
      feedUrl = await findRSSFeed(site.url);
      if (feedUrl) {
        // Save discovered feed URL
        await prisma.monitoredSite.update({
          where: { id: site.id },
          data: { feedUrl }
        });
      }
    }

    if (feedUrl) {
      try {
        items = await parseRSSFeed(feedUrl);
      } catch (rssError) {
        console.log(`RSS failed for ${site.name}, trying scrape:`, rssError);
      }
    }

    // Fallback to scraping
    if (items.length === 0) {
      items = await scrapePage(site.url, site.selector);
    }

    result.found = items.length;

    // Save articles to database
    for (const item of items) {
      try {
        // Check if already exists
        const existing = await prisma.collectedArticle.findUnique({
          where: { originalUrl: item.link }
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        // Parse date
        let publishedAt: Date | null = null;
        if (item.pubDate) {
          const parsed = new Date(item.pubDate);
          if (!isNaN(parsed.getTime())) {
            publishedAt = parsed;
          }
        }

        await prisma.collectedArticle.create({
          data: {
            siteId: site.id,
            title: item.title,
            excerpt: item.description || null,
            originalUrl: item.link,
            imageUrl: item.enclosure?.url || null,
            publishedAt,
            status: "pending"
          }
        });

        result.added++;
      } catch (err) {
        console.error(`Error saving article: ${item.link}`, err);
        result.skipped++;
      }
    }

    // Update lastCheckedAt
    await prisma.monitoredSite.update({
      where: { id: site.id },
      data: { lastCheckedAt: new Date() }
    });

  } catch (error: any) {
    result.error = error.message || "Unknown error";
  }

  return result;
}

// Generate a random token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Send selection email to recipients
async function sendSelectionEmails(
  newArticlesCount: number,
  baseUrl: string
): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };

  // Get active recipients
  const recipients = await prisma.chronicleRecipient.findMany({
    where: { active: true }
  });

  if (recipients.length === 0) {
    console.log("No active recipients found");
    return result;
  }

  // Create a selection token (valid for 48 hours)
  const token = generateToken();
  await prisma.selectionToken.create({
    data: {
      token,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    }
  });

  // URL pública de seleção (sem necessidade de login)
  const selectionUrl = `${baseUrl}/cronicas/selecao/${token}`;

  // Get pending articles for the email
  const pendingArticles = await prisma.collectedArticle.findMany({
    where: { status: "pending" },
    include: { site: true },
    orderBy: { collectedAt: "desc" },
    take: 8
  });

  // Contar total de pendentes
  const totalPending = await prisma.collectedArticle.count({
    where: { status: "pending" }
  });

  // Usar template de email padronizado
  const emailHtml = generateSelectionEmailHtml(
    totalPending,
    selectionUrl,
    pendingArticles.map(a => ({
      title: a.title,
      siteName: a.site.name,
      collectedAt: a.collectedAt
    }))
  );

  // Send email to each recipient
  for (const recipient of recipients) {
    try {
      const emailResult = await sendEmail({
        to: recipient.email,
        subject: `${totalPending} Novos Artigos para Cronicas`,
        html: emailHtml,
      });

      if (emailResult.success) {
        result.sent++;
        console.log(`Selection email sent to ${recipient.email}`);
      } else {
        result.failed++;
        console.error(`Failed to send email to ${recipient.email}:`, emailResult.error);
      }
    } catch (error) {
      result.failed++;
      console.error(`Error sending email to ${recipient.email}:`, error);
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Allow both session auth and Bearer token (for daemon/cron)
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.replace("Bearer ", "");
    const session = await getServerSession(authOptions);
    
    if (!session && bearerToken !== process.env.ABACUSAI_API_KEY) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { siteId, sendEmail = true } = body;

    // Get sites to sync
    const sites = await prisma.monitoredSite.findMany({
      where: siteId ? { id: siteId } : { active: true },
      select: { id: true, name: true, url: true, feedUrl: true, selector: true }
    });

    if (sites.length === 0) {
      return NextResponse.json({ error: "Nenhum site encontrado" }, { status: 404 });
    }

    const results: SyncResult[] = [];

    // Sync each site sequentially to avoid rate limiting
    for (const site of sites) {
      const result = await syncSite(site);
      results.push(result);
    }

    const totalFound = results.reduce((sum, r) => sum + r.found, 0);
    const totalAdded = results.reduce((sum, r) => sum + r.added, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const errors = results.filter(r => r.error);

    // Send selection emails if new articles were added
    let emailResult = { sent: 0, failed: 0 };
    if (sendEmail && totalAdded > 0) {
      // Get base URL from request or environment
      const baseUrl = getSiteUrl();
      emailResult = await sendSelectionEmails(totalAdded, baseUrl);
    }

    return NextResponse.json({
      success: true,
      summary: {
        sites: sites.length,
        found: totalFound,
        added: totalAdded,
        skipped: totalSkipped,
        errors: errors.length
      },
      results,
      emailsSent: emailResult.sent,
      emailsFailed: emailResult.failed
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao sincronizar" },
      { status: 500 }
    );
  }
}