import type { RequiredPageType } from "@/lib/themes/required-pages";
import {
  buildStandardHeader,
  extractChromeFromHome,
  replaceChromeInHtml,
  type SiteChrome,
} from "./standardize-chrome";

let cachedChrome: SiteChrome | null = null;

/** Define chrome extraído da home (usado ao sanitizar páginas 2–5). */
export function setChromeSourceFromHome(homeHtml: string): void {
  cachedChrome = extractChromeFromHome(homeHtml);
}

export function clearChromeSource(): void {
  cachedChrome = null;
}

/**
 * Corrige HTML malformado que o Stitch às vezes devolve (página em branco no browser).
 */
export function sanitizeStitchHtml(
  html: string,
  opts?: { pageType?: RequiredPageType; applyStandardChrome?: boolean },
): string {
  let doc = html.trim();
  if (!doc) return doc;

  // Bug 1 do Stitch: `</script>` no fim de um <style> inline.
  doc = doc.replace(
    /(<style[^>]*>[\s\S]*?)<\/script>(\s*<\/head>)/i,
    "$1</style>$2",
  );

  // Bug 2 do Stitch: `</style>` no fim do <script id="tailwind-config"> em vez
  // de `</script>`. Faz o body inteiro virar conteúdo do <script>, deixando a
  // página visualmente vazia.
  //
  // Negative lookahead garante que não consumimos </style> de styles posteriores
  // legítimos (ex: overlay injetado pelo polish). Só casa quando NÃO há
  // </script> entre o <script tailwind-config> e o </style>...</head>.
  doc = doc.replace(
    /(<script[^>]*id=["']tailwind-config["'][^>]*>(?:(?!<\/script>)[\s\S])*?)<\/style>(\s*<\/head>)/i,
    "$1</script>$2",
  );

  const match = doc.match(/^[\s\S]*?<\/html>/i);
  if (match) doc = match[0];

  if (/id=["']tailwind-config["']/i.test(doc)) {
    doc = normalizeStitchDocument(doc);
  }

  if (opts?.applyStandardChrome && cachedChrome && opts.pageType) {
    const header = buildStandardHeader(cachedChrome, opts.pageType);
    doc = replaceChromeInHtml(doc, header, cachedChrome.footer);
  }

  doc = rewriteStitchLinks(doc);

  return doc.trim();
}

/**
 * Stitch gera muitos `<a href="#">`, `href="#contato"`, `href="#servicos"` no
 * lugar de URLs reais das páginas obrigatórias. Reescrevemos os padrões
 * conhecidos pra rotas em PT-BR do site público.
 */
const ANCHOR_TO_ROUTE: Record<string, string> = {
  // Home
  top: "/",
  inicio: "/",
  "início": "/",
  home: "/",
  // Sobre
  sobre: "/quem-somos",
  "quem-somos": "/quem-somos",
  about: "/quem-somos",
  // Serviços
  servicos: "/solucoes",
  "serviços": "/solucoes",
  solucoes: "/solucoes",
  "soluções": "/solucoes",
  services: "/solucoes",
  // Contato
  contato: "/contato",
  contact: "/contato",
  // Blog
  blog: "/noticias",
  noticias: "/noticias",
  "notícias": "/noticias",
};

function rewriteStitchLinks(html: string): string {
  // 1. Reescreve hrefs que apontam pra # ou anchors conhecidos
  let out = html.replace(/href=(["'])([^"']*)\1/gi, (match, q, val) => {
    const v = val.trim();
    if (!v || v === "#") return `href=${q}/contato${q}`;
    if (v.startsWith("#")) {
      const anchor = v.slice(1).toLowerCase();
      const mapped = ANCHOR_TO_ROUTE[anchor];
      if (mapped) return `href=${q}${mapped}${q}`;
      // Âncora desconhecida (ex: #metodo, #faq) — mantém pra navegação interna
      return match;
    }
    return match;
  });

  // 2. iframe srcDoc é sandboxed: clicar em <a href="/foo"> tenta navegar
  // DENTRO do iframe (que não tem rota /foo). Adiciona target="_top" pra
  // sair do iframe e levar a página inteira. Não toca em # anchors (devem
  // continuar internas) nem em mailto:/tel: nem em links já com target.
  out = out.replace(/<a\b([^>]*?)>/gi, (match, attrs) => {
    if (/\btarget\s*=/i.test(attrs)) return match;
    const hrefMatch = attrs.match(/href=(["'])([^"']*)\1/i);
    if (!hrefMatch) return match;
    const href = hrefMatch[2].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return match;
    return `<a${attrs} target="_top">`;
  });

  return out;
}

/** Reconstrói <head> na ordem correta: meta → fonts → config → CDN → style */
function normalizeStitchDocument(doc: string): string {
  const htmlOpen = doc.match(/<html[^>]*>/i)?.[0] ?? '<html lang="pt-BR">';
  const bodyIdx = doc.search(/<body[\s>]/i);
  if (bodyIdx === -1) return doc;

  const headChunk = doc.slice(0, bodyIdx);
  const bodyRest = doc.slice(bodyIdx);

  const charset =
    headChunk.match(/<meta[^>]*charset[^>]*>/i)?.[0] ?? '<meta charset="utf-8"/>';
  const viewport =
    headChunk.match(/<meta[^>]*viewport[^>]*>/i)?.[0] ??
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>';
  const title = headChunk.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? "";
  const links = [...headChunk.matchAll(/<link[^>]*>/gi)].map((m) => m[0]).join("\n");
  const configScript = headChunk.match(
    /<script[^>]*id=["']tailwind-config["'][^>]*>[\s\S]*?<\/script>/i,
  )?.[0];
  const cdnScript = headChunk.match(
    /<script[^>]*src=["'][^"']*tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>/i,
  )?.[0];
  // Preserva TODOS os <style> do head (Stitch tem o de material-symbols;
  // polish pode injetar overlay; etc).
  const styleBlock = [...headChunk.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)]
    .map((m) => m[0])
    .join("\n");

  if (!configScript || !cdnScript) return doc;

  const head = [
    "<head>",
    charset,
    viewport,
    title,
    links,
    cdnScript,
    configScript,
    styleBlock,
    "</head>",
  ]
    .filter(Boolean)
    .join("\n");

  const doctype = /<!DOCTYPE/i.test(doc) ? "<!DOCTYPE html>\n" : "";
  return `${doctype}${htmlOpen}\n${head}\n${bodyRest}`;
}
