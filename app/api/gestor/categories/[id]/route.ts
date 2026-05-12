export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { updateBlogCategorySchema } from "@/lib/validation-schemas";
import { invalidate, CACHE_KEYS } from "@/lib/cache-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit (20 updates per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`categories-update-${ip}`, 20, 60000)) {
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
      return NextResponse.json({ error: "ID de categoria inválido" }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate with Zod (partial validation for updates)
    try {
      if (Object.keys(body).length > 0) {
        updateBlogCategorySchema.partial().parse(body);
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Dados de categoria inválidos" },
        { status: 400 }
      );
    }

    const { authorIds, tagIds, ...updateData } = body;

    // Update category and relationships in transaction
    await prisma.$transaction(async (tx) => {
      // Update category data
      await tx.blogCategory.update({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description,
          color: updateData.color,
          active: updateData.active,
          order: updateData.order
        }
      });

      // Update author relationships if provided
      if (authorIds !== undefined) {
        await tx.blogCategoryAuthor.deleteMany({ where: { categoryId: id } });
        if (authorIds?.length) {
          await tx.blogCategoryAuthor.createMany({
            data: authorIds.map((authorId: string) => ({ categoryId: id, authorId }))
          });
        }
      }

      // Update tag relationships if provided
      if (tagIds !== undefined) {
        await tx.blogCategoryTag.deleteMany({ where: { categoryId: id } });
        if (tagIds?.length) {
          await tx.blogCategoryTag.createMany({
            data: tagIds.map((tagId: string) => ({ categoryId: id, tagId }))
          });
        }
      }
    });

    const category = await prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true } },
        authors: { include: { author: { select: { id: true, name: true } } } },
        tags: { include: { tag: { select: { id: true, name: true } } } }
      }
    });

    // Invalidate categories cache after update
    invalidate(CACHE_KEYS.CATEGORIES());
    
    return NextResponse.json(category);
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit (5 deletes per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`categories-delete-${ip}`, 5, 60000)) {
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
      return NextResponse.json({ error: "ID de categoria inválido" }, { status: 400 });
    }
    
    // Check if category has posts
    const postsCount = await prisma.blogPost.count({ where: { categoryId: id } });
    if (postsCount > 0) {
      return NextResponse.json(
        { error: `Categoria possui ${postsCount} posts. Remova ou mova os posts primeiro.` },
        { status: 400 }
      );
    }

    await prisma.blogCategory.delete({ where: { id } });
    
    // Invalidate categories cache after deletion
    invalidate(CACHE_KEYS.CATEGORIES());
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
