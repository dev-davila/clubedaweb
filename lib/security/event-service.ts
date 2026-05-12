// Serviço de Registro de Eventos de Segurança

import { prisma } from '@/lib/db';
import { SecurityEventType, SecurityAction, SecurityContext } from './types';

// Máscara para dados sensíveis
const SENSITIVE_FIELDS = ['password', 'senha', 'token', 'secret', 'key', 'credit_card', 'cpf', 'cnpj'];

function maskSensitiveData(data: unknown): string {
  if (!data) return '';
  
  let str = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Limita tamanho
  if (str.length > 500) {
    str = str.substring(0, 500) + '...[truncated]';
  }
  
  // Mascara campos sensíveis
  for (const field of SENSITIVE_FIELDS) {
    const regex = new RegExp(`("${field}"\\s*:\\s*")([^"]+)(")`, 'gi');
    str = str.replace(regex, '$1[MASKED]$3');
    
    // Para query strings
    const queryRegex = new RegExp(`(${field}=)([^&]+)`, 'gi');
    str = str.replace(queryRegex, '$1[MASKED]');
  }
  
  return str;
}

export interface LogEventParams {
  context: SecurityContext;
  eventType: SecurityEventType;
  action: SecurityAction;
  reason: string;
  payload?: unknown;
  statusCode?: number;
}

export async function logSecurityEvent(params: LogEventParams): Promise<string> {
  const { context, eventType, action, reason, payload, statusCode } = params;
  
  try {
    const event = await prisma.securityEvent.create({
      data: {
        ip: context.ip,
        userId: context.userId,
        sessionId: context.sessionId,
        eventType,
        action,
        reason,
        method: context.method,
        url: context.url,
        userAgent: context.userAgent,
        payloadExcerpt: payload ? maskSensitiveData(payload) : null,
        statusCode,
      },
    });
    
    // Log no console para debugging
    const icon = action === 'blocked_temp' || action === 'blocked_hard' ? '🚫' : 
                 action === 'rate_limited' ? '⏳' : '📝';
    console.log(`[Security] ${icon} ${eventType} | IP: ${context.ip} | ${context.method} ${context.url} | Action: ${action}`);
    
    return event.id;
  } catch (error) {
    console.error('[Security] Erro ao registrar evento:', error);
    return '';
  }
}

export async function getSecurityStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  
  // Execução sequencial para evitar "Too many database connections"
  
  // Total de eventos hoje
  const eventsToday = await prisma.securityEvent.count({
    where: { createdAt: { gte: todayStart } },
  });
  
  // Bloqueados hoje
  const blockedToday = await prisma.securityEvent.count({
    where: {
      createdAt: { gte: todayStart },
      action: { in: ['blocked_temp', 'blocked_hard', 'rate_limited'] },
    },
  });
  
  // Bloqueados na semana
  const blockedWeek = await prisma.securityEvent.count({
    where: {
      createdAt: { gte: weekStart },
      action: { in: ['blocked_temp', 'blocked_hard', 'rate_limited'] },
    },
  });
  
  // Top 5 IPs suspeitos
  const topIPs = await prisma.securityEvent.groupBy({
    by: ['ip'],
    _count: { ip: true },
    where: { createdAt: { gte: weekStart } },
    orderBy: { _count: { ip: 'desc' } },
    take: 5,
  });
  
  // Top 5 tipos de evento
  const topTypes = await prisma.securityEvent.groupBy({
    by: ['eventType'],
    _count: { eventType: true },
    where: { createdAt: { gte: weekStart } },
    orderBy: { _count: { eventType: 'desc' } },
    take: 5,
  });
  
  // Bloqueios ativos
  const activeBlocks = await prisma.securityBlock.count({
    where: {
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
  });
  
  // Tentativas de login bloqueadas
  const loginBlocks = await prisma.securityEvent.count({
    where: {
      createdAt: { gte: weekStart },
      eventType: 'brute_force_attempt',
    },
  });
  
  // Uploads bloqueados
  const uploadBlocks = await prisma.securityEvent.count({
    where: {
      createdAt: { gte: weekStart },
      eventType: 'malicious_upload_attempt',
    },
  });
  
  return {
    eventsToday,
    blockedToday,
    blockedWeek,
    topIPs: topIPs.map(item => ({ ip: item.ip, count: item._count.ip })),
    topTypes: topTypes.map(item => ({ type: item.eventType, count: item._count.eventType })),
    activeBlocks,
    loginBlocks,
    uploadBlocks,
  };
}

export async function getSecurityEvents(filters: {
  startDate?: Date;
  endDate?: Date;
  ip?: string;
  eventType?: string;
  action?: string;
  url?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  const { startDate, endDate, ip, eventType, action, url, userId, page = 1, limit = 50 } = filters;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }
  
  if (ip) where.ip = { contains: ip };
  if (eventType) where.eventType = eventType;
  if (action) where.action = action;
  if (url) where.url = { contains: url };
  if (userId) where.userId = userId;
  
  // Execução sequencial para evitar "Too many database connections"
  const events = await prisma.securityEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  
  const total = await prisma.securityEvent.count({ where });
  
  return {
    events,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
