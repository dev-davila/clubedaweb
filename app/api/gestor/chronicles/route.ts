export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit, RateLimitError, AuthenticationError } from "@/lib/api-utils";
import { createChronicleSchema, chronicleFilterSchema } from "@/lib/validation-schemas";

// GET - Listar crônicas
export async function GET(request: NextRequest) {
  try {
    // Check rate limit (100 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`chronicles-list-${ip}`, 100, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar query parameters
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page') || '1';
    const limitParam = searchParams.get('limit') || '20';
    const statusParam = searchParams.get('status');

    const validated = chronicleFilterSchema.safeParse({
      page: parseInt(pageParam),
      limit: parseInt(limitParam),
      status: statusParam
    });

    if (!validated.success) {
      throw new Error('Parâmetros de filtro inválidos');
    }

    const { page, limit, status } = validated.data;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const chronicles = await prisma.chronicle.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        author: true,
        article: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.chronicle.count({ where });

    return NextResponse.json({
      data: chronicles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

// POST - Criar crônica
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (10 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`chronicles-create-${ip}`, 10, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar requisição
    const body = await request.json();
    const validatedData = createChronicleSchema.parse(body);

    const chronicle = await prisma.chronicle.create({
      data: {
        articleId: validatedData.articleId,
        title: validatedData.title,
        content: validatedData.content,
        featuredImage: validatedData.featuredImage,
        sourceReference: validatedData.sourceReference,
        status: validatedData.status || 'draft',
        publishToSocial: validatedData.publishToSocial || false,
        socialPlatforms: validatedData.socialPlatforms || [],
        categoryId: validatedData.categoryId,
        authorId: validatedData.authorId,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null
      },
      include: {
        category: true,
        author: true,
        article: true
      }
    });

    return NextResponse.json(chronicle, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
