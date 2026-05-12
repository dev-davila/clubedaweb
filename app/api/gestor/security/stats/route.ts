export const dynamic = "force-dynamic";
// API de Estatísticas de Segurança

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSecurityStats } from '@/lib/security/event-service';
import { getSecuritySettings } from '@/lib/security/config-service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Execução sequencial para evitar "Too many database connections"
    const stats = await getSecurityStats();
    const settings = await getSecuritySettings();
    
    return NextResponse.json({
      ...stats,
      observationMode: settings.observation_mode,
    });
  } catch (error) {
    console.error('[Security API] Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
