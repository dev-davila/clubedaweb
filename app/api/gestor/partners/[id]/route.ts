export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit, RateLimitError, AuthenticationError, NotFoundError } from "@/lib/api-utils";
import { updatePartnerSchema } from "@/lib/validation-schemas";

// Valida UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET - Buscar parceiro por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check rate limit (100 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`partners-get-${ip}`, 100, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar UUID
    if (!isValidUUID(params.id)) {
      throw new Error('ID de parceiro inválido');
    }

    const partner = await prisma.partner.findUnique({
      where: { id: params.id }
    });

    if (!partner) {
      throw new NotFoundError('Parceiro');
    }

    return NextResponse.json(partner);
  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT - Atualizar parceiro
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check rate limit (20 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`partners-update-${ip}`, 20, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar UUID
    if (!isValidUUID(params.id)) {
      throw new Error('ID de parceiro inválido');
    }

    // Validar requisição
    const body = await request.json();
    const validatedData = updatePartnerSchema.parse(body);

    const partner = await prisma.partner.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.logoUrl !== undefined && { logoUrl: validatedData.logoUrl }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.website !== undefined && { website: validatedData.website }),
        ...(validatedData.order !== undefined && { order: validatedData.order }),
        ...(validatedData.active !== undefined && { active: validatedData.active }),
        ...(validatedData.showOnHome !== undefined && { showOnHome: validatedData.showOnHome })
      }
    });

    return NextResponse.json(partner);
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE - Excluir parceiro
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check rate limit (5 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`partners-delete-${ip}`, 5, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar UUID
    if (!isValidUUID(params.id)) {
      throw new Error('ID de parceiro inválido');
    }

    await prisma.partner.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
