import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { submitUrlsIndexNow } from '@/lib/bing-webmaster';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Get recent IndexNow submissions
    const logs = await prisma.sEOIndexNowLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Erro ao listar logs:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar logs' },
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

    const { host, urls, keyLocation } = await request.json();

    if (!host || !urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'host e urls (array) são obrigatórios' },
        { status: 400 }
      );
    }

    if (urls.length > 10000) {
      return NextResponse.json(
        { error: 'Máximo de 10.000 URLs por requisição' },
        { status: 400 }
      );
    }

    const result = await submitUrlsIndexNow(host, urls, keyLocation);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao submeter URLs:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao submeter URLs via IndexNow' },
      { status: 500 }
    );
  }
}
