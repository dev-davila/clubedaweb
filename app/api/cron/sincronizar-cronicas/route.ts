import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/constants";
import { generateSelectionEmailHtml } from "@/lib/cronicas/email-templates";

export const dynamic = "force-dynamic";

const CRON_TOKEN = process.env.CRON_BEARER_TOKEN;

// Realistic browser User-Agents
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

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

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  imageUrl?: string;
}

async function parseRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": getRandomUserAgent(),
      "Accept": "application/rss+xml, application/xml, text/xml, */*",
      "Cache-Control": "no-cache"
    },
  });
  if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);
  const xml = await response.text();
  const items: RSSItem[] = [];
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ||
                      xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];
  for (const itemXml of itemMatches.slice(0, 50)) {
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
                    itemXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] || "";
    const imageUrl = itemXml.match(/<media:content[^>]*url="([^"]+)"/i)?.[1] ||
                     itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1] ||
                     itemXml.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i)?.[1] ||
                     description.match(/<img[^>]*src="([^"]+)"/i)?.[1] || "";
    if (title && link) {
      items.push({
        title: stripHtml(title),
        link: link.trim(),
        description: stripHtml(description).slice(0, 500),
        pubDate: pubDate.trim(),
        imageUrl: imageUrl || undefined
      });
    }
  }
  return items;
}

async function scrapePage(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        "Accept": "text/html,application/xhtml+xml",
        "Cache-Control": "max-age=0"
      },
    });
    if (!response.ok) throw new Error(`Scrape failed: ${response.status}`);
    const html = await response.text();
    const items: RSSItem[] = [];
    const patterns = [
      /<h[23][^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi,
      /<a[^>]*href="([^"]+)"[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<h[23][^>]*>([^<]+)/gi,
    ];
    const seenUrls = new Set<string>();
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && items.length < 15) {
        const [, link, title] = match;
        const cleanUrl = link.startsWith("http") ? link : new URL(link, url).href;
        if (!seenUrls.has(cleanUrl) && title.trim().length > 10) {
          seenUrls.add(cleanUrl);
          items.push({ title: stripHtml(title), link: cleanUrl });
        }
      }
    }
    return items;
  } catch {
    return [];
  }
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * CRON: Sincronizar sites monitorados e enviar email de seleção
 * Recomendado: executar a cada 3 horas
 * URL: /api/cron/sincronizar-cronicas
 */
export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  try {
    // Valida token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== CRON_TOKEN && token !== process.env.ABACUSAI_API_KEY) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("[CRON] Iniciando sincronização de crônicas...");

    // 1. Buscar sites ativos
    const sites = await prisma.monitoredSite.findMany({
      where: { active: true },
      select: { id: true, name: true, url: true, feedUrl: true, selector: true }
    });

    if (sites.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhum site monitorado ativo" });
    }

    // 2. Sincronizar cada site
    const results: { site: string; found: number; added: number; skipped: number; error?: string }[] = [];

    for (const site of sites) {
      const result = { site: site.name, found: 0, added: 0, skipped: 0, error: undefined as string | undefined };
      try {
        let items: RSSItem[] = [];

        // Tentar RSS primeiro
        if (site.feedUrl) {
          try {
            items = await parseRSSFeed(site.feedUrl);
          } catch (e: any) {
            console.log(`[CRON] RSS falhou para ${site.name}: ${e.message}`);
          }
        }

        // Fallback: scraping
        if (items.length === 0) {
          items = await scrapePage(site.url);
        }

        result.found = items.length;

        // Salvar artigos novos
        for (const item of items) {
          try {
            const existing = await prisma.collectedArticle.findUnique({
              where: { originalUrl: item.link }
            });
            if (existing) {
              result.skipped++;
              continue;
            }

            let publishedAt: Date | null = null;
            if (item.pubDate) {
              const parsed = new Date(item.pubDate);
              if (!isNaN(parsed.getTime())) publishedAt = parsed;
            }

            await prisma.collectedArticle.create({
              data: {
                siteId: site.id,
                title: item.title,
                excerpt: item.description || null,
                originalUrl: item.link,
                imageUrl: item.imageUrl || null,
                publishedAt,
                status: "pending"
              }
            });
            result.added++;
          } catch (err: any) {
            console.error(`[CRON] Erro salvando artigo: ${item.link}`, err.message);
            result.skipped++;
          }
        }

        // Atualizar lastCheckedAt
        await prisma.monitoredSite.update({
          where: { id: site.id },
          data: { lastCheckedAt: new Date() }
        });
      } catch (error: any) {
        result.error = error.message;
      }
      results.push(result);
    }

    const totalAdded = results.reduce((sum, r) => sum + r.added, 0);
    const totalFound = results.reduce((sum, r) => sum + r.found, 0);

    // 3. Enviar email de seleção se houver artigos pendentes (não apenas novos)
    let emailsSent = 0;
    let emailsFailed = 0;

    // Contar pendentes totais
    const totalPending = await prisma.collectedArticle.count({
      where: { status: "pending" }
    });

    if (totalPending > 0) {
      const recipients = await prisma.chronicleRecipient.findMany({
        where: { active: true }
      });

      if (recipients.length > 0) {
        // Reutilizar token existente se ainda válido e NÃO usado, senão criar novo (48h)
        let selectionToken: string;
        const existingToken = await prisma.selectionToken.findFirst({
          where: { 
            expiresAt: { gt: new Date() },
            usedAt: null  // Não reutilizar tokens já consumidos
          },
          orderBy: { expiresAt: "desc" }
        });
        if (existingToken) {
          selectionToken = existingToken.token;
          console.log("[CRON] Reutilizando token de seleção existente");
        } else {
          selectionToken = generateToken();
          await prisma.selectionToken.create({
            data: {
              token: selectionToken,
              expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
            }
          });
          console.log("[CRON] Novo token de seleção criado");
        }

        const baseUrl = getSiteUrl();
        const selectionUrl = `${baseUrl}/cronicas/selecao/${selectionToken}`;

        // Preview dos artigos recentes
        const previewArticles = await prisma.collectedArticle.findMany({
          where: { status: "pending" },
          include: { site: true },
          orderBy: { collectedAt: "desc" },
          take: 8
        });

        const emailHtml = generateSelectionEmailHtml(
          totalPending,
          selectionUrl,
          previewArticles.map(a => ({
            title: a.title,
            siteName: a.site.name,
            collectedAt: a.collectedAt
          }))
        );

        const subjectText = totalAdded > 0
          ? `${totalPending} Artigos para Cronicas (${totalAdded} novos)`
          : `${totalPending} Artigos Pendentes para Cronicas`;

        for (const recipient of recipients) {
          try {
            const result = await sendEmail({
              to: recipient.email,
              subject: subjectText,
              html: emailHtml,
            });
            if (result.success) {
              emailsSent++;
              console.log(`[CRON] Email enviado para ${recipient.email}`);
            } else {
              emailsFailed++;
              console.error(`[CRON] Falha email ${recipient.email}: ${result.error}`);
            }
          } catch {
            emailsFailed++;
          }
        }
      }
    }

    console.log(`[CRON] Crônicas concluído: ${totalFound} encontrados, ${totalAdded} novos, ${emailsSent} emails`);

    return NextResponse.json({
      success: true,
      summary: {
        sitesChecked: sites.length,
        articlesFound: totalFound,
        articlesAdded: totalAdded,
        emailsSent,
        emailsFailed
      },
      results
    });
  } catch (error: any) {
    console.error("[CRON] Erro sincronização crônicas:", error);
    return NextResponse.json({
      error: error.message || "Erro na sincronização"
    }, { status: 500 });
  }
}