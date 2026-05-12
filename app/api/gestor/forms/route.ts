export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Newsletter stats
    const [newsletterTotal, newsletterActive, newsletterUnsubscribed] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      prisma.newsletterSubscriber.count({ where: { status: "UNSUBSCRIBED" } }),
    ]);

    // Contact messages stats
    const [contactTotal, contactUnread] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { read: false } }),
    ]);

    // Recent contact messages
    const recentContacts = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        read: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      newsletter: {
        total: newsletterTotal,
        active: newsletterActive,
        unsubscribed: newsletterUnsubscribed,
      },
      contact: {
        total: contactTotal,
        unread: contactUnread,
        recent: recentContacts,
      },
    });
  } catch (error) {
    console.error("Error fetching forms data:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
