export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Ler API keys
function getOpenAIKey(): string {
  return process.env.OPENAI_API_KEY || '';
}

function getStabilityKey(): string {
  return process.env.STABILITY_API_KEY || '';
}

function getDIDKey(): string {
  return process.env.DID_API_KEY || '';
}

function getHeyGenKey(): string {
  return process.env.HEYGEN_API_KEY || '';
}

function getLeonardoKey(): string {
  return process.env.LEONARDO_API_KEY || '';
}

// Estilos de geração disponíveis
const GENERATION_STYLES: Record<string, { prompt: string; negativePrompt?: string }> = {
  'realista': {
    prompt: 'photorealistic portrait, professional photography, studio lighting, sharp focus, high detail, 8k uhd',
    negativePrompt: 'cartoon, anime, illustration, painting, drawing, art, artificial, fake'
  },
  'profissional': {
    prompt: 'professional corporate headshot, business portrait, clean background, studio lighting, confident expression',
    negativePrompt: 'casual, cartoon, unprofessional, messy'
  },
  'artistico': {
    prompt: 'artistic portrait, digital art style, vibrant colors, creative lighting, modern art aesthetic',
    negativePrompt: 'photorealistic, plain, boring'
  },
  'moderno': {
    prompt: 'modern professional portrait, contemporary style, clean minimalist background, soft lighting',
    negativePrompt: 'old-fashioned, vintage, cluttered'
  },
  'executivo': {
    prompt: 'executive business portrait, formal corporate setting, power pose, luxury office background',
    negativePrompt: 'casual, informal, messy'
  },
  'tecnologia': {
    prompt: 'tech professional portrait, modern office with screens, blue lighting accents, futuristic vibe',
    negativePrompt: 'old-fashioned, rustic, non-tech'
  },
  'cartoon': {
    prompt: 'cartoon style portrait, pixar style, 3d animated character, colorful, friendly expression, clean lines, professional look',
    negativePrompt: 'photorealistic, photo, realistic, ugly, deformed'
  },
  'anime': {
    prompt: 'anime style portrait, japanese animation style, clean lines, vibrant colors, professional character design',
    negativePrompt: 'photorealistic, photo, realistic, western cartoon'
  },
  'ilustracao': {
    prompt: 'digital illustration portrait, vector art style, flat design, modern illustration, clean professional look',
    negativePrompt: 'photorealistic, photo, 3d render'
  }
};

// Função para formatar mensagens de erro
function formatAPIError(errorData: any, provider: string): { message: string; action: string; provider: string } {
  const errorCode = errorData?.error?.code || errorData?.code || '';
  const errorType = errorData?.error?.type || errorData?.type || '';
  const errorMessage = errorData?.error?.message || errorData?.message || '';

  if (errorCode === 'billing_hard_limit_reached' || errorMessage.includes('billing') || errorMessage.includes('limit')) {
    return {
      provider,
      message: 'Limite de créditos atingido na conta.',
      action: provider.includes('OpenAI') 
        ? 'Acesse https://platform.openai.com/account/billing para adicionar créditos.'
        : 'Verifique os créditos da sua conta no provedor.'
    };
  }

  if (errorCode === 'invalid_api_key' || errorMessage.includes('API key') || errorMessage.includes('Unauthorized')) {
    return {
      provider,
      message: 'Chave de API inválida ou expirada.',
      action: 'Verifique sua chave de API nas configurações.'
    };
  }

  if (errorCode === 'insufficient_quota' || errorMessage.includes('quota')) {
    return {
      provider,
      message: 'Quota insuficiente na conta.',
      action: 'Adicione créditos à sua conta do provedor.'
    };
  }

  if (errorCode === 'rate_limit_exceeded' || errorMessage.includes('rate limit')) {
    return {
      provider,
      message: 'Limite de requisições excedido.',
      action: 'Aguarde alguns minutos e tente novamente.'
    };
  }

  return {
    provider,
    message: errorMessage || 'Erro desconhecido na API.',
    action: 'Verifique suas configurações ou tente outro provedor.'
  };
}

// Analisar imagem de referência com GPT-4 Vision
async function analyzeReferenceImage(imageBase64: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this photo and describe the person in detail for generating a similar professional avatar. Include:
- Approximate age range
- Hair color, style and length
- Face shape and features
- Skin tone
- Any distinctive features (glasses, beard, etc.)
- Expression and demeanor

Provide the description in English, as a concise prompt for image generation. Focus only on physical characteristics, not clothing or background. Keep it under 100 words.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    })
  });

  if (!response.ok) {
    throw new Error('Erro ao analisar imagem de referência');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Upload de imagem para Leonardo AI usando presigned URL
async function uploadImageToLeonardo(imageBase64: string, apiKey: string): Promise<string> {
  // Extrair dados da imagem base64
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const extension = imageBase64.includes('png') ? 'png' : 'jpg';
  
  console.log('Leonardo AI: Iniciando upload de imagem de referência...');
  
  // Passo 1: Obter presigned URL
  const initResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/init-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      extension: extension
    })
  });

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error('Leonardo AI init-image error:', errorText);
    throw new Error(`Falha ao iniciar upload: ${initResponse.status}`);
  }

  const initData = await initResponse.json();
  console.log('Leonardo AI init-image response:', JSON.stringify(initData).substring(0, 200));
  
  const uploadInfo = initData.uploadInitImage;
  if (!uploadInfo?.url || !uploadInfo?.id) {
    throw new Error('Dados de upload inválidos do Leonardo AI');
  }

  const { url: uploadUrl, fields: fieldsStr, id: imageId } = uploadInfo;
  
  // Passo 2: Fazer upload para S3 via presigned URL
  // Parsear fields se for string JSON
  const fields = typeof fieldsStr === 'string' ? JSON.parse(fieldsStr) : fieldsStr;
  
  // Converter base64 para buffer
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  // Construir form-data manualmente para Node.js
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
  let body = '';
  
  // Adicionar todos os campos do presigned URL
  if (fields && typeof fields === 'object') {
    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
  }
  
  // Adicionar o arquivo (deve ser o último campo)
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="reference.${extension}"\r\n`;
  body += `Content-Type: image/${extension}\r\n\r\n`;
  
  // Combinar texto + binário + fechamento
  const bodyStart = Buffer.from(body, 'utf8');
  const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const fullBody = Buffer.concat([bodyStart, imageBuffer, bodyEnd]);
  
  console.log('Leonardo AI: Fazendo upload para S3...');
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBody.length.toString()
    },
    body: fullBody
  });

  // 204 é sucesso para presigned URL
  if (!uploadResponse.ok && uploadResponse.status !== 204) {
    const errorText = await uploadResponse.text();
    console.error('Leonardo AI S3 upload error:', uploadResponse.status, errorText);
    throw new Error(`Falha no upload S3: ${uploadResponse.status}`);
  }

  console.log('Leonardo AI: Upload concluído, imageId:', imageId);
  return imageId;
}

// Gerar com Leonardo AI (cartoon/ilustração com referência de pessoa)
async function generateWithLeonardo(
  prompt: string, 
  negativePrompt: string, 
  apiKey: string, 
  referenceImageBase64?: string,
  style?: string
): Promise<string> {
  let initImageId: string | undefined;
  
  // Se temos imagem de referência, fazer upload primeiro
  if (referenceImageBase64) {
    try {
      console.log('Leonardo AI: Fazendo upload da foto de referência...');
      initImageId = await uploadImageToLeonardo(referenceImageBase64, apiKey);
      console.log('Leonardo AI: Foto enviada, ID:', initImageId);
    } catch (err: any) {
      console.error('Leonardo AI: Erro no upload:', err.message);
      // Lançar erro para informar o usuário
      throw new Error(`Falha ao enviar foto de referência: ${err.message}`);
    }
  }

  // Selecionar modelo baseado no estilo
  // Leonardo Phoenix (e71a1c2f-4f80-4800-934f-2c68979d8cc8) - bom para geral
  // Leonardo Anime XL (e71a1c2f-4f80-4800-934f-2c68979d8cc8) - anime
  // SDXL 1.0 (b24e16ff-06e3-43eb-8d33-4416c2d75876) - geral com controlnets
  const modelId = 'b24e16ff-06e3-43eb-8d33-4416c2d75876'; // Leonardo Lightning XL - suporta Character Reference

  // Construir prompt enfatizando que é um NOVO avatar baseado na pessoa
  let finalPrompt = prompt;
  if (initImageId) {
    // Enfatizar que queremos um avatar NOVO no estilo escolhido, mas com as características da pessoa
    finalPrompt = `Create a NEW ${style || 'cartoon'} style avatar portrait based on the reference person. ` +
      `The avatar should capture the EXACT facial features, face shape, eyes, nose, mouth, and expression of the reference photo. ` +
      `Style: ${prompt}. ` +
      `Important: This is a stylized illustration/cartoon, NOT a photo filter. Transform the person into the artistic style while keeping their likeness recognizable.`;
  }

  // Construir body da requisição
  const requestBody: any = {
    prompt: finalPrompt,
    negative_prompt: negativePrompt + ', photograph, photo, realistic skin texture, camera, lens flare',
    modelId: modelId,
    width: 1024,
    height: 1024,
    num_images: 1,
    guidance_scale: 7,
    public: false,
    alchemy: true,
    presetStyle: style === 'anime' ? 'ANIME' : (style === 'cartoon' ? 'CREATIVE' : 'CINEMATIC')
  };

  // Se temos imagem de referência, usar Character Reference
  if (initImageId) {
    requestBody.controlnets = [
      {
        initImageId: initImageId,
        initImageType: 'UPLOADED',
        preprocessorId: 133, // Character Reference - mantém semelhança facial
        strengthType: 'High' // Alta fidelidade às características da pessoa
      }
    ];
    console.log('Leonardo AI: Usando Character Reference para manter semelhança facial');
  }

  console.log('Leonardo AI: Iniciando geração com prompt:', finalPrompt.substring(0, 100) + '...');
  console.log('Leonardo AI: Request body:', JSON.stringify({ ...requestBody, prompt: requestBody.prompt.substring(0, 50) + '...' }));

  // Criar geração
  const createResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('Leonardo AI generation error:', createResponse.status, errorText);
    
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    const error: any = new Error('Leonardo AI API error');
    error.data = errorData;
    error.provider = 'Leonardo AI';
    throw error;
  }

  const createData = await createResponse.json();
  const generationId = createData.sdGenerationJob?.generationId;

  if (!generationId) {
    console.error('Leonardo AI: Resposta sem generationId:', createData);
    throw new Error('Falha ao iniciar geração no Leonardo AI');
  }

  console.log('Leonardo AI: Geração iniciada, ID:', generationId);

  // Aguardar geração (polling)
  let attempts = 0;
  const maxAttempts = 90; // 90 segundos máximo (Character Reference demora mais)
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!statusResponse.ok) {
      attempts++;
      continue;
    }

    const statusData = await statusResponse.json();
    const generation = statusData.generations_by_pk;

    if (generation?.status === 'COMPLETE' && generation?.generated_images?.length > 0) {
      console.log('Leonardo AI: Geração completa!');
      return generation.generated_images[0].url;
    }

    if (generation?.status === 'FAILED') {
      console.error('Leonardo AI: Geração falhou');
      throw new Error('Geração falhou no Leonardo AI - tente novamente');
    }

    // Log de progresso a cada 10 segundos
    if (attempts % 10 === 0) {
      console.log(`Leonardo AI: Aguardando... (${attempts}s, status: ${generation?.status || 'PENDING'})`);
    }

    attempts++;
  }

  throw new Error('Timeout aguardando geração do Leonardo AI (90s) - tente novamente');
}

// Gerar com D-ID (usa apresentadores pré-definidos ou gera imagem)
async function generateWithDID(prompt: string, apiKey: string): Promise<string> {
  // D-ID não gera imagens diretamente, mas podemos usar os presenters disponíveis
  // Primeiro, vamos listar os presenters disponíveis
  const presentersResponse = await fetch('https://api.d-id.com/clips/presenters', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!presentersResponse.ok) {
    const errorData = await presentersResponse.json().catch(() => ({}));
    const error: any = new Error('D-ID API error');
    error.data = errorData;
    error.provider = 'D-ID';
    throw error;
  }

  const presentersData = await presentersResponse.json();
  const presenters = presentersData.clips || presentersData.presenters || [];
  
  if (presenters.length === 0) {
    throw new Error('Nenhum presenter disponível no D-ID');
  }

  // Selecionar um presenter baseado no prompt (busca por palavras-chave)
  const isMale = prompt.toLowerCase().includes('male') || prompt.toLowerCase().includes('homem') || prompt.toLowerCase().includes('masculino');
  const isFemale = prompt.toLowerCase().includes('female') || prompt.toLowerCase().includes('mulher') || prompt.toLowerCase().includes('feminino');
  
  // Retornar a thumbnail do primeiro presenter adequado
  let selectedPresenter = presenters[0];
  for (const p of presenters) {
    const presenterName = (p.presenter_name || p.name || '').toLowerCase();
    if (isMale && (presenterName.includes('male') || presenterName.includes('man'))) {
      selectedPresenter = p;
      break;
    }
    if (isFemale && (presenterName.includes('female') || presenterName.includes('woman'))) {
      selectedPresenter = p;
      break;
    }
  }

  const thumbnailUrl = selectedPresenter.thumbnail_url || selectedPresenter.image_url || selectedPresenter.preview_url;
  if (!thumbnailUrl) {
    throw new Error('Presenter sem imagem de preview disponível');
  }

  return thumbnailUrl;
}

// Gerar com HeyGen (usa avatares pré-definidos)
async function generateWithHeyGen(prompt: string, apiKey: string): Promise<string> {
  // HeyGen usa avatares pré-definidos, vamos listar os disponíveis
  const avatarsResponse = await fetch('https://api.heygen.com/v2/avatars', {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });

  if (!avatarsResponse.ok) {
    const errorData = await avatarsResponse.json().catch(() => ({}));
    const error: any = new Error('HeyGen API error');
    error.data = errorData;
    error.provider = 'HeyGen';
    throw error;
  }

  const avatarsData = await avatarsResponse.json();
  const avatars = avatarsData.data?.avatars || avatarsData.avatars || [];
  
  if (avatars.length === 0) {
    throw new Error('Nenhum avatar disponível no HeyGen');
  }

  // Selecionar avatar baseado no prompt
  const isMale = prompt.toLowerCase().includes('male') || prompt.toLowerCase().includes('homem') || prompt.toLowerCase().includes('masculino');
  const isFemale = prompt.toLowerCase().includes('female') || prompt.toLowerCase().includes('mulher') || prompt.toLowerCase().includes('feminino');
  
  let selectedAvatar = avatars[0];
  for (const a of avatars) {
    const gender = (a.gender || '').toLowerCase();
    if (isMale && gender === 'male') {
      selectedAvatar = a;
      break;
    }
    if (isFemale && gender === 'female') {
      selectedAvatar = a;
      break;
    }
  }

  const previewUrl = selectedAvatar.preview_image_url || selectedAvatar.thumbnail_url || selectedAvatar.image_url;
  if (!previewUrl) {
    throw new Error('Avatar sem imagem de preview disponível');
  }

  return previewUrl;
}

// Gerar com OpenAI DALL-E 3
async function generateWithOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error('OpenAI API error');
    error.data = errorData;
    error.provider = 'OpenAI (DALL-E 3)';
    throw error;
  }

  const data = await response.json();
  return data.data?.[0]?.url || '';
}

// Gerar com Stability AI
async function generateWithStability(prompt: string, negativePrompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      text_prompts: [
        { text: prompt, weight: 1 },
        { text: negativePrompt, weight: -1 }
      ],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error('Stability API error');
    error.data = errorData;
    error.provider = 'Stability AI';
    throw error;
  }

  const data = await response.json();
  const base64Image = data.artifacts?.[0]?.base64;
  
  if (!base64Image) {
    throw new Error('Nenhuma imagem retornada');
  }

  return `data:image/png;base64,${base64Image}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      authorId, 
      avatarName, 
      avatarDesc, 
      avatarStyle, 
      gender,
      generationStyle = 'profissional',
      referenceImage,
      preferredProvider = 'openai'
    } = body;

    if (!authorId) {
      return NextResponse.json({ error: 'ID do autor é obrigatório' }, { status: 400 });
    }

    const openaiKey = getOpenAIKey();
    const stabilityKey = getStabilityKey();
    const didKey = getDIDKey();
    const heygenKey = getHeyGenKey();
    const leonardoKey = getLeonardoKey();

    // Verificar se há pelo menos uma API disponível
    if (!openaiKey && !stabilityKey && !didKey && !heygenKey && !leonardoKey) {
      return NextResponse.json({ 
        error: 'Nenhuma API de geração configurada',
        errorDetails: {
          provider: 'Sistema',
          message: 'Nenhuma chave de API disponível para geração de imagens.',
          action: 'Configure OPENAI_API_KEY, STABILITY_API_KEY, LEONARDO_API_KEY, D-ID ou HeyGen.'
        }
      }, { status: 500 });
    }

    // Obter configurações de estilo
    const styleConfig = GENERATION_STYLES[generationStyle] || GENERATION_STYLES['profissional'];
    
    // Construir prompt base
    const genderText = gender === 'female' ? 'woman' : 'man';
    let baseDescription = avatarDesc || 'professional appearance, confident expression';
    
    // Para Leonardo AI com referência, NÃO analisar com GPT-4 (usa Character Reference direto)
    // Para outros provedores, analisar com GPT-4 Vision se tiver referência
    const isLeonardoWithReference = preferredProvider === 'leonardo' && referenceImage && getLeonardoKey();
    
    if (referenceImage && openaiKey && !isLeonardoWithReference) {
      try {
        console.log('Analyzing reference image with GPT-4 Vision...');
        const analyzedDescription = await analyzeReferenceImage(referenceImage, openaiKey);
        if (analyzedDescription) {
          baseDescription = analyzedDescription;
          console.log('Reference image analyzed:', analyzedDescription);
        }
      } catch (err) {
        console.error('Error analyzing reference image:', err);
        // Continuar com a descrição original se falhar
      }
    }

    // Construir prompt final com estilo visual, cenário e descrição
    // Para estilos cartoon/anime/ilustração, enfatizar o estilo artístico
    const isArtisticStyle = ['cartoon', 'anime', 'ilustracao', 'artistico'].includes(generationStyle);
    
    let prompt: string;
    if (isArtisticStyle) {
      // Para estilos artísticos, enfatizar a transformação em ilustração
      prompt = `${styleConfig.prompt}. Portrait of a ${genderText}. ` +
        `Appearance: ${baseDescription}. ` +
        `Style: ${avatarStyle || 'professional IT consultant'}. ` +
        `Expression: friendly, confident, approachable. ` +
        `Background: clean, modern, suitable for business profile.`;
    } else {
      // Para estilos realistas/profissionais
      prompt = `Professional headshot portrait of a ${genderText}, ${baseDescription}. ` +
        `${styleConfig.prompt}. ` +
        `Style: ${avatarStyle || 'professional IT consultant'}. ` +
        `Looking at camera with friendly confident expression. ` +
        `The person should look like a trustworthy IT professional or business consultant.`;
    }
    
    console.log('Generating avatar with prompt:', prompt);
    console.log('Style:', generationStyle, 'Provider preference:', preferredProvider);

    let imageUrl = '';
    let usedProvider = '';

    // Lista de provedores disponíveis com prioridade baseada na preferência
    const allProviders = [
      { name: 'openai', key: openaiKey, label: 'OpenAI (DALL-E 3)' },
      { name: 'leonardo', key: leonardoKey, label: 'Leonardo AI' },
      { name: 'stability', key: stabilityKey, label: 'Stability AI' },
      { name: 'd-id', key: didKey, label: 'D-ID' },
      { name: 'heygen', key: heygenKey, label: 'HeyGen' }
    ].filter(p => p.key);

    // Ordenar para colocar o preferido primeiro
    const providers = allProviders.sort((a, b) => {
      if (a.name === preferredProvider) return -1;
      if (b.name === preferredProvider) return 1;
      return 0;
    });

    for (const provider of providers) {
      try {
        if (provider.name === 'openai') {
          imageUrl = await generateWithOpenAI(prompt, provider.key);
          usedProvider = 'OpenAI (DALL-E 3)';
        } else if (provider.name === 'leonardo') {
          // Leonardo AI suporta referência de imagem para criar cartoon baseado na pessoa
          imageUrl = await generateWithLeonardo(
            prompt, 
            styleConfig.negativePrompt || '', 
            provider.key, 
            referenceImage,
            generationStyle // Passar o estilo selecionado
          );
          usedProvider = 'Leonardo AI';
        } else if (provider.name === 'stability') {
          imageUrl = await generateWithStability(prompt, styleConfig.negativePrompt || '', provider.key);
          usedProvider = 'Stability AI';
        } else if (provider.name === 'd-id') {
          imageUrl = await generateWithDID(prompt, provider.key);
          usedProvider = 'D-ID';
        } else if (provider.name === 'heygen') {
          imageUrl = await generateWithHeyGen(prompt, provider.key);
          usedProvider = 'HeyGen';
        }

        if (imageUrl) break;
      } catch (err: any) {
        console.error(`Error with ${provider.name}:`, err.message);
        
        // Se é o último provedor, retornar erro
        if (provider === providers[providers.length - 1] || providers.filter(p => p.key).length === 1) {
          const formattedError = formatAPIError(err.data || {}, err.provider || provider.name);
          return NextResponse.json({ 
            error: 'Erro ao gerar avatar',
            errorDetails: formattedError
          }, { status: 500 });
        }
        // Caso contrário, tentar próximo provedor
        continue;
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ 
        error: 'Nenhuma imagem gerada',
        errorDetails: {
          provider: 'Sistema',
          message: 'Nenhum provedor conseguiu gerar a imagem.',
          action: 'Verifique as configurações das APIs ou tente novamente.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      provider: usedProvider,
      style: generationStyle
    });

  } catch (error: any) {
    console.error('Error generating avatar:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao gerar avatar',
        errorDetails: {
          provider: 'Sistema',
          message: error.message || 'Erro de conexão ou timeout.',
          action: 'Verifique sua conexão e tente novamente.'
        }
      },
      { status: 500 }
    );
  }
}

// Endpoint para listar provedores disponíveis
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const providers: any[] = [];
    
    if (getOpenAIKey()) {
      providers.push({
        id: 'openai',
        name: 'OpenAI (DALL-E 3)',
        description: 'Geração de alta qualidade com IA avançada',
        supportsReference: true
      });
    }
    
    if (getStabilityKey()) {
      providers.push({
        id: 'stability',
        name: 'Stability AI',
        description: 'Stable Diffusion XL para imagens detalhadas',
        supportsReference: false
      });
    }

    if (getDIDKey()) {
      providers.push({
        id: 'd-id',
        name: 'D-ID',
        description: 'Avatares de vídeo com apresentadores prontos',
        supportsReference: false
      });
    }

    if (getHeyGenKey()) {
      providers.push({
        id: 'heygen',
        name: 'HeyGen',
        description: 'Avatares de vídeo profissionais',
        supportsReference: false
      });
    }

    if (getLeonardoKey()) {
      providers.push({
        id: 'leonardo',
        name: 'Leonardo AI',
        description: 'Cartoon baseado na sua foto! Usa Character Reference',
        supportsReference: true,
        recommended: ['cartoon', 'anime', 'ilustracao', 'artistico']
      });
    }

    return NextResponse.json({
      providers,
      styles: Object.entries(GENERATION_STYLES).map(([id, config]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        description: config.prompt.split(',')[0]
      }))
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// Endpoint para salvar o avatar aprovado
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { authorId, imageUrl } = body;

    if (!authorId || !imageUrl) {
      return NextResponse.json({ error: 'ID do autor e URL da imagem são obrigatórios' }, { status: 400 });
    }

    // Atualizar o autor com a URL do avatar
    const author = await prisma.blogAuthor.update({
      where: { id: authorId },
      data: { videoAvatarImage: imageUrl }
    });

    return NextResponse.json({
      success: true,
      author: {
        id: author.id,
        videoAvatarImage: author.videoAvatarImage
      }
    });

  } catch (error: any) {
    console.error('Error saving avatar:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar avatar' },
      { status: 500 }
    );
  }
}
