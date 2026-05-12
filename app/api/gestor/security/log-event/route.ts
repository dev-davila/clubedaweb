export const dynamic = "force-dynamic";
// API para logging de eventos de segurança (usado pelo middleware)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip, url, eventType, action, userAgent, method = 'GET', reason } = body;
    
    if (!ip || !url || !eventType || !action) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }
    
    // Registra o evento no banco de dados
    await prisma.securityEvent.create({
      data: {
        ip,
        url,
        eventType,
        action,
        userAgent,
        method,
        reason: reason || `Middleware: ${eventType}`,
        payloadExcerpt: `Middleware: ${eventType}`,
      },
    });
    
    // Se for bloqueio, atualiza ou cria registro de bloqueio temporário
    if (action === 'blocked') {
      const existingBlock = await prisma.securityBlock.findFirst({
        where: { ip, active: true },
      });
      
      if (existingBlock) {
        // Incrementa contador de hits
        await prisma.securityBlock.update({
          where: { id: existingBlock.id },
          data: { hitCount: { increment: 1 } },
        });
      } else {
        // Cria novo bloqueio temporário (15 minutos)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        await prisma.securityBlock.create({
          data: {
            ip,
            reason: `Bloqueado por ${eventType}`,
            eventType,
            expiresAt,
            active: true,
            hitCount: 1,
          },
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Security Log] Erro ao registrar evento:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar evento' },
      { status: 500 }
    );
  }
}
