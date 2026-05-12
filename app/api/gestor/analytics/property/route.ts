import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getGA4PropertyId } from '@/lib/google-analytics-api';
import { getValidAccessToken } from '@/lib/google-search-console';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // First check if we have a valid Google token at all
    const token = await prisma.sEOGoogleToken.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      return NextResponse.json({
        propertyId: null,
        measurementId: null,
        configured: false,
        needsAuth: true,
        error: 'Não autenticado no Google. Conecte sua conta Google primeiro.',
      });
    }

    // Try to get a valid access token (handles refresh)
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return NextResponse.json({
        propertyId: null,
        measurementId: null,
        configured: false,
        needsAuth: true,
        error: 'Token expirado. Reconecte sua conta Google.',
      });
    }

    const propertyId = await getGA4PropertyId();
    const ga4Id = await prisma.siteConfig.findFirst({
      where: { key: 'analytics_ga4_id' },
    });

    return NextResponse.json({
      propertyId: propertyId || null,
      measurementId: ga4Id?.value || null,
      configured: !!propertyId,
    });
  } catch (error: any) {
    console.error('Erro ao buscar property:', error);
    const msg = error.message || 'Erro ao buscar property';
    return NextResponse.json(
      { 
        error: msg,
        needsAuth: msg.includes('autenticado') || msg.includes('Reconecte'),
        configured: false,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 });
    }

    const { propertyId } = await request.json();
    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId \u00e9 obrigat\u00f3rio' }, { status: 400 });
    }

    await prisma.siteConfig.upsert({
      where: { key: 'analytics_ga4_property_id' },
      update: { value: propertyId },
      create: { key: 'analytics_ga4_property_id', value: propertyId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
