export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const ABACUS_API_URL = "https://apps.abacus.ai/v1/chat/completions";

// Custos por 1M tokens (USD)
const COST_PER_1M_INPUT_TOKENS = 3.0;  // Claude Sonnet 4
const COST_PER_1M_OUTPUT_TOKENS = 15.0; // Claude Sonnet 4

// Imagens de fallback por categoria (sem marca d'água - royalty-free) - Pool expandido
const FALLBACK_IMAGES: Record<string, string[]> = {
  'seguranca': [
    '/images/cybersecurity.webp',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?w=1200&h=630&fit=crop',
  ],
  'cloud': [
    '/images/cloud_computing.jpg',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1560732488-6b0df240254a?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1535557597501-0fee0a500c57?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop',
  ],
  'gestao': [
    '/images/it_management.jpg',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=630&fit=crop',
  ],
  'suporte': [
    '/images/technical_support.webp',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1560264280-88b68371db39?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1553484771-371a605b060b?w=1200&h=630&fit=crop',
  ],
  'infraestrutura': [
    '/images/server_room.jpg',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1600267185393-e158a98703de?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=1200&h=630&fit=crop',
  ],
  'transformacao': [
    '/images/digital_transformation.jpg',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=630&fit=crop',
  ],
  'default': [
    '/images/server_room.jpg',
    '/images/digital_transformation.jpg',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=1200&h=630&fit=crop',
  ]
};

// Função para buscar imagens usadas recentemente do banco de dados (não mais in-memory)
async function getRecentlyUsedImagesFromDB(): Promise<string[]> {
  try {
    const recentPosts = await prisma.blogPost.findMany({
      where: { featuredImage: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { featuredImage: true }
    });
    return recentPosts.map(p => p.featuredImage).filter(Boolean) as string[];
  } catch {
    return [];
  }
}

// Função para selecionar imagem de fallback baseada no tema (evitando repetição)
async function selectFallbackImage(serviceType: string, title: string, excludeImages: string[] = []): Promise<string> {
  const searchText = `${serviceType} ${title}`.toLowerCase();
  
  let category = 'default';
  if (searchText.includes('segurança') || searchText.includes('antivírus') || searchText.includes('proteção') || searchText.includes('firewall') || searchText.includes('ransomware') || searchText.includes('hacker') || searchText.includes('cyber')) {
    category = 'seguranca';
  } else if (searchText.includes('cloud') || searchText.includes('nuvem') || searchText.includes('backup') || searchText.includes('azure') || searchText.includes('aws')) {
    category = 'cloud';
  } else if (searchText.includes('gestão') || searchText.includes('gerenciamento') || searchText.includes('monitoramento') || searchText.includes('ti')) {
    category = 'gestao';
  } else if (searchText.includes('suporte') || searchText.includes('help desk') || searchText.includes('noc') || searchText.includes('atendimento')) {
    category = 'suporte';
  } else if (searchText.includes('servidor') || searchText.includes('infraestrutura') || searchText.includes('rede') || searchText.includes('datacenter')) {
    category = 'infraestrutura';
  } else if (searchText.includes('transformação') || searchText.includes('digital') || searchText.includes('consultoria') || searchText.includes('projeto') || searchText.includes('ia') || searchText.includes('inteligência')) {
    category = 'transformacao';
  }
  
  const categoryImages = FALLBACK_IMAGES[category];
  
  // Buscar imagens recentes do banco em vez de usar array in-memory
  const recentlyUsedImages = await getRecentlyUsedImagesFromDB();
  const allExclusions = [...excludeImages, ...recentlyUsedImages];
  
  let availableImages = categoryImages.filter(img => !allExclusions.includes(img));
  
  if (availableImages.length === 0) {
    availableImages = categoryImages.filter(img => !excludeImages.includes(img));
    if (availableImages.length === 0) {
      availableImages = categoryImages;
    }
  }
  
  return availableImages[Math.floor(Math.random() * availableImages.length)];
}

// Função para gerar imagem (agora usa fallback inteligente)
async function generateImage(prompt: string, serviceType: string = '', title: string = ''): Promise<{ url: string; cost: number; error?: string; isFallback?: boolean }> {
  // Usar sistema de fallback inteligente baseado no tema
  console.log("Using intelligent fallback image selection for:", serviceType || title);
  
  const fallbackUrl = await selectFallbackImage(serviceType, title);
  
  return {
    url: fallbackUrl,
    cost: 0,
    isFallback: true,
    error: 'Usando imagem do acervo (limite de geração de imagens atingido na API OpenAI)'
  };
}

// Função para calcular custo do texto
function calculateTextCost(promptTokens: number, outputTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * COST_PER_1M_INPUT_TOKENS;
  const outputCost = (outputTokens / 1_000_000) * COST_PER_1M_OUTPUT_TOKENS;
  return Math.round((inputCost + outputCost) * 10000) / 10000; // Arredondar para 4 casas decimais
}

function buildPrompt(post: any, template: any): string {
  const persona = template?.persona || `Você é um redator especializado em conteúdo B2B de tecnologia e SEO Local.
Tom: Profissional, informativo e acessível.
Estilo: Técnico quando necessário, mas sempre claro e objetivo.`;

  // Detectar se é conteúdo local ou global
  const isLocal = post.geoCity || post.geoState;
  const location = post.geoCity || post.geoState || '';
  const seoLevel = post.seoLevel || 'GLOBAL';
  
  // Detectar se é página regional (CITY ou STATE) - usar template curto de ~180 palavras
  const isRegionalPage = seoLevel === 'CITY' || seoLevel === 'STATE';
  
  // Construir contexto geográfico
  let geoContext = '';
  if (post.geoCity) {
    geoContext = `Cidade: ${post.geoCity}${post.geoState ? ` - ${post.geoState}` : ''}`;
  } else if (post.geoState) {
    geoContext = `Estado: ${post.geoState}`;
  }

  // Tipo de atendimento
  const attendanceLabels: Record<string, string> = {
    'REMOTE': 'Remoto (100% online)',
    'LOCAL': 'Presencial',
    'HYBRID': 'Híbrido'
  };
  
  // Objetivo da página
  const objectiveLabels: Record<string, string> = {
    'AUTHORITY': 'Construir autoridade e educar',
    'TRAFFIC': 'Gerar tráfego orgânico',
    'CONVERSION': 'Conversão direta (leads/vendas)'
  };

  // Template Regional Curto (~180 palavras) para páginas de CITY/STATE
  if (isRegionalPage) {
    return `${persona}

## CONTEXTO
- Empresa: M3Solutions
- Segmento: Soluções de TI para empresas
- Público: Gestores de TI e tomadores de decisão

## PAUTA - PÁGINA REGIONAL SEO
- Serviço: ${post.serviceType || post.briefTitle}
- Localização: ${location}
- Nível: ${seoLevel === 'CITY' ? 'Cidade' : 'Estado'}
- CTA: ${post.briefCta || 'Solicitar orçamento'}

## REGRAS IMPORTANTES
- **CONTEÚDO CURTO**: Exatamente 150-200 palavras no total
- Title: máximo 60 caracteres com localização
- Meta description: máximo 155 caracteres
- Foco em SEO local para ${location}

## ESTRUTURA OBRIGATÓRIA
1. **H1**: [Serviço] em ${location} (título otimizado)
2. **Parágrafo introdutório** (2-3 frases): Apresentar o serviço + localização + diferencial M3Solutions
3. **H2 Benefícios** (3-4 bullets curtos): Principais vantagens para empresas de ${location}
4. **H2 Por que escolher** (2-3 frases): Diferencial de atendimento regional
5. **CTA final** (1 frase): Chamada para ação direta

## FORMATO DE SAÍDA
JSON puro (sem bloco de código):
{
  "title": "Título SEO otimizado para ${location} (max 60 chars)",
  "metaTitle": "Meta title com localização",
  "metaDescription": "Meta description local (max 155 chars)",
  "excerpt": "Resumo em 1 frase",
  "content": "# H1 com localização\\n\\nParágrafo introdutório curto.\\n\\n## Benefícios\\n\\n- Benefício 1\\n- Benefício 2\\n- Benefício 3\\n\\n## Por que escolher a M3Solutions\\n\\nTexto curto sobre diferenciais.\\n\\n**[CTA]**",
  "suggestedImage": "Descrição curta",
  "suggestedTags": ["tag1", "tag2"],
  "schemaType": "LocalBusiness",
  "faqItems": []
}`;
  }

  // Estrutura H2 baseada no nível SEO (conteúdo completo para GLOBAL)
  const h2Structure = isLocal 
    ? `- H2: O que é [serviço] e como funciona
- H2: Benefícios para empresas ${location ? `de ${location}` : 'da região'}
- H2: Como funciona na prática
- H2: Por que contratar ${post.serviceType || 'este serviço'} ${location ? `em ${location}` : ''}
- H2: Perguntas Frequentes ${location ? `sobre ${post.serviceType} em ${location}` : ''}
- H2: Próximo passo (CTA)`
    : `- H2: O que é [serviço] e por que é importante
- H2: Principais benefícios para empresas
- H2: Como funciona na prática
- H2: Diferenciais da M3Solutions
- H2: Perguntas Frequentes
- H2: Próximo passo (CTA)`;

  return `${persona}

## CONTEXTO
- Empresa: M3Solutions
- Segmento: Soluções de TI para empresas (segurança, cloud, gestão de TI, infraestrutura)
- Público: ${post.briefPersona || 'Gestores de TI, CTOs, tomadores de decisão em médias e grandes empresas'}

## DADOS DA PAUTA (SEO LOCAL)
- Produto/Serviço: ${post.serviceType || post.briefTitle}
- Marca: ${post.brand || 'Não especificada'}
- Tipo de Atendimento: ${attendanceLabels[post.attendanceType] || 'Não especificado'}
- Objetivo: ${objectiveLabels[post.pageObjective] || 'Não especificado'}
- Nível SEO: ${seoLevel}
${geoContext ? `- Localização: ${geoContext}` : '- Localização: Global (sem segmentação geográfica)'}
- Palavra-chave Principal: ${post.mainKeyword || post.briefKeywords?.[0] || 'Não especificada'}
- Palavras-chave Secundárias: ${(post.secondaryKeywords || []).join(', ') || 'Não especificadas'}
- CTA Desejado: ${post.briefCta || 'Solicitar orçamento / Falar com especialista'}
- Observações: ${post.briefNotes || 'Nenhuma'}

## REGRAS DE GERAÇÃO

### SEO
- Title: máximo 60 caracteres, incluir palavra-chave principal${isLocal ? ` e localização (${location})` : ''}
- Meta description: máximo 155 caracteres, engajante com CTA implícito
- Slug sugerido: ${post.seoRecommendedUrl || 'gerar baseado na palavra-chave'}
- Usar palavra-chave principal no H1, primeiro parágrafo e ao longo do texto naturalmente

### Estrutura Obrigatória (H2s):
${h2Structure}

### Conteúdo ${isLocal ? 'LOCAL' : 'GLOBAL'}
${isLocal ? `- Linguagem adequada à região (${location})
- Mencionar tipo de empresa predominante na região
- Expectativas de SLA considerando a localização
- Exemplos plausíveis de uso para empresas locais
- Diferenciais de atendimento para a região` : `- Conteúdo abrangente sem foco geográfico
- Exemplos aplicáveis a qualquer região do Brasil
- Foco em benefícios universais do serviço`}

### Conversão
- CTA claro e específico: "${post.briefCta || 'Falar com especialista'}"
- Sugestão de prova social ${isLocal ? 'regional' : 'geral'}

### Técnico
- Conteúdo em Markdown
- Aproximadamente 1000-1500 palavras
- ${isLocal ? 'Sugerir Schema LocalBusiness' : 'Sugerir Schema Service'}

## FORMATO DE SAÍDA
Responda APENAS com JSON válido:
{
  "title": "Título SEO otimizado (max 60 chars)",
  "metaTitle": "Meta title para SEO",
  "metaDescription": "Meta description (max 155 chars)",
  "excerpt": "Resumo em 2-3 frases",
  "content": "# H1\\n\\nConteúdo completo em Markdown com H2s estruturados...",
  "suggestedImage": "Descrição da imagem destacada",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "schemaType": "${isLocal ? 'LocalBusiness' : 'Service'}",
  "faqItems": [
    {"question": "Pergunta 1?", "answer": "Resposta 1"},
    {"question": "Pergunta 2?", "answer": "Resposta 2"}
  ]
}

JSON puro, sem blocos de código.`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    
    // Verificar se deve pular geração de imagem
    let skipImage = false;
    try {
      const body = await request.json();
      skipImage = body?.skipImage === true;
    } catch {
      // Body vazio é OK
    }
    
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Get default template
    const template = await prisma.voiceTemplate.findFirst({
      where: { isDefault: true, active: true }
    });

    // Update status to generating
    await prisma.blogPost.update({
      where: { id },
      data: { status: "GENERATING" }
    });

    const prompt = buildPrompt(post, template);

    // Call LLM API
    const response = await fetch(ABACUS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM API error:", response.status, errorText);
      
      // Revert status
      await prisma.blogPost.update({
        where: { id },
        data: { status: "BRIEFING" }
      });
      
      // Mensagem de erro mais amigável
      let errorMessage = "Erro ao gerar conteúdo com IA";
      if (response.status === 502 || response.status === 503 || response.status === 504 || errorText.includes("upstream")) {
        errorMessage = "Serviço de IA temporariamente indisponível. Por favor, tente novamente em alguns segundos.";
      } else if (response.status === 401) {
        errorMessage = "Erro de autenticação com o serviço de IA";
      } else if (response.status === 429) {
        errorMessage = "Limite de requisições excedido. Aguarde um momento e tente novamente.";
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Tentar parse do JSON com tratamento de erro
    let result;
    try {
      const responseText = await response.text();
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing API response as JSON:", parseError);
      await prisma.blogPost.update({
        where: { id },
        data: { status: "BRIEFING" }
      });
      return NextResponse.json({ error: "Erro ao processar resposta do serviço de IA. Tente novamente." }, { status: 500 });
    }
    
    let content = result.choices?.[0]?.message?.content;
    
    // Extrair JSON da resposta (pode estar em bloco de código)
    if (content) {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        content = jsonMatch[1].trim();
      }
    }

    if (!content) {
      await prisma.blogPost.update({
        where: { id },
        data: { status: "BRIEFING" }
      });
      return NextResponse.json({ error: "Resposta vazia da IA" }, { status: 500 });
    }

    // Parse generated content
    let generated;
    try {
      generated = JSON.parse(content);
    } catch (e) {
      console.error("Error parsing LLM response:", content);
      await prisma.blogPost.update({
        where: { id },
        data: { status: "BRIEFING" }
      });
      return NextResponse.json({ error: "Erro ao processar resposta da IA" }, { status: 500 });
    }

    // Calcular custo do texto
    const usage = result.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const textCost = calculateTextCost(promptTokens, outputTokens);
    
    // Gerar imagem automaticamente (se não estiver pulando)
    let featuredImageUrl: string | null = null;
    let imageCost = 0;
    let imageError: string | null = null;
    
    if (!skipImage) {
      console.log("Selecting image for:", post.serviceType || post.briefTitle);
      try {
        const imageResult = await generateImage(
          generated.suggestedImage || '', 
          post.serviceType || '', 
          post.briefTitle || generated.title || ''
        );
        if (imageResult) {
          if (imageResult.url) {
            featuredImageUrl = imageResult.url;
            imageCost = imageResult.cost;
            console.log("Image selected successfully:", featuredImageUrl);
            if (imageResult.isFallback) {
              imageError = imageResult.error || 'Usando imagem do acervo';
            }
          } else {
            imageError = imageResult.error || "Não foi possível selecionar a imagem";
            console.warn("Image selection failed:", imageError);
          }
        }
      } catch (imgError: any) {
        imageError = `Erro na seleção de imagem: ${imgError.message}`;
        console.error("Image selection error:", imgError);
      }
    } else {
      console.log("Skipping image generation as requested");
      imageError = "Geração de imagem pulada";
    }

    const totalCost = Math.round((textCost + imageCost) * 10000) / 10000;

    // Gerar Schema Markup se houver FAQ
    let schemaMarkup: string | null = null;
    if (generated.faqItems && generated.faqItems.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": generated.faqItems.map((item: any) => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      };
      
      // Se for local, adicionar LocalBusiness também
      if (generated.schemaType === 'LocalBusiness' && (post.geoCity || post.geoState)) {
        schemaMarkup = JSON.stringify([
          faqSchema,
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "M3Solutions",
            "description": generated.metaDescription,
            "areaServed": {
              "@type": "Place",
              "name": post.geoCity || post.geoState
            }
          }
        ]);
      } else {
        schemaMarkup = JSON.stringify(faqSchema);
      }
    }

    // Update post with generated content
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        title: generated.title || post.briefTitle,
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        excerpt: generated.excerpt,
        content: generated.content,
        featuredImage: featuredImageUrl || post.featuredImage,
        schemaMarkup: schemaMarkup,
        status: "DRAFT",
        aiGenerated: true,
        aiModel: "claude-sonnet-4-20250514",
        aiPromptUsed: prompt,
        aiGeneratedAt: new Date()
      },
      include: {
        category: true,
        author: true
      }
    });

    // Log AI usage for text generation
    await prisma.aIUsageLog.create({
      data: {
        model: "claude-sonnet-4-20250514",
        promptTokens: promptTokens,
        outputTokens: outputTokens,
        totalTokens: usage.total_tokens || 0,
        cost: textCost,
        operation: "GENERATE_TEXT",
        postId: id,
        userId: (session.user as any).id
      }
    });

    // Log AI usage for image generation (if successful)
    if (featuredImageUrl) {
      await prisma.aIUsageLog.create({
        data: {
          model: imageCost > 0 ? "dall-e-3" : "fallback",
          promptTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: imageCost,
          operation: "GENERATE_IMAGE",
          postId: id,
          userId: (session.user as any).id
        }
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "POST_AI_GENERATED",
        entityType: "BlogPost",
        entityId: id,
        details: `Conteúdo gerado com IA para: ${updatedPost.title}. Custo total: $${totalCost.toFixed(4)}`,
        userId: (session.user as any).id
      }
    });

    return NextResponse.json({
      post: updatedPost,
      generated: {
        suggestedImage: generated.suggestedImage,
        suggestedTags: generated.suggestedTags
      },
      costs: {
        text: {
          model: "claude-sonnet-4-20250514",
          promptTokens,
          outputTokens,
          cost: textCost
        },
        image: featuredImageUrl ? {
          model: imageCost > 0 ? "dall-e-3" : "fallback",
          cost: imageCost
        } : null,
        total: totalCost,
        imageError
      }
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: "Erro ao gerar conteúdo" }, { status: 500 });
  }
}
