import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSitemaps, submitSitemap, deleteSitemap } from '@/lib/google-search-console';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get('siteUrl');

    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl é obrigatório' }, { status: 400 });
    }

    const sitemaps = await getSitemaps(siteUrl);
    
    return NextResponse.json({ sitemaps });
  } catch (error: any) {
    console.error('Erro ao listar sitemaps:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar sitemaps' },
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

    const { siteUrl, sitemapUrl } = await request.json();

    if (!siteUrl || !sitemapUrl) {
      return NextResponse.json(
        { error: 'siteUrl e sitemapUrl são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate sitemap URL is accessible before submitting
    try {
      const checkResponse = await fetch(sitemapUrl, { method: 'HEAD', redirect: 'follow' });
      if (!checkResponse.ok) {
        return NextResponse.json(
          { error: `O sitemap não está acessível (HTTP ${checkResponse.status}). Verifique a URL: ${sitemapUrl}` },
          { status: 400 }
        );
      }
    } catch (fetchError: any) {
      console.warn('Não foi possível verificar o sitemap localmente:', fetchError.message);
      // Continue anyway - Google might still be able to access it
    }

    await submitSitemap(siteUrl, sitemapUrl);

    // Log submission
    await prisma.sEOSitemapSubmission.create({
      data: {
        sitemapUrl,
        engine: 'google',
        status: 'SUBMITTED',
      },
    });
    
    return NextResponse.json({ success: true, message: 'Sitemap submetido com sucesso ao Google Search Console' });
  } catch (error: any) {
    console.error('Erro ao submeter sitemap:', error);
    
    // Parse and provide helpful error message
    let errorMessage = error.message || 'Erro ao submeter sitemap';
    
    if (errorMessage.includes('Could not process sitemap')) {
      errorMessage = `O Google não conseguiu processar o sitemap. Possíveis causas: (1) A URL do sitemap não pertence à propriedade selecionada. (2) O sitemap não está acessível publicamente. (3) O formato do sitemap é inválido. Erro original: ${errorMessage}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get('siteUrl');
    const sitemapUrl = searchParams.get('sitemapUrl');

    if (!siteUrl || !sitemapUrl) {
      return NextResponse.json(
        { error: 'siteUrl e sitemapUrl são obrigatórios' },
        { status: 400 }
      );
    }

    await deleteSitemap(siteUrl, sitemapUrl);
    
    return NextResponse.json({ success: true, message: 'Sitemap removido com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover sitemap:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao remover sitemap' },
      { status: 500 }
    );
  }
}
