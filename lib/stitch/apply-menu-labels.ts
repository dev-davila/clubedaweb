/**
 * Aplica labels editados pelo gestor no header dos HTMLs Stitch publicados.
 * Roda no polish (publish + preview), depois que standardize-chrome já fez o
 * header consistente entre páginas.
 *
 * Heurística: dentro do <header>, procura <a href="rota"> e troca o texto
 * imediato pelo label salvo. Conservador — só toca quando o href bate
 * exatamente com a rota canônica (/, /quem-somos, /solucoes, etc.).
 *
 * Itens marcados como `visible: false` são removidos.
 */

import type { StitchMenuItem } from "./menu-items";

export function applyMenuLabels(html: string, items: StitchMenuItem[]): string {
  return html.replace(/<header\b[\s\S]*?<\/header>/i, (header) => {
    let out = header;
    for (const item of items) {
      // Remove o <a> inteiro quando invisível
      if (!item.visible) {
        const removeRe = new RegExp(
          `<a\\b[^>]*\\bhref=["']${escapeRoute(item.route)}["'][^>]*>[\\s\\S]*?<\\/a>`,
          "gi",
        );
        out = out.replace(removeRe, "");
        continue;
      }
      // Reescreve o texto interno do <a>
      const re = new RegExp(
        `(<a\\b[^>]*\\bhref=["']${escapeRoute(item.route)}["'][^>]*>)([\\s\\S]*?)(<\\/a>)`,
        "gi",
      );
      out = out.replace(re, (_m, open: string, _inner: string, close: string) => {
        return `${open}${escapeHtml(item.label)}${close}`;
      });
    }
    return out;
  });
}

function escapeRoute(s: string): string {
  return s.replace(/[/.]/g, (c) => "\\" + c);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
