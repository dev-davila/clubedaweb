export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateHeyGenVideo, generateDIDVideo } from '@/lib/video-services';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      service = 'heygen', 
      avatarId, 
      voiceId, 
      script, 
      postId,
      title,
      background,
      sourceUrl // Para D-ID com imagem customizada
    } = body;

    if (!script) {
      return NextResponse.json({ error: 'Script é obrigatório' }, { status: 400 });
    }

    if (!voiceId) {
      return NextResponse.json({ error: 'Voz é obrigatória' }, { status: 400 });
    }

    let result;

    if (service === 'heygen') {
      if (!avatarId) {
        return NextResponse.json({ error: 'Avatar é obrigatório para HeyGen' }, { status: 400 });
      }

      result = await generateHeyGenVideo({
        avatarId,
        voiceId,
        script,
        title,
        background
      });
    } else if (service === 'd-id') {
      result = await generateDIDVideo({
        presenterId: avatarId,
        sourceUrl,
        voiceId,
        script
      });
    } else {
      return NextResponse.json({ error: 'Serviço inválido' }, { status: 400 });
    }

    // Salvar referência do vídeo no post se fornecido
    if (postId && result.videoId) {
      // Podemos salvar o videoId em um campo temporário ou criar uma tabela de jobs
      // Por enquanto, vamos apenas retornar o ID
    }

    return NextResponse.json({
      success: true,
      service,
      videoId: result.videoId,
      message: 'Vídeo em processamento. Use o endpoint /api/gestor/video/status para verificar o progresso.'
    });
  } catch (error: any) {
    console.error('Erro ao gerar vídeo:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar vídeo' },
      { status: 500 }
    );
  }
}
