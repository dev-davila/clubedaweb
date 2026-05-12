export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET — list contacts (with optional search, pagination)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = { ownerId: session.user.id };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.waContact.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          instance: { select: { instanceName: true } },
          scheduledContacts: {
            where: { status: "pending" },
            orderBy: { scheduledAt: "asc" },
            take: 1,
          },
        },
      }),
      prisma.waContact.count({ where }),
    ]);

    return NextResponse.json({ contacts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("[CONTACTS GET]", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

// POST — create new contact
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { name, phone, email, company, notes, tags, source, instanceId } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
    }

    // Normalize phone — remove non-digits
    const normalizedPhone = phone.replace(/\D/g, "");

    const contact = await prisma.waContact.create({
      data: {
        name,
        phone: normalizedPhone,
        email: email || null,
        company: company || null,
        notes: notes || null,
        tags: tags || null,
        source: source || "manual",
        instanceId: instanceId || null,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Contato com este telefone já existe" }, { status: 409 });
    }
    console.error("[CONTACTS POST]", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
