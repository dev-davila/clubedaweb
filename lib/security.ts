import { NextRequest } from 'next/server';
import { prisma } from './db';

/**
 * Obter IP do cliente
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || real || 'unknown';
}

/**
 * Verificar se IP está na blocklist
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  if (ip === 'unknown') return false;

  const blocked = await prisma.securityBlock.findFirst({
    where: {
      ip,
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  return !!blocked;
}

/**
 * Verificar se IP está na allowlist
 */
export async function isIPAllowed(ip: string): Promise<boolean> {
  if (ip === 'unknown') return true;

  const allowed = await prisma.securityAllowlist.findFirst({
    where: {
      ip,
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  return !!allowed;
}

/**
 * Rate limiting simples em memória (escalável para Redis)
 * Para produção, usar Redis!
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60 * 1000 // 1 minuto
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Rate limiting por IP (login attempts)
 */
export async function checkLoginAttempt(
  ip: string,
  email: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const windowStart = new Date(Date.now() - windowMs);

  const attempts = await prisma.securityLoginAttempt.count({
    where: {
      ip,
      email,
      createdAt: { gte: windowStart },
      success: false,
    },
  });

  return {
    allowed: attempts < maxAttempts,
    remainingAttempts: Math.max(0, maxAttempts - attempts),
  };
}

/**
 * Log de evento de segurança
 */
export async function logSecurityEvent(
  ip: string,
  eventType: string,
  action: string,
  reason: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.securityEvent.create({
      data: {
        ip,
        eventType,
        action,
        reason,
        userId,
        userAgent: metadata?.userAgent,
        method: metadata?.method,
        url: metadata?.url,
        payloadExcerpt: metadata?.payloadExcerpt,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar evento de segurança:', error);
  }
}

/**
 * Bloquear IP automaticamente após tentativas falhas
 */
export async function autoBlockIP(
  ip: string,
  reason: string,
  durationMinutes: number = 60
) {
  try {
    // Verificar se já existe um bloqueio
    const existing = await prisma.securityBlock.findFirst({
      where: { ip, active: true },
    });

    if (existing) {
      // Atualizar contador e data de expiração
      await prisma.securityBlock.update({
        where: { id: existing.id },
        data: {
          hitCount: existing.hitCount + 1,
          expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
        },
      });
    } else {
      // Criar novo bloqueio
      await prisma.securityBlock.create({
        data: {
          ip,
          reason,
          eventType: 'auto-block',
          expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
        },
      });
    }
  } catch (error) {
    console.error('Erro ao bloquear IP:', error);
  }
}

/**
 * Monitoramento de risco por IP (detecção anômala)
 */
export async function assessIPRisk(
  ip: string,
  timeWindowMinutes: number = 60
): Promise<number> {
  const windowStart = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  // Contar tentativas de login falhadas
  const failedLogins = await prisma.securityLoginAttempt.count({
    where: {
      ip,
      success: false,
      createdAt: { gte: windowStart },
    },
  });

  // Contar eventos suspeitos
  const suspiciousEvents = await prisma.securityEvent.count({
    where: {
      ip,
      action: 'blocked',
      createdAt: { gte: windowStart },
    },
  });

  // Score de risco (0-100)
  let riskScore = 0;

  if (failedLogins > 10) riskScore += 50;
  else if (failedLogins > 5) riskScore += 30;
  else if (failedLogins > 0) riskScore += 10;

  if (suspiciousEvents > 5) riskScore += 50;
  else if (suspiciousEvents > 0) riskScore += 20;

  return Math.min(100, riskScore);
}
