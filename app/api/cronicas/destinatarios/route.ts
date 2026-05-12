export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const recipients = await prisma.chronicleRecipient.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(recipients);
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return NextResponse.json({ error: "Erro ao buscar destinatários" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, email, active } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.chronicleRecipient.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 400 });
    }

    const recipient = await prisma.chronicleRecipient.create({
      data: {
        name,
        email,
        active: active !== false
      }
    });

    return NextResponse.json(recipient);
  } catch (error) {
    console.error("Error creating recipient:", error);
    return NextResponse.json({ error: "Erro ao criar destinatário" }, { status: 500 });
  }
}
