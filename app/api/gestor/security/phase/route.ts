export const dynamic = "force-dynamic";
// API para controle de fases de segurança

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSecuritySettings, updateSecuritySetting, initializeSecuritySettings } from '@/lib/security/config-service';

// GET - Retorna status da fase atual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    await initializeSecuritySettings();
    const settings = await getSecuritySettings();
    
    // Determina a fase atual baseado nas configurações
    let currentPhase = 1;
    
    if (!settings.observation_mode) {
      // Modo proteção ativo
      if (settings.rule_sql_injection_enabled && settings.rule_xss_enabled) {
        currentPhase = 3; // Proteção avançada
      } else if (settings.rule_rate_limit_enabled || settings.rule_brute_force_enabled || settings.rule_bot_scan_enabled) {
        currentPhase = 2; // Proteção básica
      }
    }
    
    return NextResponse.json({
      currentPhase,
      observation_mode: settings.observation_mode,
      rules: {
        rate_limit: settings.rule_rate_limit_enabled,
        brute_force: settings.rule_brute_force_enabled,
        bot_scan: settings.rule_bot_scan_enabled,
        sql_injection: settings.rule_sql_injection_enabled,
        xss: settings.rule_xss_enabled,
        path_traversal: settings.rule_path_traversal_enabled,
        upload_validation: settings.rule_upload_validation_enabled,
      },
      phases: {
        1: { name: 'Monitoramento', description: 'Apenas log, sem bloqueios', active: currentPhase === 1 },
        2: { name: 'Proteção Básica', description: 'Rate limit + Brute force + Bots', active: currentPhase === 2 },
        3: { name: 'Proteção Avançada', description: 'SQLi + XSS + Uploads', active: currentPhase === 3 },
      },
    });
  } catch (error) {
    console.error('[Security Phase API] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Ativa uma fase específica
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { phase } = await request.json();
    
    if (![1, 2, 3].includes(phase)) {
      return NextResponse.json(
        { error: 'Fase inválida. Use 1, 2 ou 3.' },
        { status: 400 }
      );
    }
    
    await initializeSecuritySettings();
    
    switch (phase) {
      case 1:
        // Fase 1: Apenas monitoramento
        await updateSecuritySetting('observation_mode', true);
        console.log('[Security] Fase 1 ativada: Modo observação');
        break;
        
      case 2:
        // Fase 2: Proteção básica
        await updateSecuritySetting('observation_mode', false);
        await updateSecuritySetting('rule_rate_limit_enabled', true);
        await updateSecuritySetting('rule_brute_force_enabled', true);
        await updateSecuritySetting('rule_bot_scan_enabled', true);
        // Mantém SQLi/XSS desativados na Fase 2 para evitar falsos positivos
        await updateSecuritySetting('rule_sql_injection_enabled', false);
        await updateSecuritySetting('rule_xss_enabled', false);
        console.log('[Security] Fase 2 ativada: Proteção básica');
        break;
        
      case 3:
        // Fase 3: Proteção completa
        await updateSecuritySetting('observation_mode', false);
        await updateSecuritySetting('rule_rate_limit_enabled', true);
        await updateSecuritySetting('rule_brute_force_enabled', true);
        await updateSecuritySetting('rule_bot_scan_enabled', true);
        await updateSecuritySetting('rule_sql_injection_enabled', true);
        await updateSecuritySetting('rule_xss_enabled', true);
        await updateSecuritySetting('rule_path_traversal_enabled', true);
        await updateSecuritySetting('rule_upload_validation_enabled', true);
        console.log('[Security] Fase 3 ativada: Proteção completa');
        break;
    }
    
    const settings = await getSecuritySettings();
    
    return NextResponse.json({
      success: true,
      message: `Fase ${phase} ativada com sucesso`,
      phase,
      settings,
    });
  } catch (error) {
    console.error('[Security Phase API] Erro ao ativar fase:', error);
    return NextResponse.json(
      { error: 'Erro ao ativar fase' },
      { status: 500 }
    );
  }
}
