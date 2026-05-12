export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Upload data URI para S3 e retornar URL permanente
async function uploadBase64ToS3(dataUri: string, postId: string): Promise<string | null> {
  try {
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;

    const contentType = matches[1];
    const imageBuffer = Buffer.from(matches[2], "base64");
    
    let extension = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
    else if (contentType.includes("webp")) extension = "webp";

    const fileName = `preview-ai-${postId}-${Date.now()}.${extension}`;
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

    return `https://s3.amazonaws.com/${bucketName}/${s3Key}`;
  } catch (error) {
    console.error("Erro upload S3 preview:", error);
    return null;
  }
}

// Sistema de estilos por categoria (compacto para preview)
const STYLE_MAP: Record<string, { mood: string; palette: string; elements: string }> = {
  seguranca: { mood: "dramático, proteção", palette: "azul-escuro, ciano, vermelho alarme, dourado", elements: "escudos digitais, cadeados holográficos, firewalls, circuitos" },
  cloud: { mood: "clean, aéreo, expansivo", palette: "gradientes de céu, azul claro→médio, lavanda, menta", elements: "nuvens geométricas, conexões flutuantes, fluxos de dados" },
  gestao: { mood: "organizado, estratégico", palette: "azul corporativo, cinza, verde sucesso, laranja", elements: "dashboards, gráficos 3D, mãos em telas, escritório moderno" },
  suporte: { mood: "acolhedor, eficiente", palette: "verde, azul confiança, branco, amarelo", elements: "headsets, NOC, monitores, indicadores de status" },
  infraestrutura: { mood: "robusto, imponente", palette: "cinza aço, azul industrial, ciano, laranja", elements: "racks de servidores, datacenter, fibra óptica" },
  transformacao: { mood: "inovador, futurista", palette: "roxo→azul, rosa, dourado, fundo escuro", elements: "IA, redes neurais, metamorfose digital, partículas" },
  default: { mood: "profissional, moderno", palette: "azul tech, cinza grafite, branco, laranja M3", elements: "interfaces digitais, conexões de rede, elementos geométricos" }
};

function detectCategoryPreview(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('segurança') || t.includes('firewall') || t.includes('cyber') || t.includes('phishing') || t.includes('ransomware') || t.includes('malware') || t.includes('bitdefender') || t.includes('proteção')) return 'seguranca';
  if (t.includes('cloud') || t.includes('nuvem') || t.includes('backup') || t.includes('azure') || t.includes('aws') || t.includes('multicloud')) return 'cloud';
  if (t.includes('gestão') || t.includes('monitoramento') || t.includes('dashboard') || t.includes('compliance') || t.includes('governança')) return 'gestao';
  if (t.includes('suporte') || t.includes('help desk') || t.includes('noc') || t.includes('24x7') || t.includes('service desk')) return 'suporte';
  if (t.includes('servidor') || t.includes('infraestrutura') || t.includes('datacenter') || t.includes('rede') || t.includes('windows server') || t.includes('vmware')) return 'infraestrutura';
  if (t.includes('transformação') || t.includes('inteligência artificial') || t.includes(' ia ') || t.includes('chatgpt') || t.includes('copilot') || t.includes('automação') || t.includes('inovação')) return 'transformacao';
  return 'default';
}

function buildPreviewPrompt(post: { briefTitle: string | null; title: string | null; briefKeywords: string[] | null; serviceType: string | null; excerpt?: string | null }): string {
  const title = post.briefTitle || post.title || "Tecnologia da Informação";
  const keywords = (post.briefKeywords || []).join(", ");
  const service = post.serviceType || "";
  const excerpt = post.excerpt || "";
  const ctx = `${title} ${service} ${keywords} ${excerpt}`;
  const cat = detectCategoryPreview(ctx);
  const s = STYLE_MAP[cat];

  return `Crie uma fotografia editorial de alta qualidade para o artigo "${title}" de um blog corporativo de TI.
${service ? `Área: ${service}` : ""}${keywords ? ` | Temas: ${keywords}` : ""}${excerpt ? `\nResumo: ${excerpt.substring(0, 150)}` : ""}

ESTILO: ${s.mood} | CORES: ${s.palette}
ELEMENTOS: ${s.elements}
- Pode incluir figuras humanas de costas ou mãos interagindo com tecnologia
- PROIBIDO: texto, letras, palavras, logotipos na imagem
- Deixar espaço negativo no terço inferior para sobreposição de título
- Proporção 16:9, iluminação cinematográfica, profundidade de campo, qualidade fotorrealista editorial
- Otimizada para redes sociais (LinkedIn, Instagram) e banner de blog`;
}

// Gerar imagem via RouteLLM API
async function generateImageWithAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-11-20",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image"]
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const message = data?.choices?.[0]?.message;

    // Verificar campo "images" (formato principal da resposta RouteLLM)
    const images = message?.images;
    if (images && Array.isArray(images)) {
      for (const block of images) {
        if (block.type === "image_url" && block.image_url?.url) {
          return block.image_url.url;
        }
      }
    }

    // Fallback: verificar campo "content" (formato alternativo)
    const content = message?.content;
    if (content && Array.isArray(content)) {
      for (const block of content) {
        if (block.type === "image_url" && block.image_url?.url) {
          return block.image_url.url;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
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

    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { briefTitle: true, title: true, briefKeywords: true, serviceType: true, excerpt: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    const prompt = buildPreviewPrompt(post);

    const aiDataUri = await generateImageWithAI(prompt);

    if (aiDataUri) {
      // Upload para S3 para evitar enviar base64 gigante ao frontend
      const s3Url = await uploadBase64ToS3(aiDataUri, id);
      if (s3Url) {
        return NextResponse.json({
          success: true,
          previewUrl: s3Url,
          isFallback: false,
          isAIGenerated: true,
          message: "Imagem gerada por IA",
          cost: 0
        });
      }
    }

    // Fallback: imagem local
    return NextResponse.json({
      success: true,
      previewUrl: "/images/blog-default.jpg",
      isFallback: true,
      isAIGenerated: false,
      message: "Usando imagem padrão (IA indisponível)",
      cost: 0
    });
  } catch (error: any) {
    console.error("Error generating preview:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
