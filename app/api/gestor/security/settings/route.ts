export const dynamic = "force-dynamic";
// API de Configurações de Segurança

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSecuritySettings, updateSecuritySetting, initializeSecuritySettings } from '@/lib/security/config-service';
import { SecuritySettings } from '@/lib/security/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Inicializa configurações se necessário
    await initializeSecuritySettings();
    
    const settings = await getSecuritySettings();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[Security API] Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const updates = await request.json() as Partial<SecuritySettings>;
    
    // Atualiza cada configuração
    for (const [key, value] of Object.entries(updates)) {
      await updateSecuritySetting(
        key as keyof SecuritySettings,
        value as string | number | boolean | string[]
      );
    }
    
    const settings = await getSecuritySettings();
    
    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas',
      settings,
    });
  } catch (error) {
    console.error('[Security API] Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}
