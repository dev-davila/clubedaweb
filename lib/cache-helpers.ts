/**
 * Cache Helper - Implementa Cache-Aside Pattern
 * Utilitários para usar cache em endpoints de leitura
 */

import { cache } from './cache';

/**
 * Remember pattern - executa função se não houver cache
 * @param key - chave do cache
 * @param ttl - tempo de vida em ms
 * @param fn - função a executar se não houver cache
 */
export async function remember<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  try {
    // Tentar obter do cache
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Se não houver cache, executar função
    const result = await fn();

    // Armazenar no cache
    cache.set(key, result, ttl);

    return result;
  } catch (error) {
    // Se houver erro no cache, apenas executar a função
    return fn();
  }
}

/**
 * Cache invalidation helper
 * @param key - chave exata para invalidar
 */
export function invalidate(key: string): void {
  cache.delete(key);
}

/**
 * Chaves de cache pré-definidas
 */
export const CACHE_KEYS = {
  CATEGORIES: (id?: string) => id ? `categories:${id}` : 'categories:all',
  AUTHORS: (id?: string) => id ? `authors:${id}` : 'authors:all',
  PARTNERS: (id?: string) => id ? `partners:${id}` : 'partners:all',
  TAGS: (id?: string) => id ? `tags:${id}` : 'tags:all',
  POSTS: (id?: string) => id ? `posts:${id}` : 'posts:all',
  SITE_CONFIG: 'site-config:all',
  SITE_CONFIG_CATEGORY: (category: string) => `site-config:${category}`,
} as const;
