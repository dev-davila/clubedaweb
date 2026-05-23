/**
 * Revisa TODOS os hrefs do HTML Stitch e reescreve os inválidos pra
 * destinos seguros.
 *
 * Regras:
 *  - Externos (http://, https://, mailto:, tel:, wa.me/whatsapp): mantém
 *  - Âncoras conhecidas (#metodo, #faq, #servicos…): mantém OU reescreve
 *    via rewriteStitchLinks (já faz no sanitize)
 *  - Rotas internas válidas (em validRoutes): mantém
 *  - Rotas internas INVÁLIDAS (apontam pra slug que não existe): reescreve
 *    pra /contato (CTA seguro) — evita 404 e botões mortos.
 *  - Vazias ("" ou "#"): reescreve pra /contato (já feito pelo sanitize)
 */

const EXTERNAL_RE = /^(https?:|mailto:|tel:|sms:|javascript:)/i;
const ANCHOR_RE = /^#/;
const STATIC_VALID_ROUTES = new Set([
  "/", "/quem-somos", "/solucoes", "/contato", "/noticias",
  "/aviso-de-cookies", "/aviso-de-privacidade", "/lgpd",
  "/etica", "/canal-de-denuncias", "/sustentabilidade",
  "/responsabilidade-social", "/politica-antissuborno-e-anticorrupcao",
  "/missao-visao-e-valores", "/nossos-parceiros", "/portfolio",
  "/catalogo", "/trabalhe-conosco",
]);

export interface ValidateLinksOptions {
  /** Slugs de páginas custom publicadas (sem prefixo /). */
  customSlugs?: string[];
  /** Slugs de BlogPosts publicados pra validar /noticias/<slug>. */
  blogSlugs?: string[];
  /** Onde redirecionar CTAs inválidos. Default: /contato. */
  fallbackRoute?: string;
}

export function validateAndFixLinks(html: string, opts: ValidateLinksOptions = {}): string {
  const customSlugs = new Set(opts.customSlugs ?? []);
  const blogSlugs = new Set(opts.blogSlugs ?? []);
  const fallback = opts.fallbackRoute ?? "/contato";

  // Valid routes = estáticas + custom + /noticias/<slug>
  const validRoutes = new Set(STATIC_VALID_ROUTES);
  customSlugs.forEach((s) => validRoutes.add(`/${s}`));
  blogSlugs.forEach((s) => validRoutes.add(`/noticias/${s}`));

  return html.replace(/href=(["'])([^"']*)\1/gi, (match, q, href) => {
    const v = href.trim();
    if (!v) return `href=${q}${fallback}${q}`;
    if (EXTERNAL_RE.test(v)) return match;
    if (ANCHOR_RE.test(v)) return match;

    // Normaliza path (remove trailing slash exceto root, remove query/hash pra check)
    const pathOnly = v.split("?")[0].split("#")[0];
    const clean = pathOnly === "/" ? "/" : pathOnly.replace(/\/$/, "");

    if (validRoutes.has(clean)) return match;
    if (clean.startsWith("/noticias/") && !blogSlugs.has(clean.replace("/noticias/", ""))) {
      return `href=${q}${fallback}${q}`;
    }
    if (clean === "/noticias" || clean.startsWith("/noticias?")) return match;
    return `href=${q}${fallback}${q}`;
  });
}
