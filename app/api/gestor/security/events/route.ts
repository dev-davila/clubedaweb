export const dynamic = "force-dynamic";
// API de Eventos de Segurança

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSecurityEvents } from '@/lib/security/event-service';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    
    const filters = {
      startDate: searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!) 
        : undefined,
      endDate: searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate')!) 
        : undefined,
      ip: searchParams.get('ip') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      action: searchParams.get('action') || undefined,
      url: searchParams.get('url') || undefined,
      userId: searchParams.get('userId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };
    
    const result = await getSecurityEvents(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Security API] Erro ao buscar eventos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar eventos' },
      { status: 500 }
    );
  }
}

// Buscar evento específico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ error: 'ID do evento obrigatório' }, { status: 400 });
    }
    
    const event = await prisma.securityEvent.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('[Security API] Erro ao buscar evento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar evento' },
      { status: 500 }
    );
  }
}
