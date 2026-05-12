export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { createBlogCategorySchema, updateBlogCategorySchema } from "@/lib/validation-schemas";
import { remember, invalidate, CACHE_KEYS } from "@/lib/cache-helpers";

import { generateSlug } from "@/lib/slug";

export async function GET(request: NextRequest) {
  try {
    // Check rate limit (100 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`categories-list-${ip}`, 100, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    // Use cache-aside pattern for categories
    const categories = await remember(
      CACHE_KEYS.CATEGORIES(),
      2 * 60 * 60 * 1000, // 2 hours
      async () => {
        return await prisma.blogCategory.findMany({
          orderBy: { order: "asc" },
          include: {
            _count: { select: { posts: true } },
            authors: {
              include: { author: { select: { id: true, name: true } } }
            },
            tags: {
              include: { tag: { select: { id: true, name: true } } }
            }
          }
        });
      }
    );
    return NextResponse.json(categories);
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit (10 creates per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`categories-create-${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    
    // Validate with Zod
    let validatedData;
    try {
      validatedData = createBlogCategorySchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: "Dados de categoria inválidos" },
        { status: 400 }
      );
    }

    const { name, description, color, active } = validatedData;
    const { authorIds, tagIds } = body;

    const slug = generateSlug(name);
    const existing = await prisma.blogCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Categoria já existe" }, { status: 400 });
    }

    const maxOrder = await prisma.blogCategory.aggregate({ _max: { order: true } });

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        description,
        color: color || "#0066CC",
        order: (maxOrder._max.order || 0) + 1,
        authors: authorIds?.length ? {
          create: authorIds.map((authorId: string) => ({ authorId }))
        } : undefined,
        tags: tagIds?.length ? {
          create: tagIds.map((tagId: string) => ({ tagId }))
        } : undefined
      },
      include: {
        _count: { select: { posts: true } },
        authors: { include: { author: { select: { id: true, name: true } } } },
        tags: { include: { tag: { select: { id: true, name: true } } } }
      }
    });

    // Invalidate categories cache after creation
    invalidate(CACHE_KEYS.CATEGORIES());
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
