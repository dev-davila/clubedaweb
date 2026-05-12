import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { listProperties } from '@/lib/google-search-console';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const properties = await listProperties();
    
    // Get saved default property
    const defaultConfig = await prisma.siteConfig.findUnique({
      where: { key: 'seo_google_default_property' },
    });
    
    return NextResponse.json({ 
      properties,
      defaultProperty: defaultConfig?.value || null,
    });
  } catch (error: any) {
    console.error('Erro ao listar propriedades:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar propriedades' },
      { status: 500 }
    );
  }
}
