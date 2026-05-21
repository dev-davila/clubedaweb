/**
 * Marca o item de menu ativo conforme a rota atual. Usa o primeiro <a>
 * dentro de <nav> como template "ativo" e o segundo como "inativo" — esse
 * é o padrão do Stitch (gera com Início ativo, demais com text-on-surface
 * variant + sem border).
 *
 * Aplica também em /noticias/[slug] (que casa com a rota de blog).
 */

const NOTICIAS_ROUTE = "/noticias";

export function applyActiveMenu(html: string, currentRoute: string): string {
  // Normaliza /noticias/<slug> → /noticias
  const route = currentRoute.startsWith(`${NOTICIAS_ROUTE}/`) ? NOTICIAS_ROUTE : currentRoute;

  return html.replace(/<header\b[\s\S]*?<\/header>/i, (header) => {
    return header.replace(
      /<nav\b([^>]*)>([\s\S]*?)<\/nav>/gi,
      (_full, navAttrs: string, inner: string) => {
        // Captura primeiro/segundo <a> dentro do nav pra usar como templates
        const aMatches = [...inner.matchAll(/<a\b[^>]*\bhref=["'][^"']+["'][^>]*>/gi)];
        if (aMatches.length === 0) return `<nav${navAttrs}>${inner}</nav>`;

        const firstClass = aMatches[0][0].match(/class=["']([^"']+)["']/)?.[1];
        if (!firstClass) return `<nav${navAttrs}>${inner}</nav>`;

        // Inativo: pega de outro <a> que tenha classes distintas; fallback
        // pra remover marcadores ativos comuns (border-b-2, font-bold,
        // border-primary, underline).
        let inactiveClass = firstClass;
        for (const m of aMatches.slice(1)) {
          const c = m[0].match(/class=["']([^"']+)["']/)?.[1];
          if (c && c !== firstClass) {
            inactiveClass = c;
            break;
          }
        }
        if (inactiveClass === firstClass) {
          // Fallback: deriva o inactive removendo classes "ativas" comuns
          inactiveClass = firstClass
            .replace(/\bborder-b-2\b/g, "")
            .replace(/\bborder-primary(-fixed(-dim)?)?\b/g, "")
            .replace(/\bunderline\b/g, "")
            .replace(/\bfont-bold\b/g, "font-medium")
            .replace(/\btext-primary(-fixed(-dim)?)?\b/g, "text-on-surface-variant")
            .replace(/\s+/g, " ")
            .trim();
        }

        const newInner = inner.replace(
          /<a\b([^>]*)>/gi,
          (tag: string, attrs: string) => {
            const href = attrs.match(/href=["']([^"']+)["']/)?.[1];
            if (!href) return tag;
            const isActive = href === route;
            const targetClass = isActive ? firstClass : inactiveClass;
            const updated = /class=["'][^"']*["']/.test(attrs)
              ? attrs.replace(/class=["'][^"']*["']/, `class="${targetClass}"`)
              : `${attrs} class="${targetClass}"`;
            return `<a${updated}>`;
          },
        );
        return `<nav${navAttrs}>${newInner}</nav>`;
      },
    );
  });
}
