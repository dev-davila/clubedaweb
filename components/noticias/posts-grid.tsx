"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowRight, Loader2 } from "lucide-react";

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

interface PostsGridProps {
  initialPosts: NormalizedPost[];
  postsPerPage?: number;
}

export function PostsGrid({ initialPosts, postsPerPage = 18 }: PostsGridProps) {
  const [displayCount, setDisplayCount] = useState(postsPerPage);
  const [isLoading, setIsLoading] = useState(false);

  const visiblePosts = initialPosts.slice(0, displayCount);
  const hasMore = displayCount < initialPosts.length;
  const remaining = initialPosts.length - displayCount;

  const loadMore = () => {
    setIsLoading(true);
    // Simular delay para UX
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + postsPerPage, initialPosts.length));
      setIsLoading(false);
    }, 300);
  };

  if (initialPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhuma notícia encontrada.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visiblePosts.map((post) => (
          <Link key={post.id} href={`/noticias/${post.slug}`}>
            <article className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden h-full">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-gray-500 text-sm mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {post.author}
                  </span>
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

      {/* Botão Mais Notícias */}
      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Carregando...
              </>
            ) : (
              "Mais Notícias"
            )}
          </button>
        </div>
      )}
    </>
  );
}
