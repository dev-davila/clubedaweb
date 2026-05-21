/**
 * Integra os posts REAIS (tabela BlogPost) no HTML estático do Stitch
 * publicado pra /noticias. O Stitch gerou cards genéricos no momento do
 * publish — substituímos por cards dos posts do banco, preservando o
 * template visual (classes Tailwind, estrutura).
 *
 * Também há helper pra single post: pega o chrome do Stitch (head/header/
 * footer) e injeta o conteúdo do post no body.
 */

export interface BlogPostLike {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  category?: string | null;
  author?: string | null;
  publishedAt?: Date | string | null;
  content?: string | null;
}

const DEFAULT_IMAGE = "/images/blog-default.jpg";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function formatDate(d?: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function imageUrl(p: BlogPostLike): string {
  const url = p.featuredImage?.trim();
  if (!url || url.startsWith("data:") || url.includes("undefined")) return DEFAULT_IMAGE;
  return url;
}

/**
 * Pega o PRIMEIRO <article> do HTML como template e clona pra cada post,
 * substituindo: <img src>, primeiro título (h*), primeiro <p>, <a href>.
 * Conservador — só toca essas 4 substituições.
 */
function cloneArticleTemplate(template: string, post: BlogPostLike): string {
  let card = template;
  // Imagem
  card = card.replace(
    /(<img\b[^>]*\bsrc=["'])[^"']*(["'])/i,
    `$1${escapeAttr(imageUrl(post))}$2`,
  );
  card = card.replace(
    /(<img\b[^>]*\balt=["'])[^"']*(["'])/i,
    `$1${escapeAttr(post.title)}$2`,
  );
  // Primeiro título h1/h2/h3
  card = card.replace(
    /(<h[1-4]\b[^>]*>)[\s\S]{0,500}?(<\/h[1-4]>)/i,
    `$1${escapeHtml(post.title)}$2`,
  );
  // Primeiro parágrafo
  if (post.excerpt) {
    card = card.replace(
      /(<p\b[^>]*>)[\s\S]{0,500}?(<\/p>)/i,
      `$1${escapeHtml(post.excerpt)}$2`,
    );
  }
  // Categoria — segundo <p> ou <span> com texto curto
  if (post.category) {
    card = card.replace(
      /(<span\b[^>]*>)([^<\n]{1,50}?)(<\/span>)/i,
      `$1${escapeHtml(post.category)}$3`,
    );
  }
  // Todos os <a href> apontam pro post (sem destruir o <a> do brand caso esteja dentro)
  card = card.replace(
    /(<a\b[^>]*\bhref=["'])[^"']*(["'])/gi,
    `$1/noticias/${escapeAttr(post.slug)}$2`,
  );
  // Data legível, se houver <time>
  const dateStr = formatDate(post.publishedAt);
  if (dateStr) {
    card = card.replace(
      /(<time\b[^>]*>)[\s\S]{0,80}?(<\/time>)/i,
      `$1${escapeHtml(dateStr)}$2`,
    );
  }
  return card;
}

export function injectBlogPostsList(
  html: string,
  posts: BlogPostLike[],
): string {
  if (posts.length === 0) return html;
  // Encontra todos os <article>...</article>
  const articleRe = /<article\b[\s\S]*?<\/article>/gi;
  const matches: { match: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = articleRe.exec(html)) !== null) {
    matches.push({ match: m[0], index: m.index });
    if (matches.length > 10) break; // safety
  }
  if (matches.length === 0) return html;

  const template = matches[0].match;
  const firstIdx = matches[0].index;
  const lastIdx = matches[matches.length - 1].index + matches[matches.length - 1].match.length;

  // Renderiza posts usando o template
  const newCards = posts.slice(0, 12).map((p) => cloneArticleTemplate(template, p));

  // Substitui o range que cobre todos os articles
  return html.slice(0, firstIdx) + newCards.join("\n") + html.slice(lastIdx);
}

/**
 * Pra single post (/noticias/[slug]): mantém head/header/footer do Stitch e
 * injeta o conteúdo do post no <main> do body.
 */
export function wrapPostInStitchChrome(
  blogHtml: string,
  post: BlogPostLike,
): string {
  const headMatch = blogHtml.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  const headerMatch = blogHtml.match(/<header\b[\s\S]*?<\/header>/i);
  const footerMatch = blogHtml.match(/<footer\b[\s\S]*?<\/footer>/i);
  const bodyOpenMatch = blogHtml.match(/<body\b[^>]*>/i);
  const htmlOpenMatch = blogHtml.match(/<html\b[^>]*>/i);

  const head = headMatch?.[0] ?? "<head><meta charset='utf-8'/></head>";
  const header = headerMatch?.[0] ?? "";
  const footer = footerMatch?.[0] ?? "";
  const bodyOpen = bodyOpenMatch?.[0] ?? "<body>";
  const htmlOpen = htmlOpenMatch?.[0] ?? '<html lang="pt-BR">';

  const dateStr = formatDate(post.publishedAt);
  const img = imageUrl(post);
  const content = post.content?.trim() || "";

  // Conteúdo: hero do post + body
  const article = `
<main class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
  <article class="prose prose-invert max-w-3xl mx-auto">
    ${post.category ? `<div class="text-label-md font-label-md text-primary uppercase tracking-wider mb-3">${escapeHtml(post.category)}</div>` : ""}
    <h1 class="font-headline-xl text-headline-xl mb-6 text-on-surface">${escapeHtml(post.title)}</h1>
    <div class="flex items-center gap-3 text-on-surface-variant text-body-md mb-8">
      <span>${escapeHtml(post.author ?? "")}</span>
      ${dateStr ? `<span>·</span><time>${escapeHtml(dateStr)}</time>` : ""}
    </div>
    ${img !== DEFAULT_IMAGE ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(post.title)}" class="w-full rounded-2xl mb-10" />` : ""}
    ${post.excerpt ? `<p class="text-body-lg text-on-surface-variant mb-8">${escapeHtml(post.excerpt)}</p>` : ""}
    <div class="text-body-md text-on-surface space-y-4">
      ${content}
    </div>
    <div class="mt-12 pt-8 border-t border-outline-variant/30">
      <a href="/noticias" class="text-primary hover:underline">← Voltar para todas as notícias</a>
    </div>
  </article>
</main>
`;

  return `<!DOCTYPE html>
${htmlOpen}
${head}
${bodyOpen}
${header}
${article}
${footer}
</body>
</html>`;
}
