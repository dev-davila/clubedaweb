export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

async function callLLM(messages: { role: string; content: string }[], maxTokens = 1000) {
  const response = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

const CHRONICLE_PROMPT = `Você é um cronista especializado em tecnologia e negócios.
Sua tarefa é criar uma CRÔNICA CURTA (100-200 palavras) baseada na matéria fornecida.

REGRAS OBRIGATÓRIAS:
1. A crônica deve ter entre 100 e 200 palavras
2. SEMPRE comece referenciando a fonte: "Segundo o [NOME_DO_SITE]..." ou "De acordo com o [NOME_DO_SITE]..."
3. Não copie o texto original, reinterprete com sua análise
4. Use tom conversacional e envolvente
5. Inclua uma reflexão ou opinião sobre o tema
6. Termine com uma pergunta ou call-to-action curto

DADOS DA MATÉRIA:
Site: {{site_name}}
Título: {{title}}
Resumo: {{excerpt}}
URL Original: {{url}}

IMPORTANTE: Responda APENAS com o conteúdo HTML formatado (use <p>, <strong>, <em> etc).
NÃO inclua blocos de código markdown como \`\`\`html ou \`\`\`.
Comece diretamente com a tag <p>.`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { articleId, publishToSocial, socialPlatforms } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: "ID da matéria é obrigatório" }, { status: 400 });
    }

    // Get article
    const article = await prisma.collectedArticle.findUnique({
      where: { id: articleId },
      include: { site: true }
    });

    if (!article) {
      return NextResponse.json({ error: "Matéria não encontrada" }, { status: 404 });
    }

    // Check if chronicle already exists
    const existingChronicle = await prisma.chronicle.findUnique({
      where: { articleId }
    });

    if (existingChronicle) {
      return NextResponse.json({ 
        error: "Já existe uma crônica para esta matéria",
        chronicleId: existingChronicle.id
      }, { status: 400 });
    }

    // Get default author (Marcio Petito)
    const defaultAuthor = await prisma.blogAuthor.findFirst({
      where: { slug: "marcio-petito", active: true }
    });

    // Get suggested category based on content
    const categories = await prisma.blogCategory.findMany({
      where: { active: true }
    });

    // Generate chronicle using AI
    const prompt = CHRONICLE_PROMPT
      .replace("{{site_name}}", article.site.name)
      .replace("{{title}}", article.title)
      .replace("{{excerpt}}", article.excerpt || article.title)
      .replace("{{url}}", article.originalUrl);

    const generatedContent = await callLLM([
      { role: "system", content: "Você é um cronista brasileiro especializado em tecnologia." },
      { role: "user", content: prompt }
    ], 1000);

    // Generate title
    const generatedTitle = (await callLLM([
      { role: "user", content: `Crie um título criativo e chamativo (máx 80 caracteres) para esta crônica:\n\n${generatedContent}\n\nResponda apenas com o título, sem aspas.` }
    ], 100))?.trim() || article.title;

    // Suggest category based on keywords
    let suggestedCategory = categories.find(c => c.slug === "tecnologia") || categories[0];
    const contentLower = (article.title + " " + (article.excerpt || "")).toLowerCase();
    
    if (contentLower.includes("segurança") || contentLower.includes("cyber") || contentLower.includes("ataque")) {
      suggestedCategory = categories.find(c => c.slug === "seguranca") || suggestedCategory;
    } else if (contentLower.includes("cloud") || contentLower.includes("nuvem")) {
      suggestedCategory = categories.find(c => c.slug === "cloud") || suggestedCategory;
    } else if (contentLower.includes("ia") || contentLower.includes("inteligência artificial") || contentLower.includes("machine learning")) {
      suggestedCategory = categories.find(c => c.slug === "inovacao") || suggestedCategory;
    }

    // Create chronicle
    const chronicle = await prisma.chronicle.create({
      data: {
        articleId,
        title: generatedTitle,
        content: generatedContent,
        featuredImage: article.imageUrl,
        sourceReference: `Segundo ${article.site.name}`,
        status: "pending_review",
        categoryId: suggestedCategory?.id,
        authorId: defaultAuthor?.id,
        publishToSocial: publishToSocial || false,
        socialPlatforms: socialPlatforms || []
      },
      include: {
        article: { include: { site: true } },
        category: true,
        author: true
      }
    });

    // Update article status
    await prisma.collectedArticle.update({
      where: { id: articleId },
      data: { status: "converted" }
    });

    return NextResponse.json({
      success: true,
      chronicle,
      message: "Crônica gerada com sucesso!"
    });
  } catch (error: any) {
    console.error("Error generating chronicle:", error);
    return NextResponse.json({ 
      error: "Erro ao gerar crônica",
      details: error.message 
    }, { status: 500 });
  }
}
