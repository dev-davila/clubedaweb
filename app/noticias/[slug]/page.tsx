import { Metadata } from "next";
import { getSiteUrl } from "@/lib/constants";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, ArrowLeft, Tag, Clock, ChevronRight, Send, Newspaper, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { ShareButton } from "@/components/share-button";
import { NewsletterForm } from "@/components/newsletter-form";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { markdownToHtml } from "@/lib/markdown";
import { ViewTracker } from "@/components/noticias/view-tracker";
import { getPublishedStitchHtml } from "@/lib/stitch/published-pages";
import { applyMenuLabels } from "@/lib/stitch/apply-menu-labels";
import { getStitchMenuItems } from "@/lib/stitch/menu-items";
import { wrapPostInStitchChrome } from "@/lib/stitch/inject-blog-posts";
import { StitchPageView } from "@/components/stitch/stitch-page-view";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  const blogPost = await prisma.blogPost.findUnique({
    where: { slug },
    include: { 
      category: { include: { tags: { include: { tag: true } } } }, 
      author: true, 
      tags: { include: { tag: true } },
      chronicle: {
        include: {
          article: true
        }
      }
    }
  });

  if (blogPost && blogPost.status === "PUBLISHED" && !blogPost.deletedAt) {
    return {
      type: "blog" as const,
      post: blogPost
    };
  }

  return null;
}

async function getRecentPosts(excludeId: string) {
  return prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      geoCity: null,
      geoState: null,
      NOT: { id: excludeId }
    },
    take: 5,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      featuredImage: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } }
    }
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPost(slug);

  if (!result) return { title: "Notícia não encontrada" };

  const post = result.post;
  const title = post.title;
  const description = (post as any).metaDescription || (post as any).excerpt;
  
  const featuredImage = (post as any).featuredImage;
  
  const baseUrl = getSiteUrl();
  const postUrl = `${baseUrl}/noticias/${slug}`;

  return { 
    title, 
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: postUrl,
      images: featuredImage ? [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: title
        }
      ] : undefined,
      siteName: "M3Solutions"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: featuredImage ? [featuredImage] : undefined
    }
  };
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPost(slug);

  if (!result) notFound();

  const { post } = result;

  // Quando o site Stitch está publicado, wrap o post com o chrome do Stitch
  // (header/footer/style) — mantém identidade visual do site nas páginas
  // de detalhe.
  const stitchHtml = await getPublishedStitchHtml("blog");
  if (stitchHtml) {
    const menuItems = await getStitchMenuItems();
    const chromeHtml = applyMenuLabels(stitchHtml, menuItems);
    const contentHtml = post.content?.startsWith("<")
      ? sanitizeHtml(post.content)
      : sanitizeHtml(await markdownToHtml(post.content ?? ""));
    const wrapped = wrapPostInStitchChrome(chromeHtml, {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      featuredImage: (post as { featuredImage?: string | null }).featuredImage,
      category: (post as { category?: { name?: string } | null }).category?.name ?? null,
      author: (post as { author?: { name?: string } | null }).author?.name ?? null,
      publishedAt: post.publishedAt ?? post.createdAt,
      content: contentHtml,
    });
    return (
      <>
        <ViewTracker slug={slug} />
        <StitchPageView html={wrapped} fullViewport />
      </>
    );
  }

  // Default image for posts without featured image
  const DEFAULT_POST_IMAGE = "/images/blog-default.jpg";
  
  // Helper to validate image URL
  const getValidImageUrl = (url: string | null | undefined): string => {
    if (!url || url.trim() === '' || url.startsWith('data:') || url.includes('undefined') || url.includes('youtube.com')) {
      return DEFAULT_POST_IMAGE;
    }
    return url;
  };

  // Normalize post data
  const chronicle = (post as any).chronicle;
  const sourceUrl = chronicle?.article?.originalUrl || null;
  const sourceReference = chronicle?.sourceReference || null;

  const normalizedPost = {
    id: post.id,
    title: post.title,
    content: (post as any).content,
    excerpt: (post as any).excerpt,
    imageUrl: getValidImageUrl((post as any).featuredImage),
    secondaryImage: (post as any).secondaryImage,
    imageAlt: (post as any).imageAlt,
    category: (post as any).category?.name || "Geral",
    categorySlug: (post as any).category?.slug,
    categoryTags: (post as any).category?.tags?.map((t: any) => t.tag) || [],
    author: (post as any).author?.name || "M3Solutions",
    authorImage: (post as any).author?.avatar,
    authorBio: (post as any).author?.bio,
    publishedAt: (post as any).publishedAt || post.createdAt,
    tags: (post as any).tags?.map((t: any) => t.tag) || [],
    readingTime: Math.ceil(((post as any).content?.length || 0) / 1500) || 3,
    sourceUrl,
    sourceReference
  };

  // Get related posts - match by tags first, then category, weighted by recency and views (Item 10)
  const postTagIds = (post as any).tags?.map((t: any) => t.tagId) || [];
  
  let relatedPosts: any[] = [];
  if (postTagIds.length > 0) {
    // First try to find posts sharing tags
    relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        geoCity: null,
        geoState: null,
        NOT: { id: post.id },
        tags: { some: { tagId: { in: postTagIds } } }
      },
      take: 3,
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      include: { category: true }
    });
  }
  
  // Fill remaining spots with same-category posts
  if (relatedPosts.length < 3) {
    const excludeIds = [post.id, ...relatedPosts.map(p => p.id)];
    const categoryPosts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        categoryId: (post as any).categoryId,
        geoCity: null,
        geoState: null,
        NOT: { id: { in: excludeIds } }
      },
      take: 3 - relatedPosts.length,
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      include: { category: true }
    });
    relatedPosts = [...relatedPosts, ...categoryPosts];
  }

  // Get recent posts for sidebar
  const recentPosts = await getRecentPosts(post.id);

  // All tags for this category
  const allCategoryTags = normalizedPost.categoryTags;

  // Get WhatsApp link from site config
  const whatsappConfig = await prisma.siteConfig.findFirst({ where: { key: "contact_whatsapp" } });
  const whatsappNumber = whatsappConfig?.value || "1130907604";
  const whatsappLink = `https://wa.me/55${whatsappNumber.replace(/\\D/g, '')}`;

  // Clean content from markdown artifacts
  const cleanContent = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
      .replace(/```html\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();
  };

  const cleanedContent = cleanContent(normalizedPost.content);
  const cleanedExcerpt = cleanContent(normalizedPost.excerpt);

  // Split content for secondary image insertion
  const contentParts = cleanedContent.split('\n\n') || [];
  const midPoint = Math.floor(contentParts.length / 2);
  const firstHalf = contentParts.slice(0, midPoint).join('\n\n');
  const secondHalf = contentParts.slice(midPoint).join('\n\n');

    // WhatsApp CTA button HTML
  const whatsappBtn = `<a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>FALAR AGORA</a>`;

  // Convert markdown to HTML using marked library, then post-process WhatsApp buttons
  const convertToHtml = (text: string): string => {
    if (!text) return "";
    // Replace WhatsApp markers before markdown conversion
    let processed = text
      .replace(/\[\*\*FALAR AGORA\*\*\]/gi, `%%WHATSAPP_BTN%%`)
      .replace(/\[FALAR AGORA\]/gi, `%%WHATSAPP_BTN%%`)
      .replace(/\[Falar Agora\]/g, `%%WHATSAPP_BTN%%`);
    // Convert markdown to HTML
    let html = markdownToHtml(processed);
    // Replace WhatsApp placeholder with button HTML
    html = html.replace(/%%WHATSAPP_BTN%%/g, whatsappBtn);
    return html;
  };

  const firstHalfHtml = convertToHtml(firstHalf);
  const secondHalfHtml = convertToHtml(secondHalf);

  return (
    <>
      <ViewTracker slug={slug} />
      {/* Hero */}
      <section className="relative py-20 min-h-[40vh] flex items-center">
        {normalizedPost.imageUrl ? (
          <>
            <div className="absolute inset-0 z-0">
              <Image
                src={normalizedPost.imageUrl}
                alt={normalizedPost.imageAlt || normalizedPost.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary" />
        )}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <nav className="flex items-center gap-2 text-gray-300 text-sm mb-6">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight size={14} />
              <Link href="/noticias" className="hover:text-white">Notícias</Link>
              {normalizedPost.categorySlug && (
                <>
                  <ChevronRight size={14} />
                  <Link
                    href={`/noticias?categoria=${normalizedPost.categorySlug}`}
                    className="hover:text-white"
                  >
                    {normalizedPost.category}
                  </Link>
                </>
              )}
            </nav>
            <span className="inline-block bg-primary text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              {normalizedPost.category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {normalizedPost.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-gray-300">
              <span className="flex items-center gap-2">
                <Calendar size={18} />
                {new Date(normalizedPost.publishedAt).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
              <span className="flex items-center gap-2">
                <User size={18} />
                {normalizedPost.author}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={18} />
                {normalizedPost.readingTime} min de leitura
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content with Sidebar */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <Link
                href="/noticias"
                className="inline-flex items-center gap-2 text-primary font-medium mb-4 hover:text-primary transition"
              >
                <ArrowLeft size={18} />
                Voltar para notícias
              </Link>

              {cleanedExcerpt && (
                <p className="text-lg text-gray-600 mb-6 leading-relaxed font-medium border-l-4 border-primary pl-4">
                  {cleanedExcerpt}
                </p>
              )}

              {/* Author Card */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-6">
                {normalizedPost.authorImage ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={normalizedPost.authorImage}
                      alt={normalizedPost.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {normalizedPost.author.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{normalizedPost.author}</p>
                  <p className="text-xs text-gray-500">{normalizedPost.authorBio ? normalizedPost.authorBio.substring(0, 80) : "Autor | M3Solutions"}</p>
                </div>
              </div>

              {/* First half of content */}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(firstHalfHtml) }}
              />

              {/* Secondary Image in the middle - only show if exists */}
              {normalizedPost.secondaryImage && (
                <div className="my-8 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <div className="relative aspect-[16/9] bg-gray-100">
                    <Image
                      src={normalizedPost.secondaryImage}
                      alt={`${normalizedPost.title} - Imagem ilustrativa`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="bg-gradient-to-r from-primary/5 to-gray-50 px-4 py-2">
                    <p className="text-center text-sm text-gray-600 font-medium">
                      📷 Imagem ilustrativa
                    </p>
                  </div>
                </div>
              )}

              {/* Second half of content */}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(secondHalfHtml) }}
              />

              {/* Fonte Original */}
              {normalizedPost.sourceUrl && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ExternalLink size={14} />
                    Fonte da Matéria
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {normalizedPost.sourceReference || "Matéria original:"}
                  </p>
                  <a
                    href={normalizedPost.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary text-sm font-medium transition-colors"
                  >
                    <span className="truncate max-w-xs">{new URL(normalizedPost.sourceUrl).hostname.replace('www.', '')}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {/* Tags do Post */}
              {normalizedPost.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                    <Tag size={14} />
                    Tags deste artigo
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {normalizedPost.tags.map((tag: any) => (
                      <Link
                        key={tag.id}
                        href={`/noticias?tag=${tag.slug}`}
                        className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags da Categoria */}
              {allCategoryTags.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">
                    Mais tags em {normalizedPost.category}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {allCategoryTags.map((tag: any) => (
                      <Link
                        key={tag.id}
                        href={`/noticias?tag=${tag.slug}`}
                        className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-gray-200 transition"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-medium text-sm">Compartilhar:</span>
                  <ShareButton title={normalizedPost.title} />
                </div>
              </div>

              {/* WhatsApp CTA - always visible */}
              <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Precisa de ajuda com TI para sua empresa?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Fale com nossos especialistas e receba uma consultoria gratuita.
                </p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  FALAR AGORA
                </a>
              </div>
            </div>

            {/* Sidebar - Sticky */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-3">
                {/* Newsletter */}
                <div className="bg-gradient-to-br from-primary to-primary rounded-lg p-4 text-white">
                  <h3 className="text-base font-bold mb-1.5 flex items-center gap-2">
                    <Send size={16} />
                    Newsletter
                  </h3>
                  <p className="text-primary-foreground/80 text-xs mb-3">
                    Receba as melhores notícias e dicas de TI diretamente no seu e-mail.
                  </p>
                  <NewsletterForm />
                </div>

                {/* Últimos Posts */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Newspaper size={16} className="text-primary" />
                    Últimas Notícias
                  </h3>
                  <div className="space-y-2.5">
                    {recentPosts.map((recentPost) => (
                      <Link
                        key={recentPost.id}
                        href={`/noticias/${recentPost.slug}`}
                        className="flex gap-2.5 group"
                      >
                        <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                          {recentPost.featuredImage ? (
                            <Image
                              src={recentPost.featuredImage}
                              alt={recentPost.title}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-gray-900 group-hover:text-primary transition line-clamp-2">
                            {recentPost.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(recentPost.publishedAt || new Date()).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short"
                            })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/noticias"
                    className="block text-center text-primary text-xs font-medium mt-3 hover:text-primary transition"
                  >
                    Ver todas as notícias →
                  </Link>
                </div>

                {/* CTA */}
                <div className="bg-gray-900 rounded-lg p-4 text-white">
                  <h3 className="text-sm font-bold mb-1.5">Precisa de ajuda com TI?</h3>
                  <p className="text-gray-300 text-xs mb-3">
                    Fale com nossos especialistas e descubra como podemos ajudar sua empresa.
                  </p>
                  <Link
                    href="/contato"
                    className="block w-full bg-primary text-center py-2 rounded-md text-sm font-medium hover:bg-primary transition"
                  >
                    Falar com especialista
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts?.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Notícias Relacionadas
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {relatedPosts.map((related: any) => {
                const imageUrl = related.featuredImage;
                return (
                  <Link key={related.id} href={`/noticias/${related.slug}`}>
                    <article className="group bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
                      <div className="relative h-40 overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={related.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-primary" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition line-clamp-2">
                          {related.title}
                        </h3>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
