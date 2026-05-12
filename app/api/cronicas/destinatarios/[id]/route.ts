export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipient = await prisma.chronicleRecipient.findUnique({
      where: { id }
    });

    if (!recipient) {
      return NextResponse.json({ error: "Destinatário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(recipient);
  } catch (error) {
    console.error("Error fetching recipient:", error);
    return NextResponse.json({ error: "Erro ao buscar destinatário" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { name, email, active } = await request.json();

    // Check if email already exists (excluding current)
    if (email) {
      const existing = await prisma.chronicleRecipient.findFirst({
        where: { email, NOT: { id } }
      });
      if (existing) {
        return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 400 });
      }
    }

    const recipient = await prisma.chronicleRecipient.update({
      where: { id },
      data: { name, email, active }
    });

    return NextResponse.json(recipient);
  } catch (error) {
    console.error("Error updating recipient:", error);
    return NextResponse.json({ error: "Erro ao atualizar destinatário" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.chronicleRecipient.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recipient:", error);
    return NextResponse.json({ error: "Erro ao excluir destinatário" }, { status: 500 });
  }
}
