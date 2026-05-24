import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PostsGrid } from "@/components/noticias/posts-grid";
import { tryRenderStitchPublicPage } from "@/lib/stitch/render-stitch-public";
import { getPublishedStitchHtml } from "@/lib/stitch/published-pages";
import { injectBlogPostsList } from "@/lib/stitch/inject-blog-posts";
import { applyMenuLabels } from "@/lib/stitch/apply-menu-labels";
import { applyActiveMenu } from "@/lib/stitch/apply-active-menu";
import { applyContrastFix } from "@/lib/stitch/apply-contrast-fix";
import { applyCurrentContacts } from "@/lib/stitch/apply-current-contacts";
import { applySiteImages } from "@/lib/stitch/apply-site-images";
import { applySocialLinks } from "@/lib/stitch/apply-social-links";
import { getStitchMenuItems } from "@/lib/stitch/menu-items";
import { StitchPageView } from "@/components/stitch/stitch-page-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Fique por dentro das últimas novidades sobre tecnologia, cloud, segurança e TI."
};

export default async function NoticiasPage({
  searchParams
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const params = await searchParams;
  const categoryFilter = params.categoria;

  // Fetch blog posts (legacy Post model removed - all content now in BlogPost)
  const blogPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      geoCity: null,
      geoState: null,
      ...(categoryFilter ? { category: { slug: categoryFilter } } : {})
    },
    orderBy: { publishedAt: "desc" },
    include: { category: true, author: true }
  });

  // Quando há site Stitch publicado, mistura: usa o HTML estático como
  // shell (header/footer/style) mas substitui os cards genéricos pelos
  // posts REAIS do banco. Posts editados no /gestor/posts refletem
  // imediatamente em /noticias.
  const stitchHtml = await getPublishedStitchHtml("blog");
  if (stitchHtml) {
    const menuItems = await getStitchMenuItems();
    const withLabels = applyMenuLabels(stitchHtml, menuItems);
    const withMenu = applyActiveMenu(withLabels, "/noticias");
    const withPosts = injectBlogPostsList(
      withMenu,
      blogPosts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        featuredImage: p.featuredImage,
        category: p.category?.name ?? null,
        author: p.author?.name ?? null,
        publishedAt: p.publishedAt ?? p.createdAt,
      })),
    );
    let final = await applyCurrentContacts(withPosts);
    final = await applySiteImages(final);
    final = await applySocialLinks(final);
    final = applyContrastFix(final);
    return <StitchPageView html={final} fullViewport />;
  }
  // Fallback: usa template legado (Stitch não publicado ainda)
  const stitch = await tryRenderStitchPublicPage("blog");
  if (stitch) return stitch;
  
  const categories = await prisma.blogCategory.findMany({
    where: { active: true },
    orderBy: { order: "asc" }
  });
  
  // Count posts per category from fetched data
  const categoryPostCounts = blogPosts.reduce((acc, post) => {
    if (post.categoryId) {
      acc[post.categoryId] = (acc[post.categoryId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const DEFAULT_IMAGE = "/images/blog-default.jpg";
  
  const getValidImageUrl = (url: string | null): string => {
    if (!url || url.trim() === '' || url.startsWith('data:') || url.includes('undefined') || url.includes('youtube.com')) {
      return DEFAULT_IMAGE;
    }
    return url;
  };

  interface NormalizedPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    imageUrl: string;
    category: string;
    categorySlug: string | null;
    author: string;
    publishedAt: string;
    isNew: boolean;
  }

  // Normalizar posts do BlogPost
  const normalizedBlog: NormalizedPost[] = blogPosts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    imageUrl: getValidImageUrl(p.featuredImage),
    category: p.category?.name || "Geral",
    categorySlug: p.category?.slug || null,
    author: p.author?.name || "M3Solutions",
    publishedAt: (p.publishedAt || p.createdAt).toISOString(),
    isNew: true
  }));

  // Posts já ordenados por publishedAt desc
  const allPosts = normalizedBlog;

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Notícias</h1>
            <p className="text-xl text-primary-foreground/80">
              Fique por dentro das novidades do mundo da tecnologia, cloud, segurança e muito mais.
            </p>
          </div>
        </div>
      </section>

      {/* Categories - apenas categorias do banco, sem duplicatas */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/noticias"
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                !categoryFilter
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-primary/5"
              }`}
            >
              Todos
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/noticias?categoria=${cat.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  categoryFilter === cat.slug
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 hover:bg-primary/5"
                }`}
              >
                {cat.name}
                {categoryPostCounts[cat.id] > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">({categoryPostCounts[cat.id]})</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Posts com paginação */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <PostsGrid initialPosts={allPosts} postsPerPage={18} />
        </div>
      </section>
    </>
  );
}
