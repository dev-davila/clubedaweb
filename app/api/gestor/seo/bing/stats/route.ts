import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getCrawlStats, getQueryStats, getPageStats, getUrlSubmissionQuota, getKeywordStats, getUrlInfo, getUrlTrafficInfo, getSubmissionHistory } from '@/lib/bing-webmaster';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get('siteUrl');
    const type = searchParams.get('type') || 'crawl';

    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl é obrigatório' }, { status: 400 });
    }

    const query = searchParams.get('query') || '';
    const url = searchParams.get('url') || '';

    let data;
    switch (type) {
      case 'crawl':
        data = await getCrawlStats(siteUrl);
        break;
      case 'query':
        data = await getQueryStats(siteUrl);
        break;
      case 'page':
        data = await getPageStats(siteUrl);
        break;
      case 'quota':
        data = await getUrlSubmissionQuota(siteUrl);
        break;
      case 'keyword':
        if (!query) {
          return NextResponse.json({ error: 'Parâmetro query é obrigatório' }, { status: 400 });
        }
        data = await getKeywordStats(siteUrl, query);
        break;
      case 'urlinfo':
        data = await getUrlInfo(siteUrl, url || siteUrl);
        break;
      case 'urltraffic':
        data = await getUrlTrafficInfo(siteUrl, url || siteUrl);
        break;
      case 'history':
        data = await getSubmissionHistory();
        break;
      default:
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
