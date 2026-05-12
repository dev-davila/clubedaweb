export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// POST — import contacts from WhatsApp conversations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { instanceId } = body;

    if (!instanceId) {
      return NextResponse.json({ error: "instanceId obrigatório" }, { status: 400 });
    }

    // Verify instance belongs to user
    const instance = await prisma.evolutionInstance.findFirst({
      where: { id: instanceId, ownerId: session.user.id },
    });
    if (!instance) return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });

    // Get all conversations with phone numbers
    const conversations = await prisma.waConversation.findMany({
      where: { instanceId },
      select: { remoteJid: true, contactName: true, contactPhone: true },
    });

    let imported = 0;
    let skipped = 0;

    for (const conv of conversations) {
      // Extract phone from contactPhone or remoteJid
      const phone = conv.contactPhone || conv.remoteJid.replace(/@.*/, "");
      if (!phone || phone.length < 8) {
        skipped++;
        continue;
      }

      try {
        await prisma.waContact.upsert({
          where: {
            ownerId_phone: { ownerId: session.user.id, phone },
          },
          create: {
            name: conv.contactName || phone,
            phone,
            source: "whatsapp",
            remoteJid: conv.remoteJid,
            instanceId,
            ownerId: session.user.id,
          },
          update: {
            // Only update name if we have a better one (not just the phone)
            ...(conv.contactName && conv.contactName !== phone ? { name: conv.contactName } : {}),
            remoteJid: conv.remoteJid,
            instanceId,
          },
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, total: conversations.length });
  } catch (error: any) {
    console.error("[CONTACTS IMPORT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
