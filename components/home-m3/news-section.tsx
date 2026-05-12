import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { prisma } from "@/lib/db";

export async function NewsSection() {
  // Buscar posts mais recentes do BlogPost (excluindo sub-páginas geo-localizadas)
  const blogPosts = await prisma.blogPost.findMany({
    where: { 
      status: 'PUBLISHED',
      deletedAt: null,
      geoCity: null,
      geoState: null
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    include: { category: true }
  });

  const DEFAULT_IMAGE = "/images/blog-default.jpg";
  
  // Helper para validar URL de imagem
  const getValidImageUrl = (url: string | null): string => {
    if (!url || url.trim() === '' || url.startsWith('data:') || url.includes('undefined') || url.includes('youtube.com')) {
      return DEFAULT_IMAGE;
    }
    return url;
  };

  const posts = blogPosts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    imageUrl: getValidImageUrl(post.featuredImage),
    category: post.category?.name || 'Tecnologia',
    publishedAt: post.publishedAt || post.createdAt
  }));

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <SectionTitle
          title="Últimas Notícias"
          subtitle="Fique por dentro das novidades do mundo da tecnologia"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts?.map((post) => (
            <Link key={post.id} href={`/noticias/${post.slug}`}>
              <article className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                <div className="relative h-48 overflow-hidden">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700" />
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                    <Calendar size={14} />
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("pt-BR") : ''}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-2 mb-4">
                    {post.excerpt ?? ""}
                  </p>
                  <span className="inline-flex items-center text-blue-600 font-medium">
                    Ler mais <ArrowRight size={16} className="ml-2" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
          >
            Ver todas as notícias
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
