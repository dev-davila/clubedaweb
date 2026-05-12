import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { publishToAllSocialMedia, updateChronicleWithSocialUrls } from "@/lib/social-publish";

export const dynamic = "force-dynamic";

function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.replace("Bearer ", "");
  return provided === secret || provided === process.env.ABACUSAI_API_KEY;
}

// POST: Publish scheduled posts that are due
export async function POST(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Find scheduled posts that are due
    const now = new Date();
    const duePostsData = await prisma.blogPost.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: now
        }
      },
      include: {
        category: true,
        author: true
      }
    });

    if (duePostsData.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Nenhum post agendado para publicar", 
        publishedCount: 0 
      });
    }

    // Publish each post
    const publishedPosts: string[] = [];
    const socialPublished: string[] = [];
    const errors: string[] = [];

    for (const post of duePostsData) {
      try {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date()
          }
        });
        publishedPosts.push(post.title);
        console.log(`Published scheduled post: ${post.title}`);

        // Verificar se este post veio de uma crônica com publishToSocial = true
        const chronicle = await prisma.chronicle.findFirst({
          where: { 
            blogPostId: post.id,
            publishToSocial: true
          },
          include: { category: true }
        });

        if (chronicle) {
          try {
            const socialResults = await publishToAllSocialMedia({
              blogPostId: post.id,
              title: post.title,
              excerpt: post.excerpt || "",
              slug: post.slug,
              featuredImage: post.featuredImage,
              categoryName: post.category?.name,
              keywords: []
            });

            await updateChronicleWithSocialUrls(chronicle.id, socialResults);
            
            const successCount = socialResults.filter(r => r.success).length;
            if (successCount > 0) {
              socialPublished.push(`${post.title} (${successCount} redes)`);
            }

            // Enviar notificação por email sobre publicação social
            try {
              const appUrl = getSiteUrl();
              const successPlatforms = socialResults.filter(r => r.success);
              const failPlatforms = socialResults.filter(r => !r.success);
              const icons: Record<string, string> = { instagram: "📸", facebook: "📘", linkedin: "💼", twitter: "🐦" };
              
              let emailSubject = "";
              let emailBody = "";
              
              if (successPlatforms.length > 0 && failPlatforms.length === 0) {
                emailSubject = `✅ Crônica agendada publicada nas redes sociais`;
                emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#16a34a">✅ Publicação agendada realizada!</h2><p><strong>Crônica:</strong> ${post.title}</p><p><strong>Publicado em:</strong></p><ul>${successPlatforms.map(r => `<li>${icons[r.platform]||"📱"} <strong>${r.platform}</strong>${r.postUrl?` — <a href="${r.postUrl}">Ver post</a>`:""}</li>`).join("")}</ul><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="font-size:12px;color:#6b7280">Notificação automática - M3 Solutions</p></div>`;
              } else if (failPlatforms.length > 0) {
                emailSubject = successPlatforms.length > 0 ? `⚠️ Crônica agendada publicada parcialmente` : `❌ Falha ao publicar crônica agendada`;
                const header = successPlatforms.length > 0 ? `<h2 style="color:#ca8a04">⚠️ Publicação parcial</h2>` : `<h2 style="color:#dc2626">❌ Falha na publicação</h2>`;
                emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">${header}<p><strong>Crônica:</strong> ${post.title}</p>${successPlatforms.length > 0 ? `<p><strong>✅ Sucesso:</strong></p><ul>${successPlatforms.map(r => `<li>${icons[r.platform]||"📱"} <strong>${r.platform}</strong></li>`).join("")}</ul>` : ""}<p><strong>❌ Falhou:</strong></p><ul>${failPlatforms.map(r => `<li>${icons[r.platform]||"📱"} <strong>${r.platform}</strong>: ${r.error||"Erro"}</li>`).join("")}</ul><p>Acesse o <a href="${appUrl}/gestor/cronicas/historico">histórico</a> para tentar republicar.</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="font-size:12px;color:#6b7280">Notificação automática - M3 Solutions</p></div>`;
              }
              
              if (emailSubject) {
                await sendEmail({
                  to: "contato@m3solutions.com.br",
                  subject: emailSubject,
                  html: emailBody,
                });
              }
            } catch (emailErr) {
              console.error("Erro ao enviar notificação email social:", emailErr);
            }
          } catch (socialErr) {
            console.error(`Error publishing ${post.title} to social:`, socialErr);
          }
        }
      } catch (err: any) {
        console.error(`Error publishing post ${post.id}:`, err);
        errors.push(`${post.title}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${publishedPosts.length} post(s) publicado(s)`,
      publishedCount: publishedPosts.length,
      publishedPosts,
      socialPublished: socialPublished.length > 0 ? socialPublished : undefined,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Erro ao publicar posts agendados", details: error.message },
      { status: 500 }
    );
  }
}

// GET: Also publish scheduled posts (CRON calls via GET by default)
export async function GET(request: NextRequest) {
  return POST(request);
}