/**
 * Extrai os <article> que o Stitch gerou na blog page e devolve estrutura
 * pronta pra criar BlogPost no banco. Usado no publish: garante que cada
 * site Stitch saia com posts iniciais já cadastrados como entidades reais,
 * editáveis no /gestor/posts.
 */

export interface ExtractedArticle {
  title: string;
  excerpt: string;
  featuredImage: string | null;
  category: string | null;
  slug: string;
}

const STOP_WORDS = new Set([
  "de", "da", "do", "das", "dos", "para", "com", "em", "no", "na", "nos", "nas",
  "o", "a", "os", "as", "um", "uma", "uns", "umas", "e", "ou", "que", "se", "sua",
  "seu", "suas", "seus", "à", "ao", "aos", "às",
]);

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .join("-")
    .slice(0, 80);
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

export function extractBlogArticles(html: string): ExtractedArticle[] {
  const articleRe = /<article\b[\s\S]*?<\/article>/gi;
  const articles: ExtractedArticle[] = [];
  let m: RegExpExecArray | null;
  while ((m = articleRe.exec(html)) !== null) {
    const block = m[0];
    // Título: primeiro h1/h2/h3/h4
    const titleMatch = block.match(/<h[1-4]\b[^>]*>([\s\S]{1,400}?)<\/h[1-4]>/i);
    if (!titleMatch) continue;
    const title = decode(stripTags(titleMatch[1]));
    if (!title || title.length < 5) continue;

    // Excerpt: primeiro <p> não-vazio
    const pMatch = block.match(/<p\b[^>]*>([\s\S]{20,800}?)<\/p>/i);
    const excerpt = pMatch ? decode(stripTags(pMatch[1])) : "";

    // Imagem: primeira <img src=…>
    const imgMatch = block.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
    const featuredImage = imgMatch ? decode(imgMatch[1]) : null;

    // Categoria: pega o primeiro <span> com texto livre (skip material-symbols/icons)
    const spans = [...block.matchAll(/<span\b[^>]*>([^<\n]{2,60})<\/span>/gi)];
    const category = spans
      .map((s) => decode(stripTags(s[1])).trim())
      .find((s) => s && !/^(arrow_|material|chevron|menu|close|search|more)/i.test(s) && s.length <= 50)
      ?? null;

    articles.push({
      title,
      excerpt,
      featuredImage,
      category,
      slug: slugify(title),
    });
    if (articles.length >= 12) break;
  }
  return articles;
}
