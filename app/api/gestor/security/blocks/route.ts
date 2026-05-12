export const dynamic = "force-dynamic";
// API de Gerenciamento de Bloqueios

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBlockedIPs, blockIP, unblockIP } from '@/lib/security/block-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const result = await getBlockedIPs(page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Security API] Erro ao buscar bloqueios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar bloqueios' },
      { status: 500 }
    );
  }
}

// Bloquear IP manualmente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { ip, reason, durationMinutes } = await request.json();
    
    if (!ip) {
      return NextResponse.json({ error: 'IP obrigatório' }, { status: 400 });
    }
    
    await blockIP({
      ip,
      reason: reason || 'Bloqueio manual',
      eventType: 'manual_block',
      durationMinutes,
      createdBy: session.user?.email || undefined,
    });
    
    return NextResponse.json({ success: true, message: `IP ${ip} bloqueado` });
  } catch (error) {
    console.error('[Security API] Erro ao bloquear IP:', error);
    return NextResponse.json(
      { error: 'Erro ao bloquear IP' },
      { status: 500 }
    );
  }
}

// Desbloquear IP
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { ip } = await request.json();
    
    if (!ip) {
      return NextResponse.json({ error: 'IP obrigatório' }, { status: 400 });
    }
    
    await unblockIP(ip);
    
    return NextResponse.json({ success: true, message: `IP ${ip} desbloqueado` });
  } catch (error) {
    console.error('[Security API] Erro ao desbloquear IP:', error);
    return NextResponse.json(
      { error: 'Erro ao desbloquear IP' },
      { status: 500 }
    );
  }
}
