export const dynamic = "force-dynamic";
// API de Gerenciamento de Allowlist

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAllowlist, addToAllowlist, removeFromAllowlist } from '@/lib/security/block-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const result = await getAllowlist(page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Security API] Erro ao buscar allowlist:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar allowlist' },
      { status: 500 }
    );
  }
}

// Adicionar à allowlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { ip, reason, expiresAt } = await request.json();
    
    if (!ip) {
      return NextResponse.json({ error: 'IP obrigatório' }, { status: 400 });
    }
    
    await addToAllowlist({
      ip,
      reason: reason || 'Adicionado manualmente',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: session.user?.email || undefined,
    });
    
    return NextResponse.json({ success: true, message: `IP ${ip} adicionado à allowlist` });
  } catch (error) {
    console.error('[Security API] Erro ao adicionar à allowlist:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar à allowlist' },
      { status: 500 }
    );
  }
}

// Remover da allowlist
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
    
    await removeFromAllowlist(ip);
    
    return NextResponse.json({ success: true, message: `IP ${ip} removido da allowlist` });
  } catch (error) {
    console.error('[Security API] Erro ao remover da allowlist:', error);
    return NextResponse.json(
      { error: 'Erro ao remover da allowlist' },
      { status: 500 }
    );
  }
}
