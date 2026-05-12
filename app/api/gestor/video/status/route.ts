export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getHeyGenVideoStatus, getDIDVideoStatus } from '@/lib/video-services';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') || 'heygen';
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId é obrigatório' }, { status: 400 });
    }

    let result;

    if (service === 'heygen') {
      const status = await getHeyGenVideoStatus(videoId);
      result = {
        service: 'heygen',
        videoId,
        status: status.status,
        videoUrl: status.videoUrl,
        error: status.error,
        isComplete: status.status === 'completed',
        isFailed: status.status === 'failed'
      };
    } else if (service === 'd-id') {
      const status = await getDIDVideoStatus(videoId);
      result = {
        service: 'd-id',
        videoId,
        status: status.status,
        videoUrl: status.videoUrl,
        error: status.error,
        isComplete: status.status === 'done',
        isFailed: status.status === 'error'
      };
    } else {
      return NextResponse.json({ error: 'Serviço inválido' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar status' },
      { status: 500 }
    );
  }
}
