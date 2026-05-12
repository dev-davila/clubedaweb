// Inspetor de Requisições - Core do Módulo de Proteção

import { NextRequest } from 'next/server';
import { getSecuritySettings } from './config-service';
import { logSecurityEvent } from './event-service';
import { isIPAllowed, isIPBlocked } from './block-service';
import { checkRateLimit, persistRateLimitStats } from './rate-limit-service';
import { runAllDetections, validateUpload } from './detection-engine';
import { SecurityContext, SecurityAction, DetectionResult } from './types';

export interface InspectionResult {
  allowed: boolean;
  action: SecurityAction;
  reason?: string;
  eventType?: string;
  statusCode?: number;
}

function extractIP(request: NextRequest): string {
  // Tenta pegar IP real atrás de proxies
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  // Fallback
  return '127.0.0.1';
}

function buildContext(request: NextRequest, body?: Record<string, unknown>): SecurityContext {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  
  return {
    ip: extractIP(request),
    method: request.method,
    url: url.pathname + url.search,
    userAgent: request.headers.get('user-agent') || undefined,
    query,
    body,
  };
}

export async function inspectRequest(
  request: NextRequest,
  body?: Record<string, unknown>
): Promise<InspectionResult> {
  const settings = await getSecuritySettings();
  const context = buildContext(request, body);
  
  // 1. Verifica rotas excluídas
  for (const excluded of settings.excluded_routes) {
    if (context.url.startsWith(excluded)) {
      return { allowed: true, action: 'allowed' };
    }
  }
  
  // 2. Verifica allowlist
  if (await isIPAllowed(context.ip)) {
    return { allowed: true, action: 'allowed' };
  }
  
  // 3. Verifica bloqueio (FASE 1: apenas log)
  const blockStatus = await isIPBlocked(context.ip);
  if (blockStatus.blocked) {
    // Modo observação: apenas loga, não bloqueia
    if (settings.observation_mode) {
      await logSecurityEvent({
        context,
        eventType: 'suspicious_request',
        action: 'logged',
        reason: `IP bloqueado tentou acessar (modo observação): ${blockStatus.reason}`,
      });
      return { allowed: true, action: 'logged', reason: blockStatus.reason };
    }
    
    return {
      allowed: false,
      action: 'blocked_temp',
      reason: blockStatus.reason,
      statusCode: 403,
    };
  }
  
  // 4. Rate limiting
  if (settings.rule_rate_limit_enabled) {
    const rateLimitResult = checkRateLimit(context.ip, context.url, settings);
    
    if (rateLimitResult.exceeded) {
      // Modo observação: apenas loga
      if (settings.observation_mode) {
        await logSecurityEvent({
          context,
          eventType: 'rate_limit_exceeded',
          action: 'logged',
          reason: `Rate limit excedido (modo observação): ${rateLimitResult.remaining} restantes`,
        });
        return { allowed: true, action: 'logged', reason: 'Rate limit excedido' };
      }
      
      await logSecurityEvent({
        context,
        eventType: 'rate_limit_exceeded',
        action: 'rate_limited',
        reason: 'Rate limit excedido',
        statusCode: 429,
      });
      
      return {
        allowed: false,
        action: 'rate_limited',
        reason: 'Muitas requisições. Tente novamente em alguns segundos.',
        eventType: 'rate_limit_exceeded',
        statusCode: 429,
      };
    }
    
    // Persiste estatísticas (assíncrono)
    persistRateLimitStats(context.ip, context.url).catch(() => {});
  }
  
  // 5. Executa detecções
  const detections = runAllDetections(context, settings);
  
  if (detections.length > 0) {
    // Pega a detecção mais severa
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    detections.sort((a, b) => 
      (severityOrder[b.severity || 'low'] || 0) - (severityOrder[a.severity || 'low'] || 0)
    );
    
    const mostSevere = detections[0];
    
    // FASE 1: Modo observação - apenas loga, não bloqueia
    if (settings.observation_mode) {
      await logSecurityEvent({
        context,
        eventType: mostSevere.eventType!,
        action: 'logged',
        reason: `[OBSERVAÇÃO] ${mostSevere.reason}`,
        payload: mostSevere.payload,
      });
      
      // Loga detecções adicionais
      for (let i = 1; i < detections.length; i++) {
        await logSecurityEvent({
          context,
          eventType: detections[i].eventType!,
          action: 'logged',
          reason: `[OBSERVAÇÃO] ${detections[i].reason}`,
          payload: detections[i].payload,
        });
      }
      
      return {
        allowed: true,
        action: 'logged',
        reason: mostSevere.reason,
        eventType: mostSevere.eventType,
      };
    }
    
    // Modo proteção ativo (FASE 2+)
    await logSecurityEvent({
      context,
      eventType: mostSevere.eventType!,
      action: 'blocked_temp',
      reason: mostSevere.reason!,
      payload: mostSevere.payload,
      statusCode: 403,
    });
    
    return {
      allowed: false,
      action: 'blocked_temp',
      reason: mostSevere.reason,
      eventType: mostSevere.eventType,
      statusCode: 403,
    };
  }
  
  // 6. Tudo OK
  return { allowed: true, action: 'allowed' };
}

// Função para validar uploads
export async function inspectUpload(
  request: NextRequest,
  filename: string,
  mimeType: string
): Promise<InspectionResult> {
  const settings = await getSecuritySettings();
  const context = buildContext(request);
  
  if (!settings.rule_upload_validation_enabled) {
    return { allowed: true, action: 'allowed' };
  }
  
  const result = validateUpload(filename, mimeType, settings);
  
  if (result.detected) {
    // Modo observação: apenas loga
    if (settings.observation_mode) {
      await logSecurityEvent({
        context,
        eventType: result.eventType!,
        action: 'logged',
        reason: `[OBSERVAÇÃO] ${result.reason}`,
        payload: result.payload,
      });
      
      return {
        allowed: true,
        action: 'logged',
        reason: result.reason,
        eventType: result.eventType,
      };
    }
    
    await logSecurityEvent({
      context,
      eventType: result.eventType!,
      action: 'blocked_hard',
      reason: result.reason!,
      payload: result.payload,
      statusCode: 400,
    });
    
    return {
      allowed: false,
      action: 'blocked_hard',
      reason: result.reason,
      eventType: result.eventType,
      statusCode: 400,
    };
  }
  
  return { allowed: true, action: 'allowed' };
}
