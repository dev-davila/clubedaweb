/**
 * Substitui <header> e <footer> de uma página custom pelos da home publicada.
 *
 * Motivação: o Stitch gera páginas custom com header simplificado/aleatório
 * (frequentemente um CTA único repetido várias vezes). Como o pipeline polish
 * standardiza o chrome das 5 obrigatórias na hora do publish, a home raw no DB
 * já tem o header/footer canônicos. Reaproveitamos esses no render das custom.
 *
 * Após essa injeção, applyMenuLabels + insertMissingLinks operam sobre o nav
 * "bom" da home, e applyActiveMenu marca o link da custom como ativo (depois
 * que insertMissingLinks insere o <a> dela).
 */

import { getPublishedStitchHtml } from "./published-pages";

const HEADER_RE = /<header\b[\s\S]*?<\/header>/i;
const FOOTER_RE = /<footer\b[\s\S]*?<\/footer>/i;

export async function injectChromeFromHome(customHtml: string): Promise<string> {
  const homeHtml = await getPublishedStitchHtml("home");
  if (!homeHtml) return customHtml;

  const homeHeader = homeHtml.match(HEADER_RE)?.[0];
  const homeFooter = homeHtml.match(FOOTER_RE)?.[0];
  if (!homeHeader && !homeFooter) return customHtml;

  let out = customHtml;
  if (homeHeader) {
    if (HEADER_RE.test(out)) {
      out = out.replace(HEADER_RE, homeHeader);
    } else {
      out = out.replace(/<body([^>]*)>/i, `<body$1>\n${homeHeader}`);
    }
  }
  if (homeFooter) {
    if (FOOTER_RE.test(out)) {
      out = out.replace(FOOTER_RE, homeFooter);
    } else {
      out = out.replace(/<\/body>/i, `${homeFooter}\n</body>`);
    }
  }
  return out;
}
