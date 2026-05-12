export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { updateTagSchema } from "@/lib/validation-schemas";

// Normalizar string para slug
function normalizeSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GET - Buscar tag específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit (100 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`tags-get-${ip}`, 100, 60000)) {
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
      return NextResponse.json({ error: "ID de tag inválido" }, { status: 400 });
    }

    const tag = await prisma.blogTag.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                serviceType: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT - Atualizar tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit (20 updates per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`tags-update-${ip}`, 20, 60000)) {
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
      return NextResponse.json({ error: "ID de tag inválido" }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate with Zod
    try {
      updateTagSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: "Dados de tag inválidos" },
        { status: 400 }
      );
    }

    const { name, categoryIds } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Nome da tag é obrigatório" }, { status: 400 });
    }

    // Validar categorias obrigatórias
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos uma categoria" }, { status: 400 });
    }

    const slug = normalizeSlug(name);
    
    // Verificar se já existe outra tag com o mesmo slug
    const existing = await prisma.blogTag.findFirst({
      where: { 
        slug,
        NOT: { id }
      }
    });
    
    if (existing) {
      return NextResponse.json({ error: "Já existe outra tag com este nome" }, { status: 409 });
    }

    // Remover categorias existentes
    await prisma.blogCategoryTag.deleteMany({
      where: { tagId: id }
    });

    // Atualizar tag e adicionar novas categorias
    const tag = await prisma.blogTag.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        categories: {
          create: categoryIds.map((categoryId: string) => ({ categoryId }))
        }
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true, color: true }
            }
          }
        }
      }
    });

    return NextResponse.json(tag);
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE - Excluir tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit (5 deletes per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`tags-delete-one-${ip}`, 5, 60000)) {
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
      return NextResponse.json({ error: "ID de tag inválido" }, { status: 400 });
    }

    // Primeiro remover relações com posts
    await prisma.blogPostTag.deleteMany({
      where: { tagId: id }
    });

    // Remover relações com categorias
    await prisma.blogCategoryTag.deleteMany({
      where: { tagId: id }
    });

    // Depois remover a tag
    await prisma.blogTag.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
