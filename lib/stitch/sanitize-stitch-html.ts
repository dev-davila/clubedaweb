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
  doc = doc.replace(
    /(<script[^>]*id=["']tailwind-config["'][^>]*>[\s\S]*?)<\/style>(\s*<\/head>)/i,
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

  return doc.trim();
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
  const styleBlock = headChunk.match(/<style[^>]*>[\s\S]*?<\/style>/i)?.[0] ?? "";

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
