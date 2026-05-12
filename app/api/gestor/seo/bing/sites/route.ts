import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSites } from '@/lib/bing-webmaster';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const sites = await getSites();
    
    return NextResponse.json({ sites });
  } catch (error: any) {
    console.error('Erro ao listar sites:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar sites' },
      { status: 500 }
    );
  }
}
