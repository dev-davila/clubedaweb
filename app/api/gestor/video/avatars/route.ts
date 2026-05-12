export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { listHeyGenAvatars, listHeyGenVoices, listDIDPresenters, listDIDVoices } from '@/lib/video-services';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') || 'heygen';

    if (service === 'heygen') {
      // Execução sequencial para evitar "Too many database connections"
      const avatars = await listHeyGenAvatars();
      const voices = await listHeyGenVoices();

      // Filtrar vozes em português
      const ptVoices = voices.filter(v => 
        v.language?.toLowerCase().includes('portuguese') ||
        v.language?.toLowerCase().includes('pt-')
      );

      return NextResponse.json({
        service: 'heygen',
        avatars: avatars.slice(0, 20).map(a => ({
          id: a.avatar_id,
          name: a.avatar_name,
          gender: a.gender,
          thumbnail: a.preview_image_url,
          preview: a.preview_video_url
        })),
        voices: ptVoices.length > 0 ? ptVoices.map(v => ({
          id: v.voice_id,
          name: v.name,
          language: v.language,
          gender: v.gender
        })) : voices.slice(0, 20).map(v => ({
          id: v.voice_id,
          name: v.name,
          language: v.language,
          gender: v.gender
        }))
      });
    } else if (service === 'd-id') {
      // Execução sequencial para evitar "Too many database connections"
      const presenters = await listDIDPresenters();
      const voices = await listDIDVoices();

      // Filtrar vozes em português (o language já vem formatado da função listDIDVoices)
      const ptVoices = voices.filter(v => 
        v.language?.toLowerCase().includes('portuguese') ||
        v.language?.toLowerCase().includes('pt')
      );

      // Usar vozes em português se disponíveis, senão usar todas
      const selectedVoices = ptVoices.length > 0 ? ptVoices : voices;

      return NextResponse.json({
        service: 'd-id',
        avatars: presenters.map(p => ({
          id: p.id,
          name: p.name,
          gender: p.gender,
          thumbnail: p.thumbnail_url,
          preview: p.preview_url
        })),
        voices: selectedVoices.slice(0, 20).map(v => ({
          id: v.id,
          name: v.name,
          language: v.language,
          gender: v.gender
        }))
      });
    }

    return NextResponse.json({ error: 'Serviço inválido' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao listar avatares:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar avatares' },
      { status: 500 }
    );
  }
}
