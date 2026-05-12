export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const CATEGORIES = [
  { value: "gestao", label: "Gestão" },
  { value: "marketing", label: "Marketing" },
  { value: "materiais", label: "Materiais" },
  { value: "tecnico", label: "Técnico" },
  { value: "comercial", label: "Comercial" },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const recipients = await prisma.notificationRecipient.findMany({
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ recipients, categories: CATEGORIES });
  } catch (error) {
    console.error("Error fetching notification recipients:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, email, categories } = await req.json();
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    const cats = Array.isArray(categories) && categories.length > 0 ? categories : ["gestao"];

    const recipient = await prisma.notificationRecipient.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), categories: cats },
    });

    return NextResponse.json(recipient);
  } catch (error) {
    console.error("Error creating notification recipient:", error);
    return NextResponse.json({ error: "Erro ao criar destinatário" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id, name, email, categories, active } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (categories !== undefined) updateData.categories = Array.isArray(categories) ? categories : [categories];
    if (active !== undefined) updateData.active = active;

    const recipient = await prisma.notificationRecipient.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(recipient);
  } catch (error) {
    console.error("Error updating notification recipient:", error);
    return NextResponse.json({ error: "Erro ao atualizar destinatário" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.notificationRecipient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification recipient:", error);
    return NextResponse.json({ error: "Erro ao remover destinatário" }, { status: 500 });
  }
}
