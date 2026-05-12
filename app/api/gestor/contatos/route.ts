export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

interface UnifiedContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  cnpj: string | null;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
  source: "contact" | "newsletter";
  status?: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const perPage = 20;
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all, unread, read
    const source = searchParams.get("source") || "all"; // all, contact, newsletter

    // Build contact query
    const contactWhere: Record<string, unknown> = {};
    if (filter === "unread") contactWhere.read = false;
    if (filter === "read") contactWhere.read = true;
    if (search) {
      contactWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build newsletter query
    const newsletterWhere: Record<string, unknown> = {};
    if (search) {
      newsletterWhere.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    let allItems: UnifiedContact[] = [];
    let contactTotal = 0;
    let newsletterTotal = 0;
    let unreadCount = 0;

    // Fetch contacts
    if (source === "all" || source === "contact") {
      const [contacts, cTotal, cUnread] = await Promise.all([
        prisma.contactMessage.findMany({
          where: contactWhere,
          orderBy: { createdAt: "desc" },
        }),
        prisma.contactMessage.count({ where: contactWhere }),
        prisma.contactMessage.count({ where: { read: false } }),
      ]);
      contactTotal = cTotal;
      unreadCount = cUnread;

      allItems.push(
        ...contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          company: c.company,
          cnpj: c.cnpj,
          subject: c.subject,
          message: c.message,
          read: c.read,
          createdAt: c.createdAt.toISOString(),
          source: "contact" as const,
        }))
      );
    }

    // Fetch newsletter subscribers
    if (source === "all" || source === "newsletter") {
      const [subscribers, nTotal] = await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where: newsletterWhere,
          orderBy: { createdAt: "desc" },
        }),
        prisma.newsletterSubscriber.count({ where: newsletterWhere }),
      ]);
      newsletterTotal = nTotal;

      allItems.push(
        ...subscribers.map((s) => ({
          id: s.id,
          name: s.name || s.email.split("@")[0],
          email: s.email,
          phone: null,
          company: null,
          cnpj: null,
          subject: null,
          message: `Inscrito na newsletter em ${s.createdAt.toLocaleDateString("pt-BR")}`,
          read: true, // newsletters are always "read"
          createdAt: s.createdAt.toISOString(),
          source: "newsletter" as const,
          status: s.status,
        }))
      );
    }

    // Sort by date desc
    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply read filter for newsletter items in "all" source mode
    if (source === "all" && filter === "unread") {
      allItems = allItems.filter((i) => !i.read);
    } else if (source === "all" && filter === "read") {
      allItems = allItems.filter((i) => i.read);
    }

    const total = allItems.length;
    const paginatedItems = allItems.slice((page - 1) * perPage, page * perPage);

    return NextResponse.json({
      contacts: paginatedItems,
      total,
      unreadCount,
      contactTotal,
      newsletterTotal,
      page,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Marcar como lido/não lido
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id, ids, read } = await req.json();

    if (ids && Array.isArray(ids)) {
      await prisma.contactMessage.updateMany({
        where: { id: { in: ids } },
        data: { read },
      });
      return NextResponse.json({ success: true, updated: ids.length });
    }

    if (id) {
      await prisma.contactMessage.update({
        where: { id },
        data: { read },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID necessário" }, { status: 400 });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// Deletar contato
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const deleteSource = searchParams.get("source") || "contact";

    if (!id) {
      return NextResponse.json({ error: "ID necessário" }, { status: 400 });
    }

    if (deleteSource === "newsletter") {
      await prisma.newsletterSubscriber.delete({ where: { id } });
    } else {
      await prisma.contactMessage.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}
