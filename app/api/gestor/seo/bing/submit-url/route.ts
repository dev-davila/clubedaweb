import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { submitUrlToBing, submitUrlBatch } from '@/lib/bing-webmaster';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { siteUrl, url, urls } = await request.json();

    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl é obrigatório' }, { status: 400 });
    }

    if (urls && Array.isArray(urls)) {
      // Batch submission
      if (urls.length > 500) {
        return NextResponse.json(
          { error: 'Máximo de 500 URLs por lote' },
          { status: 400 }
        );
      }
      await submitUrlBatch(siteUrl, urls);
      return NextResponse.json({ success: true, message: `${urls.length} URLs submetidas com sucesso` });
    } else if (url) {
      // Single URL submission
      await submitUrlToBing(siteUrl, url);
      return NextResponse.json({ success: true, message: 'URL submetida com sucesso' });
    } else {
      return NextResponse.json(
        { error: 'url ou urls é obrigatório' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao submeter URL:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao submeter URL' },
      { status: 500 }
    );
  }
}
