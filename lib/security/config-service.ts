// Serviço de Configurações de Segurança

import { prisma } from '@/lib/db';
import { SecuritySettings, DEFAULT_SETTINGS } from './types';

// Cache em memória para evitar queries frequentes
let settingsCache: SecuritySettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minuto

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const now = Date.now();
  
  // Retorna cache se válido
  if (settingsCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return settingsCache;
  }
  
  try {
    const dbSettings = await prisma.securitySetting.findMany();
    
    // Mescla configurações do banco com defaults
    const settings: SecuritySettings = { ...DEFAULT_SETTINGS };
    
    for (const setting of dbSettings) {
      const key = setting.settingKey as keyof SecuritySettings;
      if (key in settings) {
        // Parse do valor conforme o tipo
        const defaultValue = DEFAULT_SETTINGS[key];
        if (typeof defaultValue === 'boolean') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (settings as any)[key] = setting.settingValue === 'true';
        } else if (typeof defaultValue === 'number') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (settings as any)[key] = parseInt(setting.settingValue, 10);
        } else if (Array.isArray(defaultValue)) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (settings as any)[key] = JSON.parse(setting.settingValue);
          } catch {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (settings as any)[key] = defaultValue;
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (settings as any)[key] = setting.settingValue;
        }
      }
    }
    
    settingsCache = settings;
    cacheTimestamp = now;
    
    return settings;
  } catch (error) {
    console.error('[Security] Erro ao carregar configurações:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSecuritySetting(
  key: keyof SecuritySettings,
  value: string | number | boolean | string[]
): Promise<void> {
  const stringValue = typeof value === 'object' 
    ? JSON.stringify(value) 
    : String(value);
  
  await prisma.securitySetting.upsert({
    where: { settingKey: key },
    update: { settingValue: stringValue },
    create: {
      settingKey: key,
      settingValue: stringValue,
      description: getSettingDescription(key),
    },
  });
  
  // Invalida cache
  settingsCache = null;
}

export async function initializeSecuritySettings(): Promise<void> {
  // Verifica se já existem configurações
  const count = await prisma.securitySetting.count();
  
  if (count === 0) {
    console.log('[Security] Inicializando configurações padrão...');
    
    // Insere todas as configurações padrão
    const entries = Object.entries(DEFAULT_SETTINGS) as [keyof SecuritySettings, unknown][];
    
    for (const [key, value] of entries) {
      await updateSecuritySetting(key, value as string | number | boolean | string[]);
    }
    
    console.log('[Security] Configurações inicializadas.');
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    rate_limit_requests_per_minute: 'Limite de requisições por minuto por IP',
    rate_limit_login_attempts: 'Tentativas de login permitidas',
    rate_limit_login_window_minutes: 'Janela de tempo para tentativas de login (minutos)',
    rate_limit_api_requests_per_minute: 'Limite de requisições para APIs por minuto',
    block_duration_minutes: 'Duração inicial do bloqueio temporário (minutos)',
    block_escalation_multiplier: 'Multiplicador de escalonamento do bloqueio',
    max_block_duration_hours: 'Duração máxima de bloqueio (horas)',
    rule_sql_injection_enabled: 'Detecção de SQL Injection ativa',
    rule_xss_enabled: 'Detecção de XSS ativa',
    rule_path_traversal_enabled: 'Detecção de Path Traversal ativa',
    rule_brute_force_enabled: 'Proteção contra brute force ativa',
    rule_bot_scan_enabled: 'Detecção de bots/scanners ativa',
    rule_rate_limit_enabled: 'Rate limiting ativo',
    rule_upload_validation_enabled: 'Validação de uploads ativa',
    observation_mode: 'Modo observação (apenas log, não bloqueia)',
    suspicious_routes: 'Lista de rotas suspeitas para detecção de bots',
    forbidden_extensions: 'Extensões de arquivo proibidas para upload',
    excluded_routes: 'Rotas excluídas da inspeção de segurança',
  };
  
  return descriptions[key] || key;
}

export function invalidateSettingsCache(): void {
  settingsCache = null;
}
