export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET — single contact with all scheduled contacts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const contact = await prisma.waContact.findFirst({
      where: { id: params.id, ownerId: session.user.id },
      include: {
        instance: { select: { instanceName: true } },
        scheduledContacts: { orderBy: { scheduledAt: "desc" } },
      },
    });

    if (!contact) return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("[CONTACT GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — update contact
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { name, phone, email, company, notes, tags, instanceId } = body;

    const existing = await prisma.waContact.findFirst({
      where: { id: params.id, ownerId: session.user.id },
    });
    if (!existing) return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });

    const normalizedPhone = phone ? phone.replace(/\D/g, "") : existing.phone;

    const contact = await prisma.waContact.update({
      where: { id: params.id },
      data: {
        name: name ?? existing.name,
        phone: normalizedPhone,
        email: email !== undefined ? (email || null) : existing.email,
        company: company !== undefined ? (company || null) : existing.company,
        notes: notes !== undefined ? (notes || null) : existing.notes,
        tags: tags !== undefined ? (tags || null) : existing.tags,
        instanceId: instanceId !== undefined ? (instanceId || null) : existing.instanceId,
      },
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Já existe contato com este telefone" }, { status: 409 });
    }
    console.error("[CONTACT PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove contact
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const existing = await prisma.waContact.findFirst({
      where: { id: params.id, ownerId: session.user.id },
    });
    if (!existing) return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });

    await prisma.waContact.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CONTACT DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
