// Serviços de geração de vídeo com IA

function getApiKey(service: 'heygen' | 'd-id'): string {
  if (service === 'heygen') {
    return process.env.HEYGEN_API_KEY || '';
  } else if (service === 'd-id') {
    return process.env.DID_API_KEY || '';
  }
  return '';
}

// ========================================
// HEYGEN API
// ========================================

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
}

export interface HeyGenVoice {
  voice_id: string;
  name: string;
  language: string;
  gender: string;
  preview_audio?: string;
}

export async function listHeyGenAvatars(): Promise<HeyGenAvatar[]> {
  const apiKey = getApiKey('heygen');
  if (!apiKey) throw new Error('HeyGen API key não configurada');

  const response = await fetch('https://api.heygen.com/v2/avatars', {
    headers: { 'X-Api-Key': apiKey }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen API error: ${error}`);
  }

  const data = await response.json();
  return data.data?.avatars || [];
}

export async function listHeyGenVoices(): Promise<HeyGenVoice[]> {
  const apiKey = getApiKey('heygen');
  if (!apiKey) throw new Error('HeyGen API key não configurada');

  const response = await fetch('https://api.heygen.com/v2/voices', {
    headers: { 'X-Api-Key': apiKey }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen API error: ${error}`);
  }

  const data = await response.json();
  return data.data?.voices || [];
}

export interface HeyGenVideoRequest {
  avatarId: string;
  voiceId: string;
  script: string;
  title?: string;
  background?: string; // cor hex ou url de imagem
}

export async function generateHeyGenVideo(request: HeyGenVideoRequest): Promise<{ videoId: string }> {
  const apiKey = getApiKey('heygen');
  if (!apiKey) throw new Error('HeyGen API key não configurada');

  const payload = {
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: request.avatarId,
          avatar_style: 'normal'
        },
        voice: {
          type: 'text',
          input_text: request.script,
          voice_id: request.voiceId
        },
        background: request.background?.startsWith('#')
          ? { type: 'color', value: request.background }
          : request.background
            ? { type: 'image', url: request.background }
            : { type: 'color', value: '#ffffff' }
      }
    ],
    dimension: { width: 1280, height: 720 },
    title: request.title || 'Video gerado por IA'
  };

  const response = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen API error: ${error}`);
  }

  const data = await response.json();
  return { videoId: data.data?.video_id };
}

export async function getHeyGenVideoStatus(videoId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}> {
  const apiKey = getApiKey('heygen');
  if (!apiKey) throw new Error('HeyGen API key não configurada');

  const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { 'X-Api-Key': apiKey }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen API error: ${error}`);
  }

  const data = await response.json();
  return {
    status: data.data?.status || 'pending',
    videoUrl: data.data?.video_url,
    error: data.data?.error
  };
}

// ========================================
// D-ID API
// ========================================

export interface DIDPresenter {
  id: string;
  name: string;
  gender: string;
  thumbnail_url: string;
  preview_url?: string;
}

export interface DIDVoice {
  id: string;
  name: string;
  language: string;
  gender: string;
  access: string;
}

// D-ID não possui API de lista de apresentadores - usa imagens personalizadas
// Retornamos uma lista de apresentadores pré-definidos com imagens de exemplo
export async function listDIDPresenters(): Promise<DIDPresenter[]> {
  const apiKey = getApiKey('d-id');
  if (!apiKey) throw new Error('D-ID API key não configurada');

  // Verificar se a API key é válida testando endpoint de créditos
  try {
    const response = await fetch('https://api.d-id.com/credits', {
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('D-ID API key inválida');
    }
  } catch (error) {
    throw new Error('Não foi possível validar a API key do D-ID');
  }

  // Retornar lista de apresentadores com imagens de domínio público/uso livre
  return [
    {
      id: 'presenter_woman_1',
      name: 'Ana - Profissional',
      gender: 'female',
      thumbnail_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
      preview_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face'
    },
    {
      id: 'presenter_man_1',
      name: 'Carlos - Executivo',
      gender: 'male',
      thumbnail_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      preview_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
    },
    {
      id: 'presenter_woman_2',
      name: 'Maria - Consultora',
      gender: 'female',
      thumbnail_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
      preview_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face'
    },
    {
      id: 'presenter_man_2',
      name: 'Ricardo - Especialista TI',
      gender: 'male',
      thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      preview_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    },
    {
      id: 'presenter_woman_3',
      name: 'Julia - Gerente',
      gender: 'female',
      thumbnail_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&h=200&fit=crop&crop=face',
      preview_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&crop=face'
    },
    {
      id: 'presenter_man_3',
      name: 'Fernando - Diretor',
      gender: 'male',
      thumbnail_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
      preview_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face'
    }
  ];
}

export async function listDIDVoices(): Promise<DIDVoice[]> {
  const apiKey = getApiKey('d-id');
  if (!apiKey) throw new Error('D-ID API key não configurada');

  const response = await fetch('https://api.d-id.com/tts/voices', {
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${error}`);
  }

  const data = await response.json();
  
  // A API retorna um array diretamente, não um objeto com propriedade voices
  const voices = Array.isArray(data) ? data : (data.voices || []);
  
  // Mapear para o formato esperado e extrair informação de idioma
  return voices.map((v: any) => {
    // Encontrar idioma português se disponível
    const ptLanguage = v.languages?.find((l: any) => 
      l.language?.toLowerCase().includes('portuguese') || 
      l.locale?.toLowerCase().includes('pt')
    );
    
    return {
      id: v.id,
      name: v.name,
      language: ptLanguage?.language || v.languages?.[0]?.language || 'Multi',
      gender: v.gender || 'unknown',
      access: v.access || 'public'
    };
  });
}

export interface DIDVideoRequest {
  presenterId?: string; // ID do presenter ou URL de imagem
  sourceUrl?: string; // URL de imagem para usar como presenter
  voiceId: string;
  script: string;
  language?: string;
}

// Mapeamento de IDs de apresentadores para URLs de imagens
const DID_PRESENTER_IMAGES: Record<string, string> = {
  'presenter_woman_1': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=512&h=512&fit=crop&crop=face',
  'presenter_man_1': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=512&h=512&fit=crop&crop=face',
  'presenter_woman_2': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=512&h=512&fit=crop&crop=face',
  'presenter_man_2': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop&crop=face',
  'presenter_woman_3': 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=512&h=512&fit=crop&crop=face',
  'presenter_man_3': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=512&h=512&fit=crop&crop=face',
};

export async function generateDIDVideo(request: DIDVideoRequest): Promise<{ videoId: string }> {
  const apiKey = getApiKey('d-id');
  if (!apiKey) throw new Error('D-ID API key não configurada');

  // D-ID usa "talks" endpoint para gerar vídeos
  const payload: any = {
    script: {
      type: 'text',
      input: request.script,
      provider: {
        type: 'microsoft',
        voice_id: request.voiceId
      }
    },
    config: {
      fluent: true,
      pad_audio: 0
    }
  };

  // Determinar a URL da imagem do apresentador
  if (request.sourceUrl) {
    payload.source_url = request.sourceUrl;
  } else if (request.presenterId) {
    // Verificar se é um dos nossos apresentadores pré-definidos
    const presenterImage = DID_PRESENTER_IMAGES[request.presenterId];
    if (presenterImage) {
      payload.source_url = presenterImage;
    } else {
      // Se não for um ID conhecido, usar como URL direta (fallback)
      payload.source_url = request.presenterId;
    }
  } else {
    // Usar imagem padrão se nenhum for fornecido
    payload.source_url = DID_PRESENTER_IMAGES['presenter_woman_1'];
  }

  const response = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${error}`);
  }

  const data = await response.json();
  return { videoId: data.id };
}

export async function getDIDVideoStatus(videoId: string): Promise<{
  status: 'created' | 'started' | 'done' | 'error';
  videoUrl?: string;
  error?: string;
}> {
  const apiKey = getApiKey('d-id');
  if (!apiKey) throw new Error('D-ID API key não configurada');

  const response = await fetch(`https://api.d-id.com/talks/${videoId}`, {
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${error}`);
  }

  const data = await response.json();
  return {
    status: data.status || 'created',
    videoUrl: data.result_url,
    error: data.error?.description
  };
}
