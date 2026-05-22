/**
 * Marca o item de menu ativo conforme a rota atual.
 *
 * Detecta a classe "ativa" por FEATURES (border-b, underline, font-bold,
 * text-primary…) em vez de assumir que o 1º <a> do nav é o ativo — o
 * header propagado por standardize-chrome pode ter vindo de qualquer
 * página de referência, então o link marcado ativo no template pode ser
 * o "Quem somos" ou outro.
 *
 * Normaliza /noticias/<slug> → /noticias.
 */

const NOTICIAS_ROUTE = "/noticias";

const ACTIVE_MARKERS = [
  /\bborder-b-(?:2|4)\b/,
  /\bunderline\b/,
  /\bfont-bold\b/,
  /\btext-primary(?:-fixed(?:-dim)?)?\b/,
  /\bbg-primary\b/,
];

function isActiveLikeClass(cls: string): boolean {
  return ACTIVE_MARKERS.some((re) => re.test(cls));
}

function deriveInactiveClass(activeCls: string): string {
  return activeCls
    .replace(/\bborder-b-(?:2|4)\b/g, "")
    .replace(/\bborder-primary(?:-fixed(?:-dim)?)?\b/g, "")
    .replace(/\bunderline\b/g, "")
    .replace(/\bfont-bold\b/g, "font-medium")
    .replace(/\btext-primary(?:-fixed(?:-dim)?)?\b/g, "text-on-surface-variant")
    .replace(/\bbg-primary\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function applyActiveMenu(html: string, currentRoute: string): string {
  const route = currentRoute.startsWith(`${NOTICIAS_ROUTE}/`) ? NOTICIAS_ROUTE : currentRoute;

  return html.replace(/<header\b[\s\S]*?<\/header>/i, (header) => {
    return header.replace(
      /<nav\b([^>]*)>([\s\S]*?)<\/nav>/gi,
      (_full, navAttrs: string, inner: string) => {
        const aMatches = [...inner.matchAll(/<a\b[^>]*\bhref=["'][^"']+["'][^>]*>/gi)];
        if (aMatches.length === 0) return `<nav${navAttrs}>${inner}</nav>`;

        // Coleta todas as classes únicas dos <a> do nav
        const allClasses = aMatches
          .map((m) => m[0].match(/class=["']([^"']+)["']/)?.[1])
          .filter((c): c is string => Boolean(c));
        if (allClasses.length === 0) return `<nav${navAttrs}>${inner}</nav>`;

        // Encontra a classe ATIVA (com marcadores) e a INATIVA (sem)
        const activeClass =
          allClasses.find((c) => isActiveLikeClass(c)) ??
          allClasses[0];
        const inactiveClass =
          allClasses.find((c) => !isActiveLikeClass(c)) ??
          deriveInactiveClass(activeClass);

        const newInner = inner.replace(
          /<a\b([^>]*)>/gi,
          (tag: string, attrs: string) => {
            const href = attrs.match(/href=["']([^"']+)["']/)?.[1];
            if (!href) return tag;
            const isActive = href === route;
            const targetClass = isActive ? activeClass : inactiveClass;
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
