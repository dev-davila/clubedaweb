/**
 * Cache em memória com TTL
 * Para produção em larga escala, migrar para Redis
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Obter valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Definir valor no cache com TTL
   */
  set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Limpar entrada do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obter ou definir valor com função de retorno
   */
  async remember<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;

    const value = await fn();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Stats do cache (para monitoramento)
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cache = new MemoryCache();

/**
 * Configuração de cache por tipo de dado
 */
export const CACHE_CONFIG = {
  // Dados que mudam raramente
  siteConfig: { ttl: 3600, key: 'site:config' },           // 1 hora
  partners: { ttl: 7200, key: 'partners:all' },              // 2 horas
  categories: { ttl: 86400, key: 'categories:all' },          // 24 horas
  authors: { ttl: 86400, key: 'authors:all' },               // 24 horas
  tags: { ttl: 86400, key: 'tags:all' },                     // 24 horas
  ctaTemplates: { ttl: 86400, key: 'cta:templates' },       // 24 horas
  voiceTemplates: { ttl: 86400, key: 'voice:templates' },   // 24 horas

  // Dados que mudam com frequência
  posts: { ttl: 1800, key: 'posts:all' },                    // 30 minutos
  publishedPosts: { ttl: 600, key: 'posts:published' },      // 10 minutos
  recentPosts: { ttl: 300, key: 'posts:recent' },            // 5 minutos

  // Dados dinâmicos
  userSession: { ttl: 1800, key: 'session:' },               // 30 minutos
  apiResponse: { ttl: 300, key: 'api:' },                    // 5 minutos
};

/**
 * Limpar cache de um tipo de dado
 */
export function clearCacheByType(type: keyof typeof CACHE_CONFIG): void {
  const pattern = CACHE_CONFIG[type].key;
  const stats = cache.stats();
  const keysToDelete = stats.keys.filter(k => k.startsWith(pattern));
  keysToDelete.forEach(k => cache.delete(k));
}

/**
 * Limpar todo o cache (usar com cuidado)
 */
export function clearAllCache(): void {
  cache.clear();
}
