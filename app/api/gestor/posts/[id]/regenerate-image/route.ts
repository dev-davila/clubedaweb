export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Gerar imagem via RouteLLM API (com modalities: ["image"])
async function generateImageWithAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) {
    console.warn("ABACUSAI_API_KEY não configurada, pulando geração de imagem por IA");
    return null;
  }

  try {
    console.log("Gerando imagem via RouteLLM API...");
    const response = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-11-20",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro RouteLLM:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message;

    // Verificar campo "images" (formato principal da resposta RouteLLM)
    const images = message?.images;
    if (images && Array.isArray(images)) {
      for (const block of images) {
        if (block.type === "image_url" && block.image_url?.url) {
          console.log("Imagem IA gerada com sucesso (via images)");
          return block.image_url.url;
        }
      }
    }

    // Fallback: verificar campo "content" (formato alternativo)
    const content = message?.content;
    if (content && Array.isArray(content)) {
      for (const block of content) {
        if (block.type === "image_url" && block.image_url?.url) {
          console.log("Imagem IA gerada com sucesso (via content)");
          return block.image_url.url;
        }
      }
    }

    console.error("Nenhuma imagem encontrada na resposta:", JSON.stringify(data).substring(0, 500));
    return null;
  } catch (error) {
    console.error("Erro ao gerar imagem com IA:", error);
    return null;
  }
}

// ============================================================
// Sistema de estilos visuais por categoria/tema
// ============================================================
interface VisualStyle {
  mood: string;
  palette: string;
  lighting: string;
  elements: string;
  composition: string;
}

const VISUAL_STYLES: Record<string, VisualStyle> = {
  seguranca: {
    mood: "dramático e impactante, senso de proteção e vigilância",
    palette: "azul-escuro profundo (#0A1628), ciano elétrico (#06B6D4), acentos de vermelho alarme (#EF4444) e dourado (#F59E0B)",
    lighting: "iluminação low-key com feixes de luz direcionais, efeito de holograma ou scan digital, brilhos neon sutis",
    elements: "escudos digitais, cadeados holográficos, firewalls abstratos, matrizes de dados, circuitos de proteção, ondas de radar",
    composition: "ponto focal central forte com linhas convergentes, profundidade de campo acentuada, atmosfera high-tech"
  },
  cloud: {
    mood: "clean, aéreo e expansivo, sensação de leveza e escalabilidade",
    palette: "gradientes de céu (branco → azul claro #7DD3FC → azul médio #3B82F6), acentos de lavanda (#A78BFA) e menta (#34D399)",
    lighting: "iluminação suave difusa vinda de cima, efeito de luz volumétrica entre nuvens, reflexos sutis",
    elements: "nuvens abstratas geométricas, conexões entre pontos flutuantes, racks de servidores minimalistas, fluxos de dados ascendentes",
    composition: "espaço aberto com perspectiva aérea, composição assimétrica com terço inferior livre para texto"
  },
  gestao: {
    mood: "organizado e confiante, transmite controle e visão estratégica",
    palette: "azul corporativo (#1E40AF), cinza slate (#334155), acentos de verde sucesso (#10B981) e laranja warmth (#F97316)",
    lighting: "iluminação natural de escritório moderno, golden hour sutil, luz ambiente quente e profissional",
    elements: "dashboards holográficos, gráficos 3D flutuantes, mãos interagindo com telas, ambientes de escritório moderno com monitores",
    composition: "perspectiva over-the-shoulder ou vista panorâmica de espaço de trabalho, profundidade de campo média"
  },
  suporte: {
    mood: "acolhedor e acessível, transmite rapidez e eficiência",
    palette: "verde (#10B981), azul confiança (#3B82F6), branco clean, acentos de amarelo energia (#FBBF24)",
    lighting: "iluminação clara e uniforme, tom otimista, sem sombras pesadas",
    elements: "headsets, telas de monitoramento, ícones de chat/suporte, NOC com múltiplos monitores, indicadores de status verde",
    composition: "enquadramento dinâmico com ação, pessoa de costas ou mãos operando equipamento, sensação de equipe ativa"
  },
  infraestrutura: {
    mood: "robusto e imponente, sensação de escala e confiabilidade",
    palette: "cinza aço (#64748B), azul industrial (#1E3A5F), acentos de ciano (#22D3EE) e laranja sinalização (#FB923C)",
    lighting: "iluminação dramática de datacenter com LEDs azuis, pontos de luz nas fileiras de servidores, ambiente tecnológico",
    elements: "racks de servidores com LEDs, corredores de datacenter, cabos de fibra óptica organizados, sistemas de refrigeração",
    composition: "perspectiva em ponto de fuga (corredor de datacenter), simetria forte, sensação de profundidade infinita"
  },
  transformacao: {
    mood: "inovador e inspirador, sensação de evolução e futuro",
    palette: "gradiente roxo→azul (#7C3AED → #3B82F6), acentos de rosa (#EC4899) e dourado (#F59E0B), fundo escuro",
    lighting: "iluminação futurista com glows e reflexos, efeito aurora boreal sutil, brilhos de partículas",
    elements: "engrenagens digitais em transformação, IA e redes neurais abstratas, metamorfose digital, blocos se reconfigurando",
    composition: "composição dinâmica com movimento diagonal, elementos em transição/transformação, sensação de progresso"
  },
  default: {
    mood: "profissional e moderno, versatilidade tecnológica",
    palette: "azul tecnologia (#2563EB), cinza grafite (#374151), branco, acentos de laranja M3 (#F97316)",
    lighting: "iluminação equilibrada com um rim light lateral, profundidade com bokeh sutil, ambiente corporate-tech",
    elements: "interfaces digitais, conexões de rede, dispositivos tecnológicos, elementos geométricos abstratos",
    composition: "regra dos terços, ponto focal claro no terço direito, terço esquerdo com espaço negativo para sobreposição de texto"
  }
};

function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('segurança') || t.includes('antivírus') || t.includes('proteção') || t.includes('firewall') || t.includes('cyber') || t.includes('hacker') || t.includes('phishing') || t.includes('ransomware') || t.includes('malware') || t.includes('vulnerabilidade') || t.includes('criptografia') || t.includes('lgpd') || t.includes('privacidade') || t.includes('bitdefender') || t.includes('sophos') || t.includes('kaspersky')) {
    return 'seguranca';
  } else if (t.includes('cloud') || t.includes('nuvem') || t.includes('backup') || t.includes('azure') || t.includes('aws') || t.includes('saas') || t.includes('iaas') || t.includes('multicloud') || t.includes('migração para nuvem')) {
    return 'cloud';
  } else if (t.includes('gestão') || t.includes('gerenciamento') || t.includes('monitoramento') || t.includes('dashboard') || t.includes('kpi') || t.includes('compliance') || t.includes('governança') || t.includes('itil') || t.includes('msp')) {
    return 'gestao';
  } else if (t.includes('suporte') || t.includes('help desk') || t.includes('noc') || t.includes('atendimento') || t.includes('chamado') || t.includes('sla') || t.includes('service desk') || t.includes('24x7')) {
    return 'suporte';
  } else if (t.includes('servidor') || t.includes('infraestrutura') || t.includes('rede') || t.includes('datacenter') || t.includes('data center') || t.includes('fibra') || t.includes('rack') || t.includes('windows server') || t.includes('linux') || t.includes('vmware') || t.includes('hypervisor')) {
    return 'infraestrutura';
  } else if (t.includes('transformação') || t.includes('digital') || t.includes('inovação') || t.includes('inteligência artificial') || t.includes(' ia ') || t.includes('automação') || t.includes('machine learning') || t.includes('chatgpt') || t.includes('copilot') || t.includes('futuro')) {
    return 'transformacao';
  }
  return 'default';
}

// Construir prompt de geração de imagem baseado no contexto do post
function buildImagePrompt(post: {
  title: string | null;
  briefTitle: string | null;
  briefKeywords: string[] | null;
  serviceType: string | null;
  excerpt?: string | null;
}, imageType: string): string {
  const title = post.briefTitle || post.title || "Tecnologia da Informação";
  const keywords = (post.briefKeywords || []).join(", ");
  const service = post.serviceType || "";
  const excerpt = post.excerpt || "";

  // Detectar categoria para estilo visual
  const contextText = `${title} ${service} ${keywords} ${excerpt}`;
  const category = detectCategory(contextText);
  const style = VISUAL_STYLES[category];

  // Variação para imagem secundária
  const isSecondary = imageType === "secondary";
  const angleInstruction = isSecondary
    ? "Use uma perspectiva completamente diferente: se a imagem principal seria uma vista geral, esta deve ser um close-up de detalhe; se seria tecnologia, foque no elemento humano interagindo com a tecnologia."
    : "";

  return `Crie uma fotografia editorial de alta qualidade para o artigo "${title}" de um blog corporativo de TI.

CONTEXTO DO ARTIGO:
${service ? `- Área de atuação: ${service}` : ""}
${keywords ? `- Temas-chave: ${keywords}` : ""}
${excerpt ? `- Resumo: ${excerpt.substring(0, 200)}` : ""}

CONCEITO VISUAL:
Imagine a cena mais impactante que representaria visualmente este artigo para alguém scrollando um feed de LinkedIn ou Instagram. A imagem precisa comunicar o tema em menos de 2 segundos.

ESTILO E ATMOSFERA:
- Tom: ${style.mood}
- Paleta de cores: ${style.palette}
- Iluminação: ${style.lighting}

ELEMENTOS VISUAIS:
- Inclua: ${style.elements}
- Pode incluir figuras humanas vistas de costas, mãos interagindo com tecnologia, ou silhuetas em ambientes tech — isso humaniza a cena
- PROIBIDO: texto, letras, palavras, logotipos, marcas d'água ou qualquer escrita na imagem

COMPOSIÇÃO E ENQUADRAMENTO:
- ${style.composition}
- OBRIGATÓRIO: deixar uma área limpa (espaço negativo) no terço inferior ou superior da imagem para sobreposição de título — essa região deve ter cor sólida ou gradiente suave, sem elementos visuais complexos
- Proporção paisagem 16:9 (1536×1024), otimizada para banner de blog e compartilhamento em redes sociais
- Profundidade de campo cinematográfica com foco seletivo no elemento principal

QUALIDADE TÉCNICA:
- Renderização fotorrealista com qualidade de fotografia editorial
- Nitidez alta no ponto focal, bokeh suave no background
- Sem artefatos, sem distorções, sem elementos duplicados
${angleInstruction ? `\nVARIAÇÃO: ${angleInstruction}` : ""}`;
}

// Upload data URI para S3 e retornar URL permanente
async function uploadBase64ToS3(dataUri: string, postId: string, imageType: string): Promise<string | null> {
  try {
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;

    const contentType = matches[1];
    const imageBuffer = Buffer.from(matches[2], "base64");
    
    let extension = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
    else if (contentType.includes("webp")) extension = "webp";

    const prefix = imageType === "secondary" ? "secondary-ai" : "ai";
    const fileName = `${prefix}-${postId}-${Date.now()}.${extension}`;
    const s3Key = `posts/${postId}/${fileName}`;

    const s3Client = new S3Client({
      region: process.env.M3_AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.M3_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.M3_AWS_SECRET_ACCESS_KEY || ""
      }
    });

    const bucketName = process.env.M3_AWS_BUCKET_NAME || "img.m3solutions.com.br";

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: contentType
    }));

    const permanentUrl = `https://s3.amazonaws.com/${bucketName}/${s3Key}`;
    console.log("AI image uploaded to S3:", permanentUrl);
    return permanentUrl;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem IA para S3:", error);
    return null;
  }
}

// Imagens de fallback por categoria (mantido como backup)
const FALLBACK_IMAGES: Record<string, string[]> = {
  'seguranca': [
    'https://cdn.m3solutions.net.br/cybersecurity.webp',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop',
  ],
  'cloud': [
    'https://cdn.m3solutions.net.br/cloud_computing.jpg',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop',
  ],
  'gestao': [
    'https://cdn.m3solutions.net.br/it_management.jpg',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop',
  ],
  'suporte': [
    'https://cdn.m3solutions.net.br/technical_support.webp',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=630&fit=crop',
  ],
  'infraestrutura': [
    'https://cdn.m3solutions.net.br/server_room.jpg',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop',
  ],
  'transformacao': [
    'https://cdn.m3solutions.net.br/digital_transformation.jpg',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=630&fit=crop',
  ],
  'default': [
    'https://cdn.m3solutions.net.br/server_room.jpg',
    'https://cdn.m3solutions.net.br/digital_transformation.jpg',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop',
  ]
};

function selectFallbackImage(searchText: string, excludeImages: string[] = []): string {
  const text = searchText.toLowerCase();
  let category = 'default';
  
  if (text.includes('segurança') || text.includes('antivírus') || text.includes('proteção') || text.includes('firewall') || text.includes('cyber') || text.includes('hacker')) {
    category = 'seguranca';
  } else if (text.includes('cloud') || text.includes('nuvem') || text.includes('backup') || text.includes('azure') || text.includes('aws')) {
    category = 'cloud';
  } else if (text.includes('gestão') || text.includes('gerenciamento') || text.includes('monitoramento') || text.includes('ti')) {
    category = 'gestao';
  } else if (text.includes('suporte') || text.includes('help desk') || text.includes('noc') || text.includes('atendimento')) {
    category = 'suporte';
  } else if (text.includes('servidor') || text.includes('infraestrutura') || text.includes('rede') || text.includes('datacenter')) {
    category = 'infraestrutura';
  } else if (text.includes('transformação') || text.includes('digital') || text.includes('consultoria') || text.includes('projeto') || text.includes('ia')) {
    category = 'transformacao';
  }
  
  const categoryImages = FALLBACK_IMAGES[category];
  const available = categoryImages.filter(img => !excludeImages.includes(img));
  if (available.length === 0) return categoryImages[0];
  return available[Math.floor(Math.random() * available.length)];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const previewOnly = body.previewOnly === true;
    const imageType = body.imageType || "featured";
    const useFallback = body.useFallback === true; // Força uso do banco de imagens

    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { 
        id: true, 
        title: true, 
        briefTitle: true, 
        briefKeywords: true, 
        serviceType: true,
        excerpt: true,
        featuredImage: true,
        secondaryImage: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    let imageUrl: string | null = null;
    let isAIGenerated = false;

    // Tentar gerar via IA primeiro (a menos que forçado fallback)
    if (!useFallback) {
      const prompt = buildImagePrompt(post, imageType);
      const aiDataUri = await generateImageWithAI(prompt);
      if (aiDataUri) {
        // Já fazer upload para S3 para evitar enviar base64 gigante ao frontend
        const s3Url = await uploadBase64ToS3(aiDataUri, post.id, imageType);
        if (s3Url) {
          imageUrl = s3Url;
          isAIGenerated = true;
        }
      }
    }

    // Fallback: banco de imagens
    if (!imageUrl) {
      const searchText = `${post.serviceType || ''} ${post.briefTitle || ''} ${post.title || ''} ${(post.briefKeywords || []).join(' ')}`;
      const excludeImages: string[] = [];
      if (post.featuredImage) excludeImages.push(post.featuredImage);
      if (post.secondaryImage) excludeImages.push(post.secondaryImage);
      imageUrl = selectFallbackImage(searchText, excludeImages);
    }

    // Se é apenas preview, retorna URL sem salvar no post
    if (previewOnly) {
      return NextResponse.json({
        success: true,
        previewUrl: imageUrl,
        isFallback: !isAIGenerated,
        isAIGenerated,
        message: isAIGenerated ? "Imagem gerada por IA (já no S3)" : "Usando imagem do acervo (fallback)",
        cost: 0
      });
    }

    // Salva no post (featuredImage ou secondaryImage)
    const updateData = imageType === "secondary" 
      ? { secondaryImage: imageUrl }
      : { featuredImage: imageUrl };
    
    await prisma.blogPost.update({
      where: { id },
      data: updateData
    });

    const responseData = imageType === "secondary"
      ? { success: true, secondaryImage: imageUrl, isFallback: !isAIGenerated, isAIGenerated, message: isAIGenerated ? "Imagem IA secundária aplicada" : "Imagem secundária do acervo aplicada", cost: 0 }
      : { success: true, featuredImage: imageUrl, isFallback: !isAIGenerated, isAIGenerated, message: isAIGenerated ? "Imagem IA aplicada com sucesso" : "Imagem do acervo aplicada", cost: 0 };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error regenerating image:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
