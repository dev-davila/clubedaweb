/**
 * Substitui favicon e og:image no <head> das páginas do site Stitch.
 * Roda no render path — sem persistir no HTML do banco.
 *
 * Lê SiteConfig.favicon_url e SiteConfig.og_image_url. Vazio → não mexe.
 */

import { prisma } from "@/lib/db";

export async function applySiteImages(html: string): Promise<string> {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: ["favicon_url", "og_image_url"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value?.trim() ?? ""]));
  const favicon = map.favicon_url || "";
  const ogImage = map.og_image_url || "";

  let out = html;

  if (favicon) {
    // Remove qualquer <link rel="icon"|"shortcut icon"|"apple-touch-icon"> existente
    out = out.replace(
      /<link\b[^>]*\brel=["'](?:shortcut\s+)?(?:icon|apple-touch-icon)["'][^>]*\/?>/gi,
      "",
    );
    // Injeta o novo favicon imediatamente após <head>
    const tag = `<link rel="icon" href="${escapeAttr(favicon)}" />`;
    out = out.replace(/<head\b[^>]*>/i, (m) => `${m}\n${tag}`);
  }

  if (ogImage) {
    // Remove qualquer meta og:image / twitter:image existente
    out = out.replace(
      /<meta\b[^>]*\bproperty=["']og:image["'][^>]*\/?>/gi,
      "",
    );
    out = out.replace(
      /<meta\b[^>]*\bname=["']twitter:image["'][^>]*\/?>/gi,
      "",
    );
    const tags = [
      `<meta property="og:image" content="${escapeAttr(ogImage)}" />`,
      `<meta name="twitter:image" content="${escapeAttr(ogImage)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
    ].join("\n");
    out = out.replace(/<head\b[^>]*>/i, (m) => `${m}\n${tags}`);
  }

  return out;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}
