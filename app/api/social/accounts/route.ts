export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Listar todas as contas conectadas
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const accounts = await prisma.socialMediaAccount.findMany({
      where: { active: true },
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
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 });
  }
}
