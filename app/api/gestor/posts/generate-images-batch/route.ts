export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { ImageGenStatus, getImageGenStatus, setImageGenStatus } from "@/lib/image-gen-status";

// ============================================================
// Funções de geração de imagem (copiadas de regenerate-image)
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
    elements: "escudos digitais, cadeados holográficos, firewalls abstratos, matrizes de dados, circuitos de proteção",
    composition: "ponto focal central forte com linhas convergentes, profundidade de campo acentuada"
  },
  cloud: {
    mood: "clean, aéreo e expansivo, sensação de leveza e escalabilidade",
    palette: "gradientes de céu (branco → azul claro #7DD3FC → azul médio #3B82F6), acentos de lavanda (#A78BFA) e menta (#34D399)",
    lighting: "iluminação suave difusa vinda de cima, efeito de luz volumétrica entre nuvens",
    elements: "nuvens abstratas geométricas, conexões entre pontos flutuantes, fluxos de dados ascendentes",
    composition: "espaço aberto com perspectiva aérea, composição assimétrica"
  },
  gestao: {
    mood: "organizado e confiante, transmite controle e visão estratégica",
    palette: "azul corporativo (#1E40AF), cinza slate (#334155), acentos de verde sucesso (#10B981) e laranja warmth (#F97316)",
    lighting: "iluminação natural de escritório moderno, golden hour sutil",
    elements: "dashboards holográficos, gráficos 3D flutuantes, ambientes de escritório moderno",
    composition: "perspectiva over-the-shoulder ou vista panorâmica de espaço de trabalho"
  },
  suporte: {
    mood: "acolhedor e acessível, transmite rapidez e eficiência",
    palette: "verde (#10B981), azul confiança (#3B82F6), branco clean, acentos de amarelo (#FBBF24)",
    lighting: "iluminação clara e uniforme, tom otimista",
    elements: "headsets, telas de monitoramento, ícones de chat, NOC com múltiplos monitores",
    composition: "enquadramento dinâmico com ação, sensação de equipe ativa"
  },
  infraestrutura: {
    mood: "robusto e imponente, sensação de escala e confiabilidade",
    palette: "cinza aço (#64748B), azul industrial (#1E3A5F), acentos de ciano (#22D3EE) e laranja (#FB923C)",
    lighting: "iluminação dramática de datacenter com LEDs azuis",
    elements: "racks de servidores com LEDs, corredores de datacenter, cabos de fibra óptica",
    composition: "perspectiva em ponto de fuga, simetria forte, sensação de profundidade"
  },
  transformacao: {
    mood: "inovador e inspirador, sensação de evolução e futuro",
    palette: "gradiente roxo→azul (#7C3AED → #3B82F6), acentos de rosa (#EC4899) e dourado (#F59E0B)",
    lighting: "iluminação futurista com glows e reflexos, efeito aurora boreal sutil",
    elements: "engrenagens digitais em transformação, IA e redes neurais abstratas",
    composition: "composição dinâmica com movimento diagonal, sensação de progresso"
  },
  default: {
    mood: "profissional e moderno, versatilidade tecnológica",
    palette: "azul tecnologia (#2563EB), cinza grafite (#374151), branco, acentos de laranja M3 (#F97316)",
    lighting: "iluminação equilibrada com um rim light lateral, profundidade com bokeh sutil",
    elements: "interfaces digitais, conexões de rede, dispositivos tecnológicos",
    composition: "regra dos terços, ponto focal claro, espaço negativo para texto"
  }
};

function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('segurança') || t.includes('antivírus') || t.includes('proteção') || t.includes('firewall') || t.includes('cyber') || t.includes('ransomware') || t.includes('malware') || t.includes('lgpd') || t.includes('bitdefender') || t.includes('sophos') || t.includes('kaspersky')) return 'seguranca';
  if (t.includes('cloud') || t.includes('nuvem') || t.includes('backup') || t.includes('azure') || t.includes('aws') || t.includes('saas') || t.includes('multicloud')) return 'cloud';
  if (t.includes('gestão') || t.includes('gerenciamento') || t.includes('monitoramento') || t.includes('dashboard') || t.includes('compliance') || t.includes('itil')) return 'gestao';
  if (t.includes('suporte') || t.includes('help desk') || t.includes('noc') || t.includes('atendimento') || t.includes('sla') || t.includes('service desk')) return 'suporte';
  if (t.includes('servidor') || t.includes('infraestrutura') || t.includes('rede') || t.includes('datacenter') || t.includes('vmware') || t.includes('hypervisor')) return 'infraestrutura';
  if (t.includes('transformação') || t.includes('digital') || t.includes('inovação') || t.includes('inteligência artificial') || t.includes('automação') || t.includes('machine learning')) return 'transformacao';
  return 'default';
}

function buildImagePrompt(post: { title: string | null; briefTitle: string | null; briefKeywords: string[]; serviceType: string | null; excerpt?: string | null; }): string {
  const title = post.briefTitle || post.title || "Tecnologia da Informação";
  const keywords = (post.briefKeywords || []).join(", ");
  const service = post.serviceType || "";
  const excerpt = post.excerpt || "";
  const contextText = `${title} ${service} ${keywords} ${excerpt}`;
  const category = detectCategory(contextText);
  const style = VISUAL_STYLES[category];

  return `Crie uma fotografia editorial de alta qualidade para o artigo "${title}" de um blog corporativo de TI.

CONTEXTO: ${service ? `Área: ${service}.` : ""} ${keywords ? `Temas: ${keywords}.` : ""}

ESTILO: ${style.mood}. Paleta: ${style.palette}. Iluminação: ${style.lighting}.
ELEMENTOS: ${style.elements}. Composição: ${style.composition}.

OBRIGATÓRIO: Proporção 16:9 (1536×1024). Deixar espaço negativo para texto. PROIBIDO texto/letras/logotipos na imagem.
Qualidade fotorrealista editorial, nitidez alta, bokeh suave.`;
}

const FALLBACK_IMAGES: Record<string, string[]> = {
  'seguranca': ['https://cdn.m3solutions.net.br/cybersecurity.webp', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=630&fit=crop'],
  'cloud': ['https://cdn.m3solutions.net.br/cloud_computing.jpg', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=630&fit=crop'],
  'gestao': ['https://cdn.m3solutions.net.br/it_management.jpg', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop'],
  'suporte': ['https://cdn.m3solutions.net.br/technical_support.webp', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=630&fit=crop'],
  'infraestrutura': ['https://cdn.m3solutions.net.br/server_room.jpg', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop'],
  'transformacao': ['https://cdn.m3solutions.net.br/digital_transformation.jpg', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=630&fit=crop'],
  'default': ['https://cdn.m3solutions.net.br/server_room.jpg', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop']
};

async function selectFallbackImage(searchText: string, excludeImages: string[] = []): Promise<string> {
  const category = detectCategory(searchText);
  const categoryImages = FALLBACK_IMAGES[category] || FALLBACK_IMAGES['default'];
  // Fetch recently used images from DB to avoid repetition across deploys
  let recentlyUsed: string[] = [];
  try {
    const recentPosts = await prisma.blogPost.findMany({
      where: { featuredImage: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { featuredImage: true }
    });
    recentlyUsed = recentPosts.map(p => p.featuredImage).filter(Boolean) as string[];
  } catch {}
  const allExclusions = [...excludeImages, ...recentlyUsed];
  let available = categoryImages.filter(img => !allExclusions.includes(img));
  if (available.length === 0) {
    available = categoryImages.filter(img => !excludeImages.includes(img));
    if (available.length === 0) available = categoryImages;
  }
  return available[Math.floor(Math.random() * available.length)];
}

async function generateImageWithAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o-2024-11-20", messages: [{ role: "user", content: prompt }], modalities: ["image"] })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const message = data?.choices?.[0]?.message;
    const images = message?.images;
    if (images && Array.isArray(images)) {
      for (const block of images) {
        if (block.type === "image_url" && block.image_url?.url) return block.image_url.url;
      }
    }
    const content = message?.content;
    if (content && Array.isArray(content)) {
      for (const block of content) {
        if (block.type === "image_url" && block.image_url?.url) return block.image_url.url;
      }
    }
    return null;
  } catch { return null; }
}

async function uploadBase64ToS3(dataUri: string, postId: string): Promise<string | null> {
  try {
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;
    const contentType = matches[1];
    const imageBuffer = Buffer.from(matches[2], "base64");
    let extension = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
    else if (contentType.includes("webp")) extension = "webp";
    const fileName = `ai-${postId}-${Date.now()}.${extension}`;
    const s3Key = `posts/${postId}/${fileName}`;
    const s3Client = new S3Client({
      region: process.env.M3_AWS_REGION || "us-east-1",
      credentials: { accessKeyId: process.env.M3_AWS_ACCESS_KEY_ID || "", secretAccessKey: process.env.M3_AWS_SECRET_ACCESS_KEY || "" }
    });
    const bucketName = process.env.M3_AWS_BUCKET_NAME || "img.m3solutions.com.br";
    await s3Client.send(new PutObjectCommand({ Bucket: bucketName, Key: s3Key, Body: imageBuffer, ContentType: contentType }));
    const permanentUrl = `https://s3.amazonaws.com/${bucketName}/${s3Key}`;
    console.log("AI image uploaded to S3:", permanentUrl);
    return permanentUrl;
  } catch (error) {
    console.error("Erro upload S3:", error);
    return null;
  }
}

// ============================================================
// Processo em background
// ============================================================

async function processImagesInBackground(postIds: string[], useAI: boolean, serviceType?: string) {
  const status: ImageGenStatus = {
    running: true,
    total: postIds.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    currentPost: '',
    errors: [],
    startedAt: new Date().toISOString(),
    finishedAt: null,
    serviceType: serviceType || undefined
  };
  setImageGenStatus(status);

  const PARALLEL = useAI ? 1 : 3; // IA: 1 por vez (rate limit), Fallback: 3
  const DELAY_MS = useAI ? 3000 : 200; // Delay entre requests

  for (let i = 0; i < postIds.length; i += PARALLEL) {
    if (!getImageGenStatus()?.running) break; // Allow cancellation
    
    const chunk = postIds.slice(i, i + PARALLEL);
    
    const promises = chunk.map(async (postId) => {
      try {
        const post = await prisma.blogPost.findUnique({
          where: { id: postId },
          select: { id: true, title: true, briefTitle: true, briefKeywords: true, serviceType: true, excerpt: true, featuredImage: true }
        });
        if (!post) {
          status.failed++;
          status.errors.push(`Post ${postId} não encontrado`);
          return;
        }

        status.currentPost = post.briefTitle || post.title || postId;

        // Pular se já tem imagem
        if (post.featuredImage && !post.featuredImage.includes('blog-default')) {
          status.succeeded++;
          return;
        }

        let imageUrl: string | null = null;

        if (useAI) {
          const prompt = buildImagePrompt(post as any);
          const aiDataUri = await generateImageWithAI(prompt);
          if (aiDataUri) {
            const s3Url = await uploadBase64ToS3(aiDataUri, post.id);
            if (s3Url) imageUrl = s3Url;
          }
        }

        // Fallback se IA falhou ou não está habilitada
        if (!imageUrl) {
          const searchText = `${post.serviceType || ''} ${post.briefTitle || ''} ${post.title || ''} ${(post.briefKeywords || []).join(' ')}`;
          imageUrl = await selectFallbackImage(searchText, post.featuredImage ? [post.featuredImage] : []);
        }

        if (imageUrl) {
          await prisma.blogPost.update({
            where: { id: postId },
            data: { featuredImage: imageUrl }
          });
          status.succeeded++;
        } else {
          status.failed++;
          status.errors.push(`${post.briefTitle || post.title}: Nenhuma imagem gerada`);
        }
      } catch (error: any) {
        status.failed++;
        status.errors.push(`${postId}: ${error.message}`);
      }
    });

    await Promise.allSettled(promises);
    status.processed = status.succeeded + status.failed;
    
    // Delay entre lotes
    if (i + PARALLEL < postIds.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  status.running = false;
  status.finishedAt = new Date().toISOString();
  status.currentPost = '';
  console.log(`[BG-IMAGES] Concluído: ${status.succeeded} sucesso, ${status.failed} falhas de ${status.total} total`);
}

// ============================================================
// POST: Iniciar geração em background
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Se já está rodando, retornar status
    if (getImageGenStatus()?.running) {
      return NextResponse.json({
        message: "Processo já em andamento",
        status: getImageGenStatus()
      }, { status: 409 });
    }

    const body = await request.json();
    const { postIds, useAI = false, filter } = body;

    let targetPostIds: string[] = [];

    if (postIds && Array.isArray(postIds) && postIds.length > 0) {
      targetPostIds = postIds;
    } else if (filter) {
      // Buscar posts sem imagem ou com imagem padrão
      const where: any = {};
      if (filter.status) where.status = filter.status;
      if (filter.serviceType) where.serviceType = filter.serviceType;
      
      // Posts sem imagem adequada
      where.OR = [
        { featuredImage: null },
        { featuredImage: '' },
        { featuredImage: { contains: 'blog-default' } }
      ];

      const posts = await prisma.blogPost.findMany({
        where,
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: 500 // Limite de segurança
      });
      targetPostIds = posts.map(p => p.id);
    } else {
      // Padrão: todos os posts sem imagem
      const posts = await prisma.blogPost.findMany({
        where: {
          OR: [
            { featuredImage: null },
            { featuredImage: '' },
            { featuredImage: { contains: 'blog-default' } }
          ]
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: 500
      });
      targetPostIds = posts.map(p => p.id);
    }

    if (targetPostIds.length === 0) {
      return NextResponse.json({
        message: "Nenhum post precisa de imagem",
        total: 0
      });
    }

    // Iniciar processo em background (fire-and-forget)
    processImagesInBackground(targetPostIds, useAI, filter?.serviceType).catch(err => {
      console.error('[BG-IMAGES] Erro fatal:', err);
      const currentStatus = getImageGenStatus();
      if (currentStatus) {
        currentStatus.running = false;
        currentStatus.finishedAt = new Date().toISOString();
      }
    });

    return NextResponse.json({
      message: `Geração de imagens iniciada para ${targetPostIds.length} posts`,
      total: targetPostIds.length,
      useAI,
      status: getImageGenStatus()
    });
  } catch (error) {
    console.error('[BG-IMAGES] Erro:', error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// GET: Consultar status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!getImageGenStatus()) {
      return NextResponse.json({ running: false, message: "Nenhum processo em andamento" });
    }

    return NextResponse.json(getImageGenStatus());
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE: Cancelar processo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const cancelStatus = getImageGenStatus();
    if (cancelStatus?.running) {
      cancelStatus.running = false;
      return NextResponse.json({ message: "Processo cancelado" });
    }

    return NextResponse.json({ message: "Nenhum processo em andamento" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
