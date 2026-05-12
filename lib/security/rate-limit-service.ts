// Serviço de Rate Limiting

import { prisma } from '@/lib/db';
import { SecuritySettings } from './types';

// Cache em memória para rate limiting (mais rápido que banco)
const rateLimitCache = new Map<string, { count: number; windowStart: number }>();

// Limpa cache antigo periodicamente
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  
  for (const [key, value] of rateLimitCache.entries()) {
    if (value.windowStart < oneHourAgo) {
      rateLimitCache.delete(key);
    }
  }
}, 300000); // A cada 5 minutos

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  exceeded: boolean;
}

export function checkRateLimit(
  ip: string,
  endpoint: string,
  settings: SecuritySettings
): RateLimitResult {
  const now = Date.now();
  const windowMs = 60000; // 1 minuto
  const windowStart = Math.floor(now / windowMs) * windowMs;
  
  // Determina limite baseado no tipo de endpoint
  let limit: number;
  if (endpoint.includes('/api/auth') || endpoint.includes('/login')) {
    limit = settings.rate_limit_login_attempts;
  } else if (endpoint.startsWith('/api/')) {
    limit = settings.rate_limit_api_requests_per_minute;
  } else {
    limit = settings.rate_limit_requests_per_minute;
  }
  
  const cacheKey = `${ip}:${endpoint}:${windowStart}`;
  const cached = rateLimitCache.get(cacheKey);
  
  if (!cached || cached.windowStart !== windowStart) {
    // Nova janela
    rateLimitCache.set(cacheKey, { count: 1, windowStart });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(windowStart + windowMs),
      exceeded: false,
    };
  }
  
  // Incrementa contador
  cached.count++;
  rateLimitCache.set(cacheKey, cached);
  
  const exceeded = cached.count > limit;
  
  return {
    allowed: !exceeded,
    remaining: Math.max(0, limit - cached.count),
    resetAt: new Date(windowStart + windowMs),
    exceeded,
  };
}

export async function trackLoginAttempt(params: {
  ip: string;
  email?: string;
  success: boolean;
  userAgent?: string;
}): Promise<void> {
  const { ip, email, success, userAgent } = params;
  
  try {
    await prisma.securityLoginAttempt.create({
      data: { ip, email, success, userAgent },
    });
  } catch (error) {
    console.error('[Security] Erro ao registrar tentativa de login:', error);
  }
}

export async function getFailedLoginCount(
  ip: string,
  windowMinutes: number
): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const count = await prisma.securityLoginAttempt.count({
    where: {
      ip,
      success: false,
      createdAt: { gte: since },
    },
  });
  
  return count;
}

export async function checkBruteForce(
  ip: string,
  settings: SecuritySettings
): Promise<{ detected: boolean; failedAttempts: number }> {
  const failedAttempts = await getFailedLoginCount(
    ip,
    settings.rate_limit_login_window_minutes
  );
  
  return {
    detected: failedAttempts >= settings.rate_limit_login_attempts,
    failedAttempts,
  };
}

// Persiste rate limit no banco para análise (assíncrono, não bloqueia)
export async function persistRateLimitStats(
  ip: string,
  endpoint: string
): Promise<void> {
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / 60000) * 60000);
  
  try {
    await prisma.securityRateLimit.upsert({
      where: {
        ip_endpoint_windowStart: { ip, endpoint, windowStart },
      },
      update: {
        requestCount: { increment: 1 },
      },
      create: {
        ip,
        endpoint,
        windowStart,
        requestCount: 1,
      },
    });
  } catch {
    // Ignora erros de persistência (não é crítico)
  }
}
