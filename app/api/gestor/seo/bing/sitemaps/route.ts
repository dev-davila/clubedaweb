import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSitemapStatus, submitSitemap } from '@/lib/bing-webmaster';

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

    const sitemaps = await getSitemapStatus(siteUrl);
    
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

    const result = await submitSitemap(siteUrl, sitemapUrl);
    
    const methodInfo = result.method === 'SubmitFeed' 
      ? '(sitemap enviado ao Bing para crawl completo)' 
      : `(via SubmitUrlBatch${(result as any).skipped ? `, ${(result as any).skipped} URLs ignoradas por cota` : ''})`;
    
    return NextResponse.json({ 
      success: true, 
      message: `Sitemap processado: ${result.urlCount} URLs ${methodInfo}`,
      urlCount: result.urlCount,
      method: result.method,
    });
  } catch (error: any) {
    console.error('Erro ao submeter sitemap:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao submeter sitemap' },
      { status: 500 }
    );
  }
}
