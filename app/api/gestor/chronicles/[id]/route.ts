export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit, RateLimitError, AuthenticationError, NotFoundError } from "@/lib/api-utils";
import { updateChronicleSchema } from "@/lib/validation-schemas";

// Valida UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET - Buscar crônica por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check rate limit (100 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`chronicles-get-${ip}`, 100, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar UUID
    if (!isValidUUID(params.id)) {
      throw new Error('ID de crônica inválido');
    }

    const chronicle = await prisma.chronicle.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        author: true,
        article: true
      }
    });

    if (!chronicle) {
      throw new NotFoundError('Crônica');
    }

    return NextResponse.json(chronicle);
  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT - Atualizar crônica
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check rate limit (20 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`chronicles-update-${ip}`, 20, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar UUID
    if (!isValidUUID(params.id)) {
      throw new Error('ID de crônica inválido');
    }

    // Validar requisição
    const body = await request.json();
    const validatedData = updateChronicleSchema.parse(body);

    const chronicle = await prisma.chronicle.update({
      where: { id: params.id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.content !== undefined && { content: validatedData.content }),
        ...(validatedData.featuredImage !== undefined && { featuredImage: validatedData.featuredImage }),
        ...(validatedData.sourceReference !== undefined && { sourceReference: validatedData.sourceReference }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.publishToSocial !== undefined && { publishToSocial: validatedData.publishToSocial }),
        ...(validatedData.socialPlatforms !== undefined && { socialPlatforms: validatedData.socialPlatforms }),
        ...(validatedData.categoryId !== undefined && { categoryId: validatedData.categoryId }),
        ...(validatedData.authorId !== undefined && { authorId: validatedData.authorId }),
        ...(validatedData.scheduledFor !== undefined && { scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null })
      },
      include: {
        category: true,
        author: true,
        article: true
      }
    });

    return NextResponse.json(chronicle);
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE - Excluir crônica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check rate limit (5 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`chronicles-delete-${ip}`, 5, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar UUID
    if (!isValidUUID(params.id)) {
      throw new Error('ID de crônica inválido');
    }

    await prisma.chronicle.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
