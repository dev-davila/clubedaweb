export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { createAuthorSchema, updateAuthorSchema } from "@/lib/validation-schemas";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    // Check rate limit (100 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`authors-list-${ip}`, 100, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const authors = await prisma.blogAuthor.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { posts: true } },
        user: { select: { id: true, name: true, email: true } },
        categories: {
          include: { category: { select: { id: true, name: true, color: true } } }
        },
        tags: {
          include: { tag: { select: { id: true, name: true } } }
        }
      }
    });
    return NextResponse.json(authors);
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit (10 creates per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`authors-create-${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate with Zod
    try {
      createAuthorSchema.parse({ name: body.name });
    } catch (error) {
      return NextResponse.json(
        { error: "Dados de autor inválidos" },
        { status: 400 }
      );
    }

    const { 
      name, bio, email, avatar, userId, categoryIds, tagIds,
      writingStyle, tone, targetAudience, contentGoals, promptTemplate, keywords, avoidTopics,
      wordCountMin, wordCountMax,
      // Campos de vídeo
      videoEnabled, videoAvatarName, videoAvatarDesc, videoAvatarStyle, videoAvatarImage,
      videoIntroScript, videoOutroScript, videoDuration, videoTone,
      videoBackground, videoCta, videoCompanyMention
    } = body;

    let slug = generateSlug(name);
    const existing = await prisma.blogAuthor.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const author = await prisma.blogAuthor.create({
      data: {
        name,
        slug,
        bio: bio || null,
        email: email || null,
        avatar: avatar || null,
        userId: userId || null,
        writingStyle,
        tone,
        targetAudience,
        contentGoals,
        promptTemplate,
        keywords,
        avoidTopics,
        wordCountMin: wordCountMin ? parseInt(wordCountMin) : null,
        wordCountMax: wordCountMax ? parseInt(wordCountMax) : null,
        // Campos de vídeo
        videoEnabled: videoEnabled || false,
        videoAvatarName,
        videoAvatarDesc,
        videoAvatarStyle,
        videoAvatarImage,
        videoIntroScript,
        videoOutroScript,
        videoDuration,
        videoTone,
        videoBackground,
        videoCta,
        videoCompanyMention,
        categories: categoryIds?.length ? {
          create: categoryIds.map((categoryId: string) => ({ categoryId }))
        } : undefined,
        tags: tagIds?.length ? {
          create: tagIds.map((tagId: string) => ({ tagId }))
        } : undefined
      },
      include: {
        _count: { select: { posts: true } },
        categories: { include: { category: { select: { id: true, name: true, color: true } } } },
        tags: { include: { tag: { select: { id: true, name: true } } } }
      }
    });

    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check rate limit (20 updates per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`authors-update-${ip}`, 20, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate with Zod
    try {
      updateAuthorSchema.parse({ name: body.name });
    } catch (error) {
      return NextResponse.json(
        { error: "Dados de autor inválidos" },
        { status: 400 }
      );
    }
    
    // Validate UUID format
    if (!body.id || !body.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json({ error: "ID de autor inválido" }, { status: 400 });
    }

    const { 
      id, name, bio, email, avatar, categoryIds, tagIds,
      writingStyle, tone, targetAudience, contentGoals, promptTemplate, keywords, avoidTopics,
      wordCountMin, wordCountMax,
      // Campos de vídeo
      videoEnabled, videoAvatarName, videoAvatarDesc, videoAvatarStyle, videoAvatarImage,
      videoIntroScript, videoOutroScript, videoDuration, videoTone,
      videoBackground, videoCta, videoCompanyMention
    } = body;

    // Update author and relationships
    await prisma.$transaction(async (tx) => {
      // Remove existing relationships
      await tx.blogCategoryAuthor.deleteMany({ where: { authorId: id } });
      await tx.blogAuthorTag.deleteMany({ where: { authorId: id } });

      // Update author
      await tx.blogAuthor.update({
        where: { id },
        data: { 
          name,
          bio: bio || null,
          email: email || null,
          avatar: avatar || null,
          writingStyle, tone, targetAudience, contentGoals, promptTemplate, keywords, avoidTopics,
          wordCountMin: wordCountMin ? parseInt(wordCountMin) : null,
          wordCountMax: wordCountMax ? parseInt(wordCountMax) : null,
          // Campos de vídeo
          videoEnabled: videoEnabled || false,
          videoAvatarName,
          videoAvatarDesc,
          videoAvatarStyle,
          videoAvatarImage,
          videoIntroScript,
          videoOutroScript,
          videoDuration,
          videoTone,
          videoBackground,
          videoCta,
          videoCompanyMention
        }
      });

      // Add new category relationships
      if (categoryIds?.length) {
        await tx.blogCategoryAuthor.createMany({
          data: categoryIds.map((categoryId: string) => ({ authorId: id, categoryId }))
        });
      }

      // Add new tag relationships
      if (tagIds?.length) {
        await tx.blogAuthorTag.createMany({
          data: tagIds.map((tagId: string) => ({ authorId: id, tagId }))
        });
      }
    });

    const author = await prisma.blogAuthor.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true } },
        categories: { include: { category: { select: { id: true, name: true, color: true } } } },
        tags: { include: { tag: { select: { id: true, name: true } } } }
      }
    });

    return NextResponse.json(author);
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check rate limit (5 deletes per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`authors-delete-${ip}`, 5, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json({ error: "ID de autor inválido" }, { status: 400 });
    }

    // Soft delete
    await prisma.blogAuthor.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
