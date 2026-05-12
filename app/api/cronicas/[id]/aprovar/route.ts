export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { publishToAllSocialMedia, updateChronicleWithSocialUrls } from "@/lib/social-publish";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
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
    const { publishNow, scheduledFor, publishToSocial, socialPlatforms } = await request.json();

    const chronicle = await prisma.chronicle.findUnique({
      where: { id },
      include: {
        article: { include: { site: true } },
        category: true,
        author: true
      }
    });

    if (!chronicle) {
      return NextResponse.json({ error: "Crônica não encontrada" }, { status: 404 });
    }

    // Generate unique slug
    let slug = generateSlug(chronicle.title);
    const existingPost = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    // Usar imagem do artigo original se crônica não tiver
    let featuredImage = chronicle.featuredImage 
      || chronicle.article?.imageUrl 
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

    // Create blog post
    const blogPost = await prisma.blogPost.create({
      data: {
        title: chronicle.title,
        slug,
        content: cleanedContent,
        contentHtml: cleanedContent,
        excerpt: cleanedContent.replace(/<[^>]*>/g, "").substring(0, 200) + "...",
        featuredImage,
        categoryId: chronicle.categoryId,
        authorId: chronicle.authorId,
        status: publishNow ? "PUBLISHED" : "SCHEDULED",
        publishedAt: publishNow ? new Date() : null,
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        aiGenerated: true,
        aiModel: "chronicle-generator",
        aiGeneratedAt: new Date()
      }
    });

    // Update chronicle
    const updatedChronicle = await prisma.chronicle.update({
      where: { id },
      data: {
        status: publishNow ? "published" : "scheduled",
        blogPostId: blogPost.id,
        approvedAt: new Date(),
        approvedBy: session.user?.email || "admin",
        publishedAt: publishNow ? new Date() : null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        publishToSocial: publishToSocial || false,
        socialPlatforms: socialPlatforms || []
      },
      include: {
        article: true,
        blogPost: true
      }
    });

    // Update article status
    await prisma.collectedArticle.update({
      where: { id: chronicle.articleId },
      data: { status: "converted" }
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
          console.log(`[APROVAR] Geração de imagem disparada para "${blogPost.title}" - status: ${res.status}`);
        }).catch(err => {
          console.error("[APROVAR] Erro ao disparar geração de imagem:", err);
        });
      } catch (imgErr) {
        console.error("[APROVAR] Erro ao disparar geração de imagem:", imgErr);
      }
    }

    // Publicar nas redes sociais se publishNow E publishToSocial
    let socialResults: any[] = [];
    if (publishNow && publishToSocial) {
      try {
        socialResults = await publishToAllSocialMedia(
          {
            blogPostId: blogPost.id,
            title: blogPost.title,
            excerpt: blogPost.excerpt || "",
            slug: blogPost.slug,
            featuredImage: blogPost.featuredImage,
            categoryName: chronicle.category?.name,
            keywords: [],
          },
          socialPlatforms && socialPlatforms.length > 0 ? socialPlatforms : undefined
        );

        await updateChronicleWithSocialUrls(id, socialResults);

        const successCount = socialResults.filter((r: any) => r.success).length;
        console.log(`[APROVAR] Social media: ${successCount}/${socialResults.length} sucesso para "${blogPost.title}"`);
      } catch (socialErr) {
        console.error("[APROVAR] Erro ao publicar nas redes sociais:", socialErr);
      }
    }

    return NextResponse.json({
      success: true,
      chronicle: updatedChronicle,
      blogPost,
      socialResults: socialResults.length > 0 ? socialResults : undefined,
      message: publishNow ? "Crônica publicada com sucesso!" : "Crônica agendada com sucesso!"
    });
  } catch (error) {
    console.error("Error approving chronicle:", error);
    return NextResponse.json({ error: "Erro ao aprovar crônica" }, { status: 500 });
  }
}
