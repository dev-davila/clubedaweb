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
    // Só toca em <a> que estão DENTRO de <nav> (links de navegação reais).
    // O brand/logo do header costuma ser um <a> direto pra "/" ou "/contato"
    // que NÃO está dentro de <nav> — não pode ser sobrescrito.
    return header.replace(/<nav\b[\s\S]*?<\/nav>/gi, (nav) => {
      let next = rewriteNavLinks(nav, items);
      next = insertMissingLinks(next, items);
      return next;
    });
  });
}

/**
 * Insere <a> pra cada item do menu cuja rota AINDA NÃO existe no nav.
 * Usa o primeiro <a> existente como template (mantém classes).
 */
function insertMissingLinks(navHtml: string, items: StitchMenuItem[]): string {
  const existingRoutes = new Set<string>();
  for (const m of navHtml.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    existingRoutes.add(m[1]);
  }
  const toInsert = items.filter((i) => i.visible !== false && !existingRoutes.has(i.route));
  if (toInsert.length === 0) return navHtml;

  // Pega template do primeiro <a> visível com classes (atributos preservados,
  // mas href/texto substituídos por item.route/item.label)
  const templateMatch = navHtml.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
  if (!templateMatch) return navHtml;
  const templateAttrs = templateMatch[1];
  const newAnchors = toInsert
    .map((i) => {
      const attrs = templateAttrs
        .replace(/\bhref=["'][^"']*["']/i, `href="${i.route}"`)
        .replace(/\baria-current=["'][^"']*["']/gi, "");
      const hasHref = /\bhref=/i.test(attrs);
      const finalAttrs = hasHref ? attrs : `${attrs} href="${i.route}"`;
      return `<a${finalAttrs}>${escapeHtml(i.label)}</a>`;
    })
    .join("\n");

  // Insere antes do último </a> de nav (mantém botão CTA final se houver)
  const lastClose = navHtml.lastIndexOf("</a>");
  if (lastClose < 0) return navHtml + newAnchors;
  // Posiciona DEPOIS do último <a> existente (logo após o close)
  const insertAt = lastClose + "</a>".length;
  return navHtml.slice(0, insertAt) + "\n" + newAnchors + navHtml.slice(insertAt);
}

function rewriteNavLinks(navHtml: string, items: StitchMenuItem[]): string {
  let out = navHtml;
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
    // Reescreve só o texto interno do <a> de navegação. Se contém <img>/<svg>
    // (provável brand-like), pula pra não destruir.
    const re = new RegExp(
      `(<a\\b[^>]*\\bhref=["']${escapeRoute(item.route)}["'][^>]*>)([\\s\\S]*?)(<\\/a>)`,
      "gi",
    );
    out = out.replace(re, (full: string, open: string, inner: string, close: string) => {
      if (/<img|<svg/i.test(inner)) return full;
      return `${open}${escapeHtml(item.label)}${close}`;
    });
  }
  return out;
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
