import {
  REQUIRED_PAGE_TYPES,
  SITE_PAGE_ROUTES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";

const CHROME_HEADER_RE =
  /<(header|nav)\b[^>]*\bdata-block=["']header["'][^>]*>[\s\S]*?<\/\1>/i;
const CHROME_FOOTER_RE =
  /<footer\b[^>]*\bdata-block=["']footer["'][^>]*>[\s\S]*?<\/footer>/i;
// Fallbacks pra quando o Stitch esquece data-block (acontece — vimos no E2E).
const GENERIC_HEADER_RE = /<header\b[^>]*>[\s\S]*?<\/header>/i;
const GENERIC_FOOTER_RE = /<footer\b[^>]*>[\s\S]*?<\/footer>/i;

const NAV_ITEMS: { page: RequiredPageType; label: string }[] = [
  { page: "home", label: "Início" },
  { page: "services", label: "Serviços" },
  { page: "about", label: "Sobre" },
  { page: "blog", label: "Blog" },
  { page: "contact", label: "Contato" },
];

const NAV_ACTIVE_CLASS =
  'font-label-md text-label-md text-primary dark:text-primary-fixed-dim font-bold border-b-2 border-primary py-2';
const NAV_INACTIVE_CLASS =
  'font-label-md text-label-md text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-primary-fixed-dim transition-all duration-200 py-2';

export interface SiteChrome {
  headerShell: string;
  footer: string;
}

/** Extrai header (shell) e footer da home — fonte única do chrome.
 *
 * Stitch é inconsistente em emitir data-block="header"/"footer". Quando faltar,
 * fazemos fallback pra <header>/<footer> genéricos, depois pra <nav> com links
 * de páginas (caso o Stitch tenha posto o navbar dentro de <main>). Só lança
 * se realmente não encontrar nada utilizável.
 */
export function extractChromeFromHome(homeHtml: string): SiteChrome {
  let headerHtml =
    homeHtml.match(CHROME_HEADER_RE)?.[0] ??
    homeHtml.match(GENERIC_HEADER_RE)?.[0] ??
    null;

  // Se não tem <header> mas tem <nav> com múltiplos page links, promove a header
  if (!headerHtml) {
    const navRegex = /<nav[\s\S]*?<\/nav>/gi;
    let m: RegExpExecArray | null;
    while ((m = navRegex.exec(homeHtml)) !== null) {
      const pageLinks = (
        m[0].match(/href="(home|sobre|about|servicos|services|contato|contact|blog|noticias|quem-somos|solucoes)\.?html?"/gi) ??
        m[0].match(/href="\/(quem-somos|solucoes|noticias|contato|sobre|servicos|contact|about|blog)"/gi) ??
        []
      ).length;
      if (pageLinks >= 2) {
        headerHtml = `<header class="sticky top-0 z-50 bg-white shadow-sm">${m[0]}</header>`;
        break;
      }
    }
  }

  const footerHtml =
    homeHtml.match(CHROME_FOOTER_RE)?.[0] ??
    homeHtml.match(GENERIC_FOOTER_RE)?.[0] ??
    null;

  if (!headerHtml || !footerHtml) {
    throw new Error(
      `Home HTML sem chrome detectável (header=${!!headerHtml}, footer=${!!footerHtml})`,
    );
  }

  return {
    headerShell: headerHtml,
    footer: footerHtml,
  };
}

function buildNavHtml(activePage: RequiredPageType): string {
  const links = NAV_ITEMS.map(({ page, label }) => {
    const href = SITE_PAGE_ROUTES[page];
    const cls = page === activePage ? NAV_ACTIVE_CLASS : NAV_INACTIVE_CLASS;
    return `<a class="${cls}" href="${href}">\n                    ${label}\n                </a>`;
  }).join("\n");
  return `<nav class="hidden md:flex items-center gap-6">\n${links}\n</nav>`;
}

/** Header da home com nav ativa conforme a página. */
export function buildStandardHeader(chrome: SiteChrome, activePage: RequiredPageType): string {
  let header = chrome.headerShell;
  header = header.replace(
    /<nav class="hidden md:flex[\s\S]*?<\/nav>/i,
    buildNavHtml(activePage),
  );
  header = header.replace(/href="#contato"/g, `href="${SITE_PAGE_ROUTES.contact}"`);
  return header;
}

export function replaceChromeInHtml(
  html: string,
  header: string,
  footer: string,
): string {
  let out = html;

  // Header: tenta data-block, depois <header> genérico, depois insere após <body>.
  if (CHROME_HEADER_RE.test(out)) {
    out = out.replace(CHROME_HEADER_RE, header);
  } else if (GENERIC_HEADER_RE.test(out)) {
    out = out.replace(GENERIC_HEADER_RE, header);
  } else {
    out = out.replace(/<body([^>]*)>/i, `<body$1>\n${header}`);
  }

  // Footer: idem — data-block, depois <footer> genérico, depois antes de </body>.
  if (CHROME_FOOTER_RE.test(out)) {
    out = out.replace(CHROME_FOOTER_RE, footer);
  } else if (GENERIC_FOOTER_RE.test(out)) {
    out = out.replace(GENERIC_FOOTER_RE, footer);
  } else {
    out = out.replace(/<\/body>/i, `${footer}\n</body>`);
  }

  return out;
}

/** Aplica header/footer da home em todas as páginas. */
export function standardizeSiteChrome(
  pages: Record<RequiredPageType, string>,
  source: RequiredPageType = "home",
): Record<RequiredPageType, string> {
  const chrome = extractChromeFromHome(pages[source]);
  const out = {} as Record<RequiredPageType, string>;
  for (const pageType of REQUIRED_PAGE_TYPES) {
    const header = buildStandardHeader(chrome, pageType);
    out[pageType] = replaceChromeInHtml(pages[pageType], header, chrome.footer);
  }
  return out;
}
