import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_ROBOTS_CONFIG = {
  mode: 'automatic' as const,
  allowAll: true,
  disallowPaths: ['/admin/', '/gestor/', '/api/', '/gestor/login'],
  customRules: '',
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const config = await prisma.siteConfig.findFirst({
      where: { key: 'robots_config' },
    });

    if (config?.value) {
      try {
        const parsed = JSON.parse(config.value);
        return NextResponse.json(parsed);
      } catch {
        // Invalid JSON, return default
      }
    }

    return NextResponse.json(DEFAULT_ROBOTS_CONFIG);
  } catch (error: any) {
    console.error('Erro ao buscar config robots:', error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { mode, allowAll, disallowPaths, customRules } = body;

    if (!mode || !['automatic', 'manual'].includes(mode)) {
      return NextResponse.json({ error: 'Modo inválido' }, { status: 400 });
    }

    const config = {
      mode,
      allowAll: mode === 'automatic' ? (allowAll !== false) : true,
      disallowPaths: mode === 'automatic' ? (Array.isArray(disallowPaths) ? disallowPaths : DEFAULT_ROBOTS_CONFIG.disallowPaths) : [],
      customRules: mode === 'manual' ? (customRules || '') : '',
    };

    await prisma.siteConfig.upsert({
      where: { key: 'robots_config' },
      update: { value: JSON.stringify(config) },
      create: { key: 'robots_config', value: JSON.stringify(config) },
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('Erro ao salvar config robots:', error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
