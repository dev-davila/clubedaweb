import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { publishToAllSocialMedia, updateChronicleWithSocialUrls } from "@/lib/social-publish";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: chronicleId } = await params;
    const body = await request.json();
    const { platforms } = body; // Array opcional de plataformas específicas para republicar

    // Buscar a crônica com dados relacionados
    const chronicle = await prisma.chronicle.findUnique({
      where: { id: chronicleId },
      include: {
        article: true,
        category: true,
        blogPost: true
      }
    });

    if (!chronicle) {
      return NextResponse.json({ error: "Crônica não encontrada" }, { status: 404 });
    }

    if (!chronicle.blogPost) {
      return NextResponse.json({ error: "Crônica não possui post publicado" }, { status: 400 });
    }

    // Determinar quais plataformas republicar
    const platformsToPublish = platforms || [];
    
    // Se não especificou plataformas, republicar nas que falharam
    if (platformsToPublish.length === 0) {
      if (!chronicle.linkedinPostUrl) platformsToPublish.push("linkedin");
      if (!chronicle.twitterPostUrl) platformsToPublish.push("twitter");
      if (!chronicle.facebookPostUrl) platformsToPublish.push("facebook");
      if (!chronicle.instagramPostUrl) platformsToPublish.push("instagram");
    }

    if (platformsToPublish.length === 0) {
      return NextResponse.json({ 
        error: "Todas as redes sociais já foram publicadas",
        success: false 
      }, { status: 400 });
    }

    // Construir URL do post
    const baseUrl = getSiteUrl();
    const postUrl = `${baseUrl}/noticias/${chronicle.blogPost.slug}`;

    // Obter imagem
    const featuredImage = chronicle.featuredImage || 
                          chronicle.blogPost.featuredImage || 
                          chronicle.article?.imageUrl || 
                          null;

    // Publicar nas redes sociais especificadas
    const results = await publishToAllSocialMedia(
      {
        title: chronicle.title,
        excerpt: chronicle.content.substring(0, 200),
        featuredImage,
        categoryName: chronicle.category?.name,
        postUrl
      },
      platformsToPublish
    );

    // Atualizar URLs na crônica
    await updateChronicleWithSocialUrls(chronicleId, results);

    // Verificar resultados
    const successfulPlatforms = results.filter(r => r.success);
    const failedPlatforms = results.filter(r => !r.success);

    // Enviar notificação por email sobre o resultado da publicação
    try {
      const appUrl = getSiteUrl();
      const platformIcons: Record<string, string> = {
        instagram: "📸",
        facebook: "📘",
        linkedin: "💼",
        twitter: "🐦"
      };

      let emailSubject = "";
      let emailBody = "";

      if (successfulPlatforms.length > 0 && failedPlatforms.length === 0) {
        emailSubject = `✅ Crônica publicada com sucesso nas redes sociais`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">✅ Publicação realizada com sucesso!</h2>
            <p><strong>Crônica:</strong> ${chronicle.title}</p>
            <p><strong>Publicado em:</strong></p>
            <ul>
              ${successfulPlatforms.map(r => `<li>${platformIcons[r.platform] || "📱"} <strong>${r.platform}</strong>${r.postUrl ? ` — <a href="${r.postUrl}">Ver post</a>` : ""}</li>`).join("")}
            </ul>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">Notificação automática do sistema M3 Solutions</p>
          </div>
        `;
      } else if (successfulPlatforms.length > 0 && failedPlatforms.length > 0) {
        emailSubject = `⚠️ Crônica publicada parcialmente nas redes sociais`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ca8a04;">⚠️ Publicação parcial</h2>
            <p><strong>Crônica:</strong> ${chronicle.title}</p>
            <p><strong>✅ Sucesso:</strong></p>
            <ul>
              ${successfulPlatforms.map(r => `<li>${platformIcons[r.platform] || "📱"} <strong>${r.platform}</strong>${r.postUrl ? ` — <a href="${r.postUrl}">Ver post</a>` : ""}</li>`).join("")}
            </ul>
            <p><strong>❌ Falhou:</strong></p>
            <ul>
              ${failedPlatforms.map(r => `<li>${platformIcons[r.platform] || "📱"} <strong>${r.platform}</strong>: ${r.error || "Erro desconhecido"}</li>`).join("")}
            </ul>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">Notificação automática do sistema M3 Solutions</p>
          </div>
        `;
      } else {
        emailSubject = `❌ Falha ao publicar crônica nas redes sociais`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">❌ Falha na publicação</h2>
            <p><strong>Crônica:</strong> ${chronicle.title}</p>
            <p><strong>Erros por plataforma:</strong></p>
            <ul>
              ${failedPlatforms.map(r => `<li>${platformIcons[r.platform] || "📱"} <strong>${r.platform}</strong>: ${r.error || "Erro desconhecido"}</li>`).join("")}
            </ul>
            <p>Você pode tentar republicar acessando o <a href="${appUrl}/gestor/cronicas/historico">histórico de crônicas</a>.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">Notificação automática do sistema M3 Solutions</p>
          </div>
        `;
      }

      await sendEmail({
        to: "contato@m3solutions.com.br",
        subject: emailSubject,
        html: emailBody,
      });
    } catch (emailError) {
      console.error("Erro ao enviar notificação por email:", emailError);
    }

    return NextResponse.json({
      success: successfulPlatforms.length > 0,
      results,
      message: successfulPlatforms.length > 0
        ? `Publicado com sucesso em: ${successfulPlatforms.map(r => r.platform).join(", ")}`
        : "Falha ao publicar",
      errors: failedPlatforms.map(r => ({ platform: r.platform, error: r.error }))
    });

  } catch (error: any) {
    console.error("Error republishing to social media:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao republicar" },
      { status: 500 }
    );
  }
}