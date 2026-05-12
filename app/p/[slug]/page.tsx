import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { getTemplate } from "@/lib/templates";
import type { PageLayoutConfig } from "@/lib/templates/types";
import { EditModeOverlay } from "@/components/edit-mode-overlay";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.dynamicPage.findUnique({
    where: { slug },
    select: { title: true, metaTitle: true, metaDescription: true, featuredImage: true }
  });

  if (!page) return { title: "Página não encontrada" };

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      images: page.featuredImage ? [page.featuredImage] : undefined
    }
  };
}

function parseLayoutConfig(raw: string | null | undefined): PageLayoutConfig {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PageLayoutConfig;
  } catch {
    return {};
  }
}

export default async function DynamicPageRoute({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const editMode = sp._edit === "1";

  const page = await prisma.dynamicPage.findUnique({
    where: editMode ? { slug } : { slug, status: "PUBLISHED" }
  });

  if (!page) notFound();

  const layoutConfig = parseLayoutConfig(page.layoutConfig);
  const template = getTemplate(layoutConfig.template);

  // Modern path: template-driven rendering
  if (template && layoutConfig.sections && layoutConfig.sections.length > 0) {
    return (
      <main className="min-h-screen">
        {layoutConfig.sections.map((s, idx) => {
          const def = template.sections[s.key];
          if (!def) return null;
          const Component = def.Component;
          // When in edit mode, inject _editIdx so components add data-edit attributes
          const data = editMode ? { ...(s.data ?? {}), _editIdx: idx } : (s.data ?? {});
          return <Component key={`${s.key}-${idx}`} data={data} />;
        })}
        {editMode && <EditModeOverlay />}
      </main>
    );
  }

  // Legacy fallback: hero + HTML content + optional CTA
  return (
    <main className="min-h-screen">
      <section
        className="relative py-20 md:py-28 bg-gradient-to-br from-primary via-primary to-primary/80"
        style={layoutConfig.heroBg ? { background: layoutConfig.heroBg } : undefined}
      >
        {page.featuredImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${page.featuredImage})` }}
          />
        )}
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
              {page.excerpt}
            </p>
          )}
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          {page.content ? (
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-heading prose-headings:text-foreground prose-headings:font-bold
                prose-p:text-foreground/80 prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-lg prose-img:shadow-md
                prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                prose-ul:list-disc prose-ol:list-decimal
                prose-li:text-foreground/80
                prose-strong:text-foreground
                prose-table:border-collapse prose-th:bg-muted prose-th:border prose-td:border prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
            />
          ) : (
            <div className="text-center py-16">
              <p className="text-foreground/60 text-lg">Conteúdo em construção</p>
            </div>
          )}
        </div>
      </section>

      {layoutConfig.showCTA !== false && (
        <section className="bg-gradient-to-r from-primary to-primary/80 py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">
              {layoutConfig.ctaTitle || "Quer saber mais?"}
            </h2>
            <p className="text-white/85 mb-6">
              {layoutConfig.ctaText || "Entre em contato com nossos especialistas"}
            </p>
            <Link
              href={layoutConfig.ctaLink || "/contato"}
              className="inline-flex items-center px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              {layoutConfig.ctaButtonText || "Fale Conosco"}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
