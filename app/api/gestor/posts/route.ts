export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { createBriefingSchema, postsQuerySchema } from "@/lib/validation-schemas";

import { generateSlug } from "@/lib/slug";

export async function GET(request: NextRequest) {
  try {
    // Check rate limit (100 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`posts-list-${ip}`, 100, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      status: searchParams.get("status") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      authorId: searchParams.get("authorId") || undefined,
      search: searchParams.get("search") || undefined,
      deleted: searchParams.get("deleted") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    };

    // Parse and validate query parameters
    const validatedQuery = postsQuerySchema.parse(queryParams);

    const where: any = {};
    if (validatedQuery.status) where.status = validatedQuery.status;
    if (validatedQuery.categoryId) where.categoryId = validatedQuery.categoryId;
    if (validatedQuery.authorId) where.authorId = validatedQuery.authorId;
    
    // Item 7: Text search across title and briefTitle
    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search, mode: "insensitive" } },
        { briefTitle: { contains: validatedQuery.search, mode: "insensitive" } }
      ];
    }
    
    // Item 12: Soft delete filter - by default exclude deleted posts
    if (validatedQuery.deleted === "true") {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: validatedQuery.limit,
        include: {
          category: true,
          author: true,
          tags: { include: { tag: true } }
        }
      }),
      prisma.blogPost.count({ where })
    ]);

    return NextResponse.json({
      data: posts,
      pagination: {
        total,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        pages: Math.ceil(total / validatedQuery.limit)
      }
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit (30 requests per minute for post creation - increased for bulk operations)
    const ip = getClientIP(request);
    if (!checkRateLimit(`posts-create-${ip}`, 30, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Validate request body with Zod schema
    const validatedData = await validateRequest(request, createBriefingSchema);

    // Destruture validated data with type safety
    const {
      briefTitle,
      briefPersona,
      briefCta,
      briefKeywords = [],
      briefNotes,
      categoryId,
      authorId,
      scheduledAt,
      serviceType,
      brand,
      attendanceType,
      pageObjective,
      mainKeyword,
      secondaryKeywords = [],
      geoCountry,
      geoState,
      geoCity,
      geoNeighborhood,
      seoLevel,
      seoLevelJustification,
      seoRecommendedUrl
    } = validatedData as any;

    // Usar URL recomendada pelo motor SEO ou gerar slug padrão
    let slug = seoRecommendedUrl 
      ? seoRecommendedUrl.replace(/^\//, '') // Remove barra inicial
      : generateSlug(briefTitle);
    
    // Check if slug exists and make unique if needed
    const existingPost = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        title: briefTitle,
        slug,
        briefTitle,
        briefPersona: briefPersona || null,
        briefCta: briefCta || null,
        briefKeywords: Array.isArray(briefKeywords) ? briefKeywords : [],
        briefNotes: briefNotes || null,
        categoryId: categoryId || null,
        authorId: authorId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: "BRIEFING",
        createdById: (session.user as any).id,
        
        // Campos de SEO Local
        serviceType: serviceType || null,
        brand: brand || null,
        attendanceType: attendanceType || null,
        pageObjective: pageObjective || null,
        mainKeyword: mainKeyword || null,
        secondaryKeywords: Array.isArray(secondaryKeywords) ? secondaryKeywords : [],
        geoCountry: geoCountry || null,
        geoState: geoState || null,
        geoCity: geoCity || null,
        geoNeighborhood: geoNeighborhood || null,
        seoLevel: seoLevel || null,
        seoLevelJustification: seoLevelJustification || null,
        seoRecommendedUrl: seoRecommendedUrl || null
      },
      include: {
        category: true,
        author: true
      }
    });

    // Log audit com informações de SEO Local
    const seoInfo = seoLevel ? ` | Nível SEO: ${seoLevel}` : '';
    const geoInfo = geoCity ? ` | Cidade: ${geoCity}` : geoState ? ` | Estado: ${geoState}` : '';
    
    await prisma.auditLog.create({
      data: {
        action: "POST_CREATED",
        entityType: "BlogPost",
        entityId: post.id,
        details: `Pauta criada: ${briefTitle}${seoInfo}${geoInfo}`,
        userId: (session.user as any).id
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
