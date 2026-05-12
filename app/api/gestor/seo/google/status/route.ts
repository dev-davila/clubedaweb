import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getGoogleSearchConsoleCredentials } from '@/lib/seo-credentials';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const credentials = getGoogleSearchConsoleCredentials();
    const token = await prisma.sEOGoogleToken.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      configured: !!credentials,
      authenticated: !!token && token.expiresAt > new Date(),
      expiresAt: token?.expiresAt,
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Disconnect Google
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await prisma.sEOGoogleToken.deleteMany({});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
