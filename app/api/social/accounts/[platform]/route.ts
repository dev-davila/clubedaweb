export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Buscar conta específica
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const account = await prisma.socialMediaAccount.findFirst({
      where: { 
        platform: params.platform,
        active: true 
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        accountId: true,
        profileUrl: true,
        profileImage: true,
        autoPost: true,
        hashtagsDefault: true,
        isConnected: true,
        lastUsedAt: true,
        lastError: true,
        expiresAt: true,
        createdAt: true
      }
    });

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Erro ao buscar conta:", error);
    return NextResponse.json({ error: "Erro ao buscar conta" }, { status: 500 });
  }
}

// PATCH - Atualizar configurações da conta
export async function PATCH(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { autoPost, hashtagsDefault, postTemplate } = body;

    const account = await prisma.socialMediaAccount.updateMany({
      where: { 
        platform: params.platform,
        active: true 
      },
      data: {
        ...(autoPost !== undefined && { autoPost }),
        ...(hashtagsDefault !== undefined && { hashtagsDefault }),
        ...(postTemplate !== undefined && { postTemplate }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 });
  }
}

// DELETE - Desconectar conta
export async function DELETE(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // Soft delete - marca como inativo
    await prisma.socialMediaAccount.updateMany({
      where: { 
        platform: params.platform,
        active: true 
      },
      data: {
        active: false,
        isConnected: false,
        accessToken: "", // Limpar tokens
        refreshToken: null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao desconectar conta:", error);
    return NextResponse.json({ error: "Erro ao desconectar conta" }, { status: 500 });
  }
}
