import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { publishToAllSocialMedia, updateChronicleWithSocialUrls } from "@/lib/social-publish";

export const dynamic = "force-dynamic";

// GET: Validar token e retornar crônicas pendentes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Verificar token
    const approvalToken = await prisma.approvalToken.findUnique({
      where: { token }
    });

    if (!approvalToken) {
      return NextResponse.json({ error: "Token invalido" }, { status: 404 });
    }

    if (new Date() > approvalToken.expiresAt) {
      return NextResponse.json({ error: "Token expirado" }, { status: 410 });
    }

    // Buscar crônicas pendentes
    const chronicles = await prisma.chronicle.findMany({
      where: { status: "pending_review" },
      include: {
        article: { include: { site: true } },
        category: true,
        author: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Buscar categorias
    const categories = await prisma.blogCategory.findMany({
      where: { active: true },
      orderBy: { name: "asc" }
    });

    // Verificar contas de redes sociais configuradas
    const socialAccounts = await prisma.socialMediaAccount.findMany({
      where: { isConnected: true, active: true },
      select: { platform: true, accountName: true }
    });

    return NextResponse.json({
      chronicles,
      categories,
      expiresAt: approvalToken.expiresAt,
      socialAccounts: socialAccounts.map(a => ({
        platform: a.platform,
        username: a.accountName
      }))
    });
  } catch (error: any) {
    console.error("Error validating approval token:", error);
    return NextResponse.json({ 
      error: "Erro ao validar token", 
      details: error.message 
    }, { status: 500 });
  }
}

// POST: Aprovar ou rejeitar uma crônica
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { chronicleId, action, categoryId, publishToSocial, scheduledFor } = body;

    // Verificar token
    const approvalToken = await prisma.approvalToken.findUnique({
      where: { token }
    });

    if (!approvalToken) {
      return NextResponse.json({ error: "Token invalido" }, { status: 404 });
    }

    if (new Date() > approvalToken.expiresAt) {
      return NextResponse.json({ error: "Token expirado" }, { status: 410 });
    }

    // Buscar crônica
    const chronicle = await prisma.chronicle.findUnique({
      where: { id: chronicleId },
      include: { author: true, category: true }
    });

    if (!chronicle) {
      return NextResponse.json({ error: "Cronica nao encontrada" }, { status: 404 });
    }

    if (action === "approve") {
      // Atualizar configurações e aprovar
      const updateData: any = {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: "cliente"
      };

      // Check if scheduled publication - use body scheduledFor if provided, otherwise use chronicle's
      const effectiveScheduledFor = scheduledFor || chronicle.scheduledFor;
      const isScheduled = effectiveScheduledFor && new Date(effectiveScheduledFor) > new Date();

      if (categoryId !== undefined) {
        updateData.categoryId = categoryId || null;
      }
      if (publishToSocial !== undefined) {
        updateData.publishToSocial = publishToSocial;
      }
      // Update scheduledFor if provided in approval
      if (scheduledFor) {
        updateData.scheduledFor = new Date(scheduledFor);
      }

      // Gerar slug para o post
      const slug = chronicle.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 80);

      // Verificar se slug existe
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug }
      });

      const finalSlug = existingPost 
        ? `${slug}-${Date.now().toString(36)}`
        : slug;

      // Usar imagem do artigo original se crônica não tiver
      const articleImage = await prisma.collectedArticle.findUnique({
        where: { id: chronicle.articleId },
        select: { imageUrl: true }
      });
      
      const featuredImage = chronicle.featuredImage 
        || articleImage?.imageUrl 
        || "/images/blog-default.jpg";

      // Flag para gerar imagem em background depois de criar o post
      const needsImageGeneration = !featuredImage || featuredImage === "/images/blog-default.jpg";

      // Limpar conteúdo de artefatos markdown
      const cleanContent = (text: string): string => {
        return text
          .replace(/```html\s*/gi, '')
          .replace(/```\s*/gi, '')
          .trim();
      };

      const cleanedContent = cleanContent(chronicle.content);

      // Criar post no blog (SCHEDULED ou PUBLISHED)
      const blogPost = await prisma.blogPost.create({
        data: {
          title: chronicle.title,
          slug: finalSlug,
          content: cleanedContent,
          excerpt: cleanedContent.replace(/<[^>]*>/g, "").substring(0, 200) + "...",
          featuredImage,
          status: isScheduled ? "SCHEDULED" : "PUBLISHED",
          publishedAt: isScheduled ? null : new Date(),
          scheduledAt: isScheduled ? new Date(effectiveScheduledFor) : null,
          categoryId: categoryId || chronicle.categoryId,
          authorId: chronicle.authorId
        }
      });

      // Atualizar crônica
      await prisma.chronicle.update({
        where: { id: chronicleId },
        data: {
          ...updateData,
          blogPostId: blogPost.id
        }
      });

      // Gerar imagem em background se não tiver imagem adequada
      if (needsImageGeneration) {
        try {
          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
          fetch(`${baseUrl}/api/gestor/posts/generate-images-batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postIds: [blogPost.id], useAI: false })
          }).then(res => {
            console.log(`[APROVACAO-TOKEN] Geração de imagem disparada para "${chronicle.title}" - status: ${res.status}`);
          }).catch(err => {
            console.error("[APROVACAO-TOKEN] Erro ao disparar geração de imagem:", err);
          });
        } catch (imgErr) {
          console.error("[APROVACAO-TOKEN] Erro ao disparar geração de imagem:", imgErr);
        }
      }

      // Se marcou para publicar nas redes sociais e não é agendado, publicar agora
      let socialResults: any[] = [];
      if (publishToSocial && !isScheduled) {
        try {
          // Buscar categoria para nome
          const category = categoryId 
            ? await prisma.blogCategory.findUnique({ where: { id: categoryId } })
            : chronicle.category;

          socialResults = await publishToAllSocialMedia({
            blogPostId: blogPost.id,
            title: chronicle.title,
            excerpt: cleanedContent.replace(/<[^>]*>/g, "").substring(0, 200),
            slug: finalSlug,
            featuredImage,
            categoryName: category?.name,
            keywords: []
          });

          // Atualizar crônica com URLs das publicações
          await updateChronicleWithSocialUrls(chronicleId, socialResults);

          // Enviar notificação por email sobre resultado da publicação social
          try {
            const appUrl = getSiteUrl();
            const successPlatforms = socialResults.filter((r: any) => r.success);
            const failPlatforms = socialResults.filter((r: any) => !r.success);
            const platformIcons: Record<string, string> = { instagram: "📸", facebook: "📘", linkedin: "💼", twitter: "🐦" };
            
            let emailSubject = "";
            let emailBody = "";
            
            if (successPlatforms.length > 0 && failPlatforms.length === 0) {
              emailSubject = `✅ Crônica publicada com sucesso nas redes sociais`;
              emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#16a34a">✅ Publicação realizada com sucesso!</h2><p><strong>Crônica:</strong> ${chronicle.title}</p><p><strong>Publicado em:</strong></p><ul>${successPlatforms.map((r: any) => `<li>${platformIcons[r.platform]||"📱"} <strong>${r.platform}</strong>${r.postUrl?` — <a href="${r.postUrl}">Ver post</a>`:""}</li>`).join("")}</ul><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="font-size:12px;color:#6b7280">Notificação automática - M3 Solutions</p></div>`;
            } else if (successPlatforms.length > 0) {
              emailSubject = `⚠️ Crônica publicada parcialmente nas redes sociais`;
              emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#ca8a04">⚠️ Publicação parcial</h2><p><strong>Crônica:</strong> ${chronicle.title}</p><p><strong>✅ Sucesso:</strong></p><ul>${successPlatforms.map((r: any) => `<li>${platformIcons[r.platform]||"📱"} <strong>${r.platform}</strong>${r.postUrl?` — <a href="${r.postUrl}">Ver post</a>`:""}</li>`).join("")}</ul><p><strong>❌ Falhou:</strong></p><ul>${failPlatforms.map((r: any) => `<li>${platformIcons[r.platform]||"📱"} <strong>${r.platform}</strong>: ${r.error||"Erro desconhecido"}</li>`).join("")}</ul><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="font-size:12px;color:#6b7280">Notificação automática - M3 Solutions</p></div>`;
            } else if (failPlatforms.length > 0) {
              emailSubject = `❌ Falha ao publicar crônica nas redes sociais`;
              emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#dc2626">❌ Falha na publicação</h2><p><strong>Crônica:</strong> ${chronicle.title}</p><p><strong>Erros:</strong></p><ul>${failPlatforms.map((r: any) => `<li>${platformIcons[r.platform]||"📱"} <strong>${r.platform}</strong>: ${r.error||"Erro desconhecido"}</li>`).join("")}</ul><p>Acesse o <a href="${appUrl}/gestor/cronicas/historico">histórico</a> para tentar republicar.</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="font-size:12px;color:#6b7280">Notificação automática - M3 Solutions</p></div>`;
            }

            if (emailSubject) {
              await sendEmail({
                to: "contato@m3solutions.com.br",
                subject: emailSubject,
                html: emailBody,
              });
            }
          } catch (emailError) {
            console.error("Erro ao enviar notificação email social:", emailError);
          }
        } catch (socialError) {
          console.error("Erro ao publicar nas redes sociais:", socialError);
          // Não falha a aprovação se redes sociais falharem
        }
      }

      return NextResponse.json({ 
        success: true, 
        action: "approved",
        blogPostId: blogPost.id,
        slug: finalSlug,
        scheduled: isScheduled,
        scheduledFor: isScheduled ? effectiveScheduledFor : null,
        socialMedia: socialResults
      });

    } else if (action === "reject") {
      await prisma.chronicle.update({
        where: { id: chronicleId },
        data: { status: "rejected" }
      });

      // Voltar artigo para pendente
      await prisma.collectedArticle.update({
        where: { id: chronicle.articleId },
        data: { status: "pending" }
      });

      return NextResponse.json({ success: true, action: "rejected" });

    } else if (action === "update") {
      // Atualizar configurações e/ou conteúdo
      const { title, content } = body;
      const updateData: any = {};
      
      if (categoryId !== undefined) {
        updateData.categoryId = categoryId || null;
      }
      if (publishToSocial !== undefined) {
        updateData.publishToSocial = publishToSocial;
      }
      if (title !== undefined && title.trim()) {
        updateData.title = title.trim();
      }
      if (content !== undefined && content.trim()) {
        updateData.content = content.trim();
      }

      const updated = await prisma.chronicle.update({
        where: { id: chronicleId },
        data: updateData,
        include: { category: true }
      });

      return NextResponse.json({ success: true, action: "updated", chronicle: updated });
    }

    return NextResponse.json({ error: "Acao invalida" }, { status: 400 });

  } catch (error: any) {
    console.error("Error processing approval:", error);
    return NextResponse.json({ 
      error: "Erro ao processar aprovacao", 
      details: error.message 
    }, { status: 500 });
  }
}