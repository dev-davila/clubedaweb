// Serviço de Bloqueios e Allowlist

import { prisma } from '@/lib/db';

// Cache em memória para performance
const blockCache = new Map<string, { blocked: boolean; expiresAt: Date | null }>();
const allowlistCache = new Map<string, boolean>();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000; // 30 segundos

async function refreshCache(): Promise<void> {
  const now = Date.now();
  if (now - cacheTimestamp < CACHE_TTL_MS) return;
  
  try {
    // Carrega bloqueios ativos
    const blocks = await prisma.securityBlock.findMany({
      where: { active: true },
      select: { ip: true, expiresAt: true },
    });
    
    blockCache.clear();
    for (const block of blocks) {
      blockCache.set(block.ip, { blocked: true, expiresAt: block.expiresAt });
    }
    
    // Carrega allowlist
    const allowed = await prisma.securityAllowlist.findMany({
      where: { active: true },
      select: { ip: true, expiresAt: true },
    });
    
    allowlistCache.clear();
    for (const item of allowed) {
      // Verifica se não expirou
      if (!item.expiresAt || item.expiresAt > new Date()) {
        allowlistCache.set(item.ip, true);
      }
    }
    
    cacheTimestamp = now;
  } catch (error) {
    console.error('[Security] Erro ao atualizar cache:', error);
  }
}

export async function isIPAllowed(ip: string): Promise<boolean> {
  await refreshCache();
  return allowlistCache.has(ip);
}

export async function isIPBlocked(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  await refreshCache();
  
  const cached = blockCache.get(ip);
  if (!cached) return { blocked: false };
  
  // Verifica expiração
  if (cached.expiresAt && cached.expiresAt < new Date()) {
    // Bloqueio expirado
    blockCache.delete(ip);
    return { blocked: false };
  }
  
  return { blocked: true, reason: 'IP bloqueado' };
}

export async function blockIP(params: {
  ip: string;
  reason: string;
  eventType: string;
  durationMinutes?: number;
  createdBy?: string;
}): Promise<void> {
  const { ip, reason, eventType, durationMinutes, createdBy } = params;
  
  const expiresAt = durationMinutes 
    ? new Date(Date.now() + durationMinutes * 60 * 1000) 
    : null;
  
  // Verifica se já existe bloqueio para escalonar
  const existing = await prisma.securityBlock.findFirst({
    where: { ip, active: true },
  });
  
  if (existing) {
    // Incrementa contador e estende bloqueio
    await prisma.securityBlock.update({
      where: { id: existing.id },
      data: {
        hitCount: { increment: 1 },
        expiresAt: expiresAt || existing.expiresAt,
        reason,
      },
    });
  } else {
    await prisma.securityBlock.create({
      data: {
        ip,
        reason,
        eventType,
        expiresAt,
        createdBy,
        active: true,
      },
    });
  }
  
  // Atualiza cache
  blockCache.set(ip, { blocked: true, expiresAt });
}

export async function unblockIP(ip: string): Promise<void> {
  await prisma.securityBlock.updateMany({
    where: { ip, active: true },
    data: { active: false },
  });
  
  blockCache.delete(ip);
}

export async function addToAllowlist(params: {
  ip: string;
  reason: string;
  expiresAt?: Date;
  createdBy?: string;
}): Promise<void> {
  const { ip, reason, expiresAt, createdBy } = params;
  
  await prisma.securityAllowlist.upsert({
    where: { ip },
    update: { reason, expiresAt, active: true, createdBy },
    create: { ip, reason, expiresAt, active: true, createdBy },
  });
  
  allowlistCache.set(ip, true);
}

export async function removeFromAllowlist(ip: string): Promise<void> {
  await prisma.securityAllowlist.updateMany({
    where: { ip },
    data: { active: false },
  });
  
  allowlistCache.delete(ip);
}

export async function getBlockedIPs(page = 1, limit = 50) {
  const [blocks, total] = await Promise.all([
    prisma.securityBlock.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.securityBlock.count({ where: { active: true } }),
  ]);
  
  return { blocks, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAllowlist(page = 1, limit = 50) {
  const [items, total] = await Promise.all([
    prisma.securityAllowlist.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.securityAllowlist.count({ where: { active: true } }),
  ]);
  
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function invalidateBlockCache(): void {
  cacheTimestamp = 0;
}
