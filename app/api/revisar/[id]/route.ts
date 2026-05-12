export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/constants";

// GET - Buscar dados do post para revisão pública
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token de revisão não fornecido" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, color: true } },
        author: { select: { name: true, avatar: true } },
        tags: { include: { tag: { select: { name: true } } } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    if (post.reviewToken !== token) {
      return NextResponse.json({ error: "Token de revisão inválido" }, { status: 403 });
    }

    return NextResponse.json({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      contentHtml: post.contentHtml,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      keywords: post.keywords,
      featuredImage: post.featuredImage,
      secondaryImage: post.secondaryImage,
      imageAlt: post.imageAlt,
      status: post.status,
      category: post.category,
      author: post.author,
      tags: post.tags.map((t) => t.tag.name),
      createdBy: post.createdBy,
      createdAt: post.createdAt,
      briefCta: post.briefCta,
      briefPersona: post.briefPersona,
      aiGenerated: post.aiGenerated,
    });
  } catch (error) {
    console.error("Erro ao buscar post para revisão:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Aprovar ou rejeitar post publicamente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { token, action, feedback, scheduledFor } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token de revisão não fornecido" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    if (post.reviewToken !== token) {
      return NextResponse.json({ error: "Token de revisão inválido" }, { status: 403 });
    }

    if (post.status !== "REVIEW") {
      return NextResponse.json(
        { error: `Este post já foi processado. Status atual: ${post.status}` },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const isScheduled = scheduledFor && new Date(scheduledFor) > new Date();

      const updateData: any = {
        approvedAt: new Date(),
        reviewToken: null, // Invalidar token após uso
      };

      if (isScheduled) {
        updateData.status = "SCHEDULED";
        updateData.scheduledAt = new Date(scheduledFor);
      } else {
        // Publicação imediata: publicar diretamente
        updateData.status = "PUBLISHED";
        updateData.publishedAt = new Date();
      }

      await prisma.blogPost.update({
        where: { id },
        data: updateData,
      });

      // Log
      const scheduledLabel = isScheduled
        ? ` — Agendado para ${new Date(scheduledFor).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
        : " — Publicado imediatamente";
      await prisma.auditLog.create({
        data: {
          action: "POST_APPROVE_EXTERNAL",
          entityType: "BlogPost",
          entityId: id,
          details: `Post aprovado via link de revisão externa: ${post.title}${scheduledLabel}`,
        },
      });

      // Notificar equipe
      try {
        const baseUrl = getSiteUrl();
        const postUrl = `${baseUrl}/noticias/${post.slug}`;
        const editorUrl = `${baseUrl}/gestor/posts/${id}/editar`;
        const scheduledInfo = isScheduled
          ? `<p style="margin: 10px 0;"><strong>📅 Publicação agendada para:</strong> ${new Date(scheduledFor).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>`
          : "";
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid ${isScheduled ? "#3B82F6" : "#10B981"}; padding-bottom: 10px;">
              ${isScheduled ? "📅 Post Aprovado e Agendado pelo Cliente" : "✅ Post Aprovado e Publicado"}
            </h2>
            <div style="background: ${isScheduled ? "#EFF6FF" : "#ECFDF5"}; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Título:</strong> ${post.title}</p>
              <p style="margin: 10px 0;"><strong>Aprovado em:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
              ${scheduledInfo}
            </div>
            <p style="color: #666;">${isScheduled
              ? "O post foi aprovado e agendado para publicação na data indicada."
              : "O post foi aprovado e publicado automaticamente no site."}</p>
            <div style="text-align: center; margin: 30px 0;">
              ${isScheduled
                ? `<a href="${editorUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Post no Gestor</a>`
                : `<a href="${postUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 10px;">Ver Post Publicado</a>`
              }
            </div>
          </div>
        `;
        await sendEmail({
          to: "marcio@m3solutions.com.br",
          subject: isScheduled
            ? `[Agendado] ${post.title}`
            : `[Publicado] ${post.title}`,
          html: htmlBody,
        });
      } catch (e) {
        console.error("Erro ao enviar notificação de aprovação:", e);
      }

      const message = isScheduled
        ? `Post aprovado e agendado para ${new Date(scheduledFor).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
        : "Post aprovado e publicado com sucesso!";

      return NextResponse.json({ success: true, message, scheduled: !!isScheduled });
    }

    if (action === "reject") {
      await prisma.blogPost.update({
        where: { id },
        data: {
          status: "DRAFT",
          reviewToken: null,
        },
      });

      // Log
      await prisma.auditLog.create({
        data: {
          action: "POST_REJECT_EXTERNAL",
          entityType: "BlogPost",
          entityId: id,
          details: `Post rejeitado via revisão externa: ${post.title}. Feedback: ${feedback || "Sem feedback"}`,
        },
      });

      // Notificar equipe
      try {
        const baseUrl = getSiteUrl();
        const editorUrl = `${baseUrl}/gestor/posts/${id}/editar`;
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #EF4444; padding-bottom: 10px;">
              ⚠️ Post Rejeitado pelo Cliente
            </h2>
            <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Título:</strong> ${post.title}</p>
              <p style="margin: 10px 0;"><strong>Rejeitado em:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
              ${feedback ? `<p style="margin: 10px 0;"><strong>Feedback:</strong> ${feedback}</p>` : ""}
            </div>
            <p style="color: #666;">O post foi devolvido para rascunho. Revise o conteúdo conforme o feedback e reenvie para revisão.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${editorUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Editar Post
              </a>
            </div>
          </div>
        `;
        await sendEmail({
          to: "marcio@m3solutions.com.br",
          subject: `[Rejeitado] ${post.title}`,
          html: htmlBody,
        });
      } catch (e) {
        console.error("Erro ao enviar notificação de rejeição:", e);
      }

      return NextResponse.json({ success: true, message: "Post devolvido para revisão." });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao processar ação de revisão:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}