import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPerformanceData } from '@/lib/google-search-console';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { siteUrl, startDate, endDate, dimensions, rowLimit } = body;

    if (!siteUrl || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'siteUrl, startDate e endDate são obrigatórios' },
        { status: 400 }
      );
    }

    const data = await getPerformanceData({
      siteUrl,
      startDate,
      endDate,
      dimensions: dimensions || ['query'],
      rowLimit: rowLimit || 100,
    });
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao buscar performance:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dados de performance' },
      { status: 500 }
    );
  }
}
