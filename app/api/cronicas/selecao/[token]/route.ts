export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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

// GET: Validate token and return pending articles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate token
    const selectionToken = await prisma.selectionToken.findUnique({
      where: { token }
    });

    if (!selectionToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 404 });
    }

    if (selectionToken.usedAt) {
      return NextResponse.json({ error: "Este link já foi utilizado" }, { status: 400 });
    }

    if (new Date() > selectionToken.expiresAt) {
      return NextResponse.json({ error: "Este link expirou" }, { status: 400 });
    }

    // Get ALL pending articles (sem filtro de data para não perder artigos de dias anteriores)
    const articles = await prisma.collectedArticle.findMany({
      where: {
        status: "pending"
      },
      orderBy: { collectedAt: "desc" },
      take: 100, // Máx 100 matérias conforme RN02
      include: {
        site: { select: { id: true, name: true, url: true } }
      }
    });

    return NextResponse.json({
      valid: true,
      articles,
      expiresAt: selectionToken.expiresAt
    });
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json({ error: "Erro ao validar token" }, { status: 500 });
  }
}

// POST: Process article selection, generate chronicles, and send email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    
    // Support both old format (articleIds) and new format (articles with individual scheduling)
    let articlesWithScheduling: Array<{ articleId: string; scheduledFor: string | null }> = [];
    
    if (body.articles && Array.isArray(body.articles)) {
      // New format: { articles: [{ articleId, scheduledFor }] }
      articlesWithScheduling = body.articles;
    } else if (body.articleIds && Array.isArray(body.articleIds)) {
      // Old format: { articleIds: [], scheduledFor: null }
      const globalScheduledFor = body.scheduledFor || null;
      articlesWithScheduling = body.articleIds.map((id: string) => ({
        articleId: id,
        scheduledFor: globalScheduledFor
      }));
    }

    if (articlesWithScheduling.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos uma matéria" }, { status: 400 });
    }

    const articleIds = articlesWithScheduling.map(a => a.articleId);

    // Validate token again
    const selectionToken = await prisma.selectionToken.findUnique({
      where: { token }
    });

    if (!selectionToken || selectionToken.usedAt || new Date() > selectionToken.expiresAt) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
    }

    // Mark token as used
    await prisma.selectionToken.update({
      where: { token },
      data: { usedAt: new Date() }
    });

    // Update selected articles status
    await prisma.collectedArticle.updateMany({
      where: { id: { in: articleIds } },
      data: {
        status: "selected",
        selectedAt: new Date()
      }
    });

    // Get selected articles for chronicle generation
    const selectedArticles = await prisma.collectedArticle.findMany({
      where: { id: { in: articleIds } },
      include: { site: true }
    });

    // Create a map for quick lookup of scheduling info
    const schedulingMap = new Map(
      articlesWithScheduling.map(a => [a.articleId, a.scheduledFor ? new Date(a.scheduledFor) : null])
    );

    // Get default author and categories
    const defaultAuthor = await prisma.blogAuthor.findFirst({
      where: { slug: "marcio-petito", active: true }
    });

    const categories = await prisma.blogCategory.findMany({
      where: { active: true }
    });

    // Generate chronicles for each selected article
    const generatedChronicles: any[] = [];
    const errors: string[] = [];

    for (const article of selectedArticles) {
      try {
        // Check if chronicle already exists
        const existingChronicle = await prisma.chronicle.findUnique({
          where: { articleId: article.id }
        });

        if (existingChronicle) {
          generatedChronicles.push(existingChronicle);
          continue;
        }

        // Generate chronicle content
        const prompt = CHRONICLE_PROMPT
          .replace("{{site_name}}", article.site.name)
          .replace("{{title}}", article.title)
          .replace("{{excerpt}}", article.excerpt || article.title)
          .replace("{{url}}", article.originalUrl);

        const generatedContent = await callLLM([
          { role: "system", content: "Voce e um cronista brasileiro especializado em tecnologia." },
          { role: "user", content: prompt }
        ], 1000);

        // Generate title
        const generatedTitle = (await callLLM([
          { role: "user", content: `Crie um titulo criativo e chamativo (max 80 caracteres) para esta cronica:\n\n${generatedContent}\n\nResponda apenas com o titulo, sem aspas.` }
        ], 100))?.trim() || article.title;

        // Suggest category based on keywords
        let suggestedCategory = categories.find(c => c.slug === "tecnologia") || categories[0];
        const contentLower = (article.title + " " + (article.excerpt || "")).toLowerCase();
        
        if (contentLower.includes("segurança") || contentLower.includes("cyber") || contentLower.includes("ataque")) {
          suggestedCategory = categories.find(c => c.slug === "seguranca") || suggestedCategory;
        } else if (contentLower.includes("cloud") || contentLower.includes("nuvem")) {
          suggestedCategory = categories.find(c => c.slug === "cloud") || suggestedCategory;
        } else if (contentLower.includes("ia") || contentLower.includes("inteligência artificial")) {
          suggestedCategory = categories.find(c => c.slug === "inovacao") || suggestedCategory;
        }

        // Get individual scheduling for this article
        const articleScheduledFor = schedulingMap.get(article.id) || null;

        // Create chronicle
        const chronicle = await prisma.chronicle.create({
          data: {
            articleId: article.id,
            title: generatedTitle,
            content: generatedContent,
            featuredImage: article.imageUrl,
            sourceReference: `Segundo ${article.site.name}`,
            status: "pending_review",
            categoryId: suggestedCategory?.id,
            authorId: defaultAuthor?.id,
            scheduledFor: articleScheduledFor
          },
          include: {
            article: { include: { site: true } },
            category: true,
            author: true
          }
        });

        // Update article status to converted
        await prisma.collectedArticle.update({
          where: { id: article.id },
          data: { status: "converted" }
        });

        generatedChronicles.push(chronicle);
      } catch (err: any) {
        console.error(`Error generating chronicle for article ${article.id}:`, err);
        errors.push(`${article.title}: ${err.message}`);
      }
    }

    // Send email with generated chronicles
    if (generatedChronicles.length > 0) {
      await sendChroniclesEmail(generatedChronicles);
    }

    return NextResponse.json({
      success: true,
      selectedCount: articleIds.length,
      generatedCount: generatedChronicles.length,
      chronicles: generatedChronicles,
      errors: errors.length > 0 ? errors : undefined,
      message: `${generatedChronicles.length} cronica(s) gerada(s) com sucesso! Um email foi enviado para aprovacao.`
    });
  } catch (error: any) {
    console.error("Error processing selection:", error);
    return NextResponse.json({ error: "Erro ao processar selecao" }, { status: 500 });
  }
}

// Helper function to send email with generated chronicles
async function sendChroniclesEmail(chronicles: any[]) {
  try {
    const recipients = await prisma.chronicleRecipient.findMany({
      where: { active: true }
    });

    if (recipients.length === 0) {
      console.log("No active recipients to send email");
      return;
    }

    // Generate approval token (valid for 7 days)
    const crypto = await import("crypto");
    const approvalToken = crypto.randomBytes(32).toString("hex");
    
    await prisma.approvalToken.create({
      data: {
        token: approvalToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      }
    });

    // Função para limpar artefatos de markdown
    const cleanContent = (content: string): string => {
      return content
        .replace(/```html\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    };

    const chroniclesHtml = chronicles.map((chronicle, index) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: bold; color: #1e40af; font-size: 16px; margin-bottom: 8px;">
            ${index + 1}. ${chronicle.title}
          </div>
          <div style="color: #666; font-size: 14px; margin-bottom: 10px;">
            ${cleanContent(chronicle.content).substring(0, 300)}...
          </div>
          <div style="font-size: 12px; color: #888;">
            Fonte: ${chronicle.article?.site?.name || 'N/A'} | 
            Categoria: ${chronicle.category?.name || 'N/A'}
          </div>
        </td>
      </tr>
    `).join("");

    // Link público para aprovação (sem necessidade de login)
    const baseUrl = getSiteUrl();
    const approvalUrl = `${baseUrl}/cronicas/aprovacao/${approvalToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Cronicas Geradas para Aprovacao</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p style="color: #333; font-size: 16px;">
            Ola!<br><br>
            <strong>${chronicles.length} cronica(s)</strong> foram geradas automaticamente e estao aguardando sua aprovacao.
          </p>
          
          <h3 style="color: #059669; margin-top: 20px;">Cronicas Geradas:</h3>
          
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${chroniclesHtml}
          </table>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${approvalUrl}" 
               style="display: inline-block; background-color: #059669; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Revisar e Aprovar Cronicas
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
            Este link e valido por 7 dias. Clique no botao acima para revisar e aprovar as cronicas.
          </p>
        </div>
        
        <div style="background: #1e40af; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 12px;">
            M3Solutions - Sistema de Cronicas Automatizadas
          </p>
        </div>
      </div>
    `;

    // Send to all recipients
    for (const recipient of recipients) {
      try {
        const result = await sendEmail({
          to: recipient.email,
          subject: `${chronicles.length} Cronicas Aguardando Aprovacao`,
          html: emailHtml,
        });

        if (result.success) {
          console.log(`Email sent to ${recipient.email}`);
        } else {
          console.error(`Failed to send email to ${recipient.email}:`, result.error);
        }
      } catch (err) {
        console.error(`Error sending email to ${recipient.email}:`, err);
      }
    }
  } catch (error) {
    console.error("Error sending chronicles email:", error);
  }
}