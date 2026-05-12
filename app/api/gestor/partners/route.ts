export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit, RateLimitError, AuthenticationError } from "@/lib/api-utils";
import { createPartnerSchema } from "@/lib/validation-schemas";

// GET - Listar parceiros
export async function GET(request: NextRequest) {
  try {
    // Check rate limit (100 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`partners-list-${ip}`, 100, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    const partners = await prisma.partner.findMany({
      orderBy: { order: "asc" }
    });

    return NextResponse.json(partners);
  } catch (error) {
    return handleAPIError(error);
  }
}

// POST - Criar parceiro
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (10 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`partners-create-${ip}`, 10, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar requisição
    const body = await request.json();
    const validatedData = createPartnerSchema.parse(body);

    const maxOrder = await prisma.partner.aggregate({ _max: { order: true } });

    const partner = await prisma.partner.create({
      data: {
        name: validatedData.name,
        logoUrl: validatedData.logoUrl || null,
        description: validatedData.description || null,
        website: validatedData.website || null,
        order: validatedData.order ?? ((maxOrder._max.order || 0) + 1),
        active: validatedData.active ?? true,
        showOnHome: validatedData.showOnHome ?? true
      }
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
