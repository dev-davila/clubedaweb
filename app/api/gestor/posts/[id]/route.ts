export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { updateBlogPostSchema } from "@/lib/validation-schemas";

import { generateSlug } from "@/lib/slug";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate UUID format
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json({ error: "ID de post inválido" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        author: true,
        tags: { include: { tag: true } },
        images: true,
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit (20 updates per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`posts-update-${ip}`, 20, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate UUID format
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json({ error: "ID de post inválido" }, { status: 400 });
    }

    // Parse and validate request body - using partial schema since it's an update
    const data = await request.json();
    
    // Validate only if fields are provided (partial validation)
    try {
      if (Object.keys(data).length > 0) {
        updateBlogPostSchema.partial().parse(data);
      }
    } catch (validationError) {
      return NextResponse.json(
        { error: "Dados de post inválidos" },
        { status: 400 }
      );
    }
    
    const existingPost = await prisma.blogPost.findUnique({ 
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        seoLevel: true,
        serviceType: true,
        categoryId: true,
        authorId: true,
        featuredImage: true,
        secondaryImage: true,
        imageAlt: true,
        briefCta: true,
        briefPersona: true,
        videoUrl: true
      }
    });
    if (!existingPost) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Update slug if title changed
    let slug = existingPost.slug;
    if (data.title && data.title !== existingPost.title) {
      slug = generateSlug(data.title);
      const slugExists = await prisma.blogPost.findFirst({
        where: { slug, id: { not: id } }
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const updateData: any = { slug };
    const allowedFields = [
      "title", "content", "contentHtml", "excerpt", "metaTitle", "metaDescription",
      "keywords", "featuredImage", "secondaryImage", "imageAlt", "videoUrl", "status", "scheduledAt", "publishedAt",
      "briefTitle", "briefPersona", "briefCta", "briefKeywords", "briefNotes",
      "categoryId", "authorId"
    ];

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        if (field === "scheduledAt" || field === "publishedAt") {
          updateData[field] = data[field] ? new Date(data[field]) : null;
        } else {
          updateData[field] = data[field];
        }
      }
    });

    // Item 11: Save version snapshot before updating (only if content or title changed)
    if (data.content || data.title) {
      try {
        await prisma.postVersion.create({
          data: {
            postId: id,
            title: existingPost.title,
            content: existingPost.content || "",
            excerpt: existingPost.excerpt || "",
            editedBy: (session.user as any).name || (session.user as any).email || "unknown"
          }
        });
      } catch (versionError) {
        console.error("[PUT] Erro ao salvar versão:", versionError);
      }
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        author: true,
        tags: { include: { tag: true } }
      }
    });

    // Se o post é GLOBAL, propagar alterações relevantes para sub-páginas regionais
    if (existingPost.seoLevel === "GLOBAL" && existingPost.serviceType) {
      // Campos que devem ser propagados para sub-páginas (estrutura comum)
      const fieldsToPropagate = [
        "categoryId", "authorId", "featuredImage", "secondaryImage", "imageAlt",
        "briefCta", "briefPersona", "videoUrl"
      ];
      
      // Construir dados de atualização apenas com campos que foram modificados e devem ser propagados
      const regionalUpdateData: any = {};
      fieldsToPropagate.forEach(field => {
        if (data[field] !== undefined && data[field] !== existingPost[field as keyof typeof existingPost]) {
          regionalUpdateData[field] = data[field];
        }
      });

      // Se há campos para propagar
      if (Object.keys(regionalUpdateData).length > 0) {
        const updateResult = await prisma.blogPost.updateMany({
          where: {
            serviceType: existingPost.serviceType,
            seoLevel: { in: ["CITY", "STATE"] },
            id: { not: id }
          },
          data: regionalUpdateData
        });

        if (updateResult.count > 0) {
          console.log(`[Update] Propagado alterações do post GLOBAL "${post.title}" para ${updateResult.count} sub-páginas regionais. Campos: ${Object.keys(regionalUpdateData).join(", ")}`);
          
          // Log audit para propagação
          await prisma.auditLog.create({
            data: {
              action: "POST_BULK_UPDATED",
              entityType: "BlogPost",
              entityId: id,
              details: `Alterações propagadas de GLOBAL para ${updateResult.count} sub-páginas regionais (${existingPost.serviceType}). Campos: ${Object.keys(regionalUpdateData).join(", ")}`,
              userId: (session.user as any).id
            }
          });
        }
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "POST_UPDATED",
        entityType: "BlogPost",
        entityId: post.id,
        details: `Post atualizado: ${post.title}`,
        userId: (session.user as any).id
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit (30 deletions per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`posts-delete-${ip}`, 30, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate UUID/CUID format
    if (!id.match(/^[a-z0-9]{20,30}$/i) && !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json({ error: "ID de post inválido" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Item 12: Soft delete - mark as deleted instead of hard delete
    await prisma.blogPost.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "POST_DELETED",
        entityType: "BlogPost",
        entityId: id,
        details: `Post movido para lixeira: ${post.title}`,
        userId: (session.user as any).id
      }
    });

    console.log(`[DELETE] Post movido para lixeira: "${post.title}" (${id})`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE] Erro ao excluir post:", error);
    return handleAPIError(error);
  }
}
