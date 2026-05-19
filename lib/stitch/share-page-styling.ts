// Propaga estilos da home (CSS inline + tailwind-config + fontes) para as
// páginas secundárias. Stitch gera tailwind.config diferente por página, e o
// <style> inline pode injetar regras conflitantes (ex.: body background-color
// distinto em cada página). Isso quebra a sensação visual de "mesmo site" no
// preview.
//
// Estratégia: extrair os blocos visuais críticos da home e injetar nas outras
// páginas. Idempotente — pode rodar várias vezes na mesma página.

export interface HomeStyling {
  styleBlocks: string;
  tailwindConfig: string;
  /** <link rel="stylesheet" ...> de Google Fonts e similares */
  stylesheetLinks: string;
}

const STYLE_BLOCK_RE = /<style[\s\S]*?<\/style>/gi;
const TAILWIND_CONFIG_RE = /<script[^>]*id=["']tailwind-config["'][\s\S]*?<\/script>/i;
const STYLESHEET_LINK_RE = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;

export function extractHomeStyling(homeHtml: string): HomeStyling {
  const styleBlocks = (homeHtml.match(STYLE_BLOCK_RE) ?? []).join("\n");
  const tailwindConfig = homeHtml.match(TAILWIND_CONFIG_RE)?.[0] ?? "";
  const stylesheetLinks = (homeHtml.match(STYLESHEET_LINK_RE) ?? []).join("\n");
  return { styleBlocks, tailwindConfig, stylesheetLinks };
}

/**
 * Aplica os estilos da home em uma página secundária. Substitui blocos
 * existentes para evitar duplicação/divergência.
 */
export function applyHomeStyling(pageHtml: string, home: HomeStyling): string {
  if (!home.styleBlocks && !home.tailwindConfig) return pageHtml;
  let out = pageHtml;

  // Remove <style>, <script id=tailwind-config> e <link rel=stylesheet> da página alvo
  out = out.replace(STYLE_BLOCK_RE, "");
  out = out.replace(TAILWIND_CONFIG_RE, "");
  // Só remove links de stylesheet das fontes (Google Fonts / Material Symbols) —
  // não toca em outros <link> (favicon, manifest, etc.)
  out = out.replace(STYLESHEET_LINK_RE, (match) => {
    if (/fonts\.googleapis|fonts\.gstatic|material-symbols/i.test(match)) return "";
    return match;
  });

  // Monta o bloco unificado e injeta antes de </head>
  const injection = [
    home.stylesheetLinks,
    home.tailwindConfig,
    home.styleBlocks,
  ]
    .filter(Boolean)
    .join("\n");

  if (!injection) return out;

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `\n${injection}\n</head>`);
  } else if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, `<head$1>\n${injection}\n`);
  } else if (/<html[^>]*>/i.test(out)) {
    out = out.replace(/<html([^>]*)>/i, `<html$1><head>${injection}</head>`);
  }

  return out;
}

/**
 * Aplica estilos compartilhados em todo um conjunto de páginas — a home é a
 * fonte de verdade. Páginas que não são "home" recebem propagação.
 */
export function standardizePageStyling(
  pages: Record<string, string>,
  homeKey = "home",
): Record<string, string> {
  const home = pages[homeKey];
  if (!home) return pages;
  const styling = extractHomeStyling(home);
  if (!styling.styleBlocks && !styling.tailwindConfig) return pages;

  const out: Record<string, string> = { ...pages };
  for (const [key, html] of Object.entries(pages)) {
    if (key === homeKey || !html) continue;
    out[key] = applyHomeStyling(html, styling);
  }
  return out;
}
