export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET — list all tags for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tags = await prisma.waTag.findMany({
      where: { ownerId: session.user.id },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ tags });
  } catch (err: any) {
    console.error("[WaTags GET]", err);
    return NextResponse.json({ error: "Erro ao buscar tags" }, { status: 500 });
  }
}

// POST — create a new tag
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await prisma.waTag.findFirst({
      where: { ownerId: session.user.id, name: name.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Já existe uma tag com este nome" }, { status: 409 });
    }

    // Get max displayOrder
    const maxOrder = await prisma.waTag.aggregate({
      where: { ownerId: session.user.id },
      _max: { displayOrder: true },
    });

    const tag = await prisma.waTag.create({
      data: {
        name: name.trim(),
        color: color || "#3B82F6",
        description: description || null,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (err: any) {
    console.error("[WaTags POST]", err);
    return NextResponse.json({ error: "Erro ao criar tag" }, { status: 500 });
  }
}

// PUT — update an existing tag
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, color, description } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.waTag.findFirst({
      where: { id, ownerId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }

    // Check for duplicate name (excluding self)
    const duplicate = await prisma.waTag.findFirst({
      where: { ownerId: session.user.id, name: name.trim(), id: { not: id } },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Já existe outra tag com este nome" }, { status: 409 });
    }

    const tag = await prisma.waTag.update({
      where: { id },
      data: {
        name: name.trim(),
        color: color || existing.color,
        description: description !== undefined ? (description || null) : existing.description,
      },
    });

    return NextResponse.json({ tag });
  } catch (err: any) {
    console.error("[WaTags PUT]", err);
    return NextResponse.json({ error: "Erro ao atualizar tag" }, { status: 500 });
  }
}

// DELETE — remove a tag
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.waTag.findFirst({
      where: { id, ownerId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }

    // Delete tag (cascade will remove WaConversationTag entries)
    await prisma.waTag.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[WaTags DELETE]", err);
    return NextResponse.json({ error: "Erro ao excluir tag" }, { status: 500 });
  }
}
