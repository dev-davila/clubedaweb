/**
 * Quando o gestor cadastrou um logo (`siteConfig.logo_url`), injeta <img>
 * no brand do header em todas as páginas. Senão, deixa o wordmark de texto
 * que já vem do Stitch (não tocamos).
 *
 * Heurística do brand: primeiro <a> dentro de <header> que aponta pra "/" ou
 * "#" e contém ou um <span class="material-symbols-outlined"> ou o
 * companyName em texto.
 */
import type { WizardAnswers } from "@/lib/wizard/types";

export function injectClientLogo(
  html: string,
  logoUrl: string | null | undefined,
  answers: WizardAnswers,
): string {
  if (!logoUrl?.trim()) return html;
  const company = answers.companyName?.trim() || "Logo";
  const img = `<img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(company)}" class="h-10 w-auto" />`;

  // Substitui o <span class="material-symbols-outlined ..."> dentro do PRIMEIRO
  // <a> do <header> pelo <img>. Conservador: só toca no primeiro <header>.
  let replaced = false;
  return html.replace(
    /<header\b[\s\S]*?<\/header>/i,
    (header) => {
      if (replaced) return header;
      const next = header.replace(
        /<a\b([^>]*)>\s*<span\b[^>]*material-symbols-outlined[^>]*>[^<]*<\/span>\s*/i,
        (_m, attrs) => {
          replaced = true;
          return `<a${attrs}>${img}\n`;
        },
      );
      if (replaced) return next;
      // Fallback: se não tem material-symbol, injeta antes do primeiro texto
      // da brand (span com font-headline ou b/strong)
      const next2 = header.replace(
        /<a\b([^>]*)>\s*(<span\b[^>]*font-headline)/i,
        (_m, attrs, openSpan) => {
          replaced = true;
          return `<a${attrs}>${img}\n${openSpan}`;
        },
      );
      return next2;
    },
  );
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/&/g, "&amp;");
}
