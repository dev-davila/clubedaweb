export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createEvolutionClient } from "@/lib/evolution-api";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  return session.user as { id: string; role: string };
}

// GET: List conversations for an instance
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Get messages for a conversation
      const conversation = await prisma.waConversation.findUnique({
        where: { id: conversationId },
        include: { instance: { include: { server: true } }, tags: { include: { tag: true } } },
      });
      if (!conversation) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
      if (user.role !== "admin" && conversation.instance.ownerId !== user.id) {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
      }

      // Fetch messages from Evolution API and sync to DB
      try {
        const client = createEvolutionClient({ apiUrl: conversation.instance.server.apiUrl, apiKey: conversation.instance.server.apiKey });
        const evoResult = await client.findMessages(
          conversation.instance.instanceName,
          conversation.instance.instanceToken || conversation.instance.server.apiKey,
          conversation.remoteJid,
          100
        );
        // Evolution API v2 returns { messages: { total, pages, records: [...] } }
        const evoMessages = Array.isArray(evoResult) ? evoResult
          : (evoResult?.messages?.records || evoResult?.messages || []);
        if (Array.isArray(evoMessages)) {
          for (const msg of evoMessages) {
            const msgId = msg.key?.id;
            if (!msgId) continue;
            // Determine status from MessageUpdate array
            const statusArr = msg.MessageUpdate;
            let latestStatus: string | null = null;
            if (Array.isArray(statusArr) && statusArr.length > 0) {
              // Get the highest priority status from the array
              const statusPriority: Record<string, number> = { PENDING: 0, SERVER_ACK: 1, DELIVERY_ACK: 2, READ: 3, PLAYED: 4 };
              for (const su of statusArr) {
                const s = typeof su?.status === "number"
                  ? ({ 1: "SERVER_ACK", 2: "DELIVERY_ACK", 3: "READ", 4: "PLAYED" } as Record<number, string>)[su.status] || null
                  : su?.status || null;
                if (s && (statusPriority[s] ?? -1) > (statusPriority[latestStatus || ""] ?? -1)) {
                  latestStatus = s;
                }
              }
            }

            const existing = await prisma.waMessage.findFirst({ where: { messageId: msgId, conversationId } });
            if (!existing) {
              const content = msg.message?.conversation
                || msg.message?.extendedTextMessage?.text
                || msg.message?.imageMessage?.caption
                || msg.message?.videoMessage?.caption
                || msg.message?.documentMessage?.title
                || "";
              const mediaType = msg.message?.imageMessage ? "image"
                : msg.message?.videoMessage ? "video"
                : msg.message?.audioMessage ? "audio"
                : msg.message?.documentMessage ? "document"
                : msg.message?.stickerMessage ? "sticker"
                : "text";
              const ts = msg.messageTimestamp
                ? new Date((typeof msg.messageTimestamp === "number" ? msg.messageTimestamp : parseInt(msg.messageTimestamp, 10)) * 1000)
                : new Date();
              await prisma.waMessage.create({
                data: {
                  messageId: msgId,
                  conversationId,
                  fromMe: msg.key?.fromMe || false,
                  content: content || null,
                  mediaType,
                  timestamp: ts,
                  status: latestStatus,
                },
              });
            } else if (latestStatus && existing.fromMe) {
              // Update status if it changed (only for sent messages)
              const statusPriority: Record<string, number> = { PENDING: 0, SERVER_ACK: 1, DELIVERY_ACK: 2, READ: 3, PLAYED: 4 };
              const currentPriority = statusPriority[existing.status || ""] ?? -1;
              const newPriority = statusPriority[latestStatus] ?? -1;
              if (newPriority > currentPriority) {
                await prisma.waMessage.update({
                  where: { id: existing.id },
                  data: { status: latestStatus },
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("Erro ao buscar msgs da Evolution:", e);
      }

      const messages = await prisma.waMessage.findMany({
        where: { conversationId },
        orderBy: { timestamp: "asc" },
        take: 200,
      });

      return NextResponse.json({ conversation, messages });
    }

    if (!instanceId) {
      return NextResponse.json({ error: "instanceId obrigatório" }, { status: 400 });
    }

    const instance = await prisma.evolutionInstance.findUnique({
      where: { id: instanceId },
      include: { server: true },
    });
    if (!instance) return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
    if (user.role !== "admin" && instance.ownerId !== user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Sync chats from Evolution API (with deduplication)
    try {
      const { findOrMergeConversation, extractPhone, deduplicateConversations } = await import("@/lib/wa-dedup");
      const client = createEvolutionClient({ apiUrl: instance.server.apiUrl, apiKey: instance.server.apiKey });
      const chats = await client.findChats(instance.instanceName, instance.instanceToken || instance.server.apiKey);
      if (Array.isArray(chats)) {
        for (const chat of chats) {
          const jid = chat.remoteJid;
          if (!jid || jid.includes("@g.us") || jid === "status@broadcast" || jid === "0@s.whatsapp.net") continue;

          const remoteJidAlt = chat.lastMessage?.key?.remoteJidAlt || null;
          const phone = extractPhone(jid, remoteJidAlt);

          // Get contact name
          let contactName = chat.pushName || null;
          if (!contactName && chat.lastMessage?.pushName && !chat.lastMessage?.key?.fromMe) {
            contactName = chat.lastMessage.pushName;
          }
          const lastMsgText = chat.lastMessage?.message?.conversation
            || chat.lastMessage?.message?.extendedTextMessage?.text
            || null;
          let lastMsgAt: Date | null = null;
          if (chat.lastMessage?.messageTimestamp) {
            const ts = typeof chat.lastMessage.messageTimestamp === "number"
              ? chat.lastMessage.messageTimestamp
              : parseInt(chat.lastMessage.messageTimestamp, 10);
            if (ts > 0) lastMsgAt = new Date(ts * 1000);
          } else if (chat.updatedAt) {
            lastMsgAt = new Date(chat.updatedAt);
          }

          // Try to find or merge with existing conversation (dedup @lid vs @s.whatsapp.net)
          const existing = await findOrMergeConversation(instanceId, jid, {
            remoteJidAlt,
            contactName,
            contactPhone: phone,
          });

          if (existing) {
            // Update existing conversation
            const updateData: any = { contactPhone: phone, unreadCount: chat.unreadCount || 0 };
            if (contactName) updateData.contactName = contactName;
            if (lastMsgText) updateData.lastMessage = lastMsgText;
            if (lastMsgAt) updateData.lastMessageAt = lastMsgAt;
            await prisma.waConversation.update({
              where: { id: existing.id },
              data: updateData,
            });
          } else {
            // Create new conversation
            await prisma.waConversation.create({
              data: {
                instanceId,
                remoteJid: jid,
                contactName,
                contactPhone: phone,
                lastMessage: lastMsgText,
                lastMessageAt: lastMsgAt,
                unreadCount: chat.unreadCount || 0,
              },
            });
          }
        }

        // Run full dedup pass to clean up any remaining duplicates
        await deduplicateConversations(instanceId);
      }
    } catch (e) {
      console.error("Erro ao sincronizar chats:", e);
    }

    const tagFilter = searchParams.get("tagId");
    const search = searchParams.get("search");
    const conversationWhere: any = { instanceId };
    if (tagFilter) {
      conversationWhere.tags = { some: { tagId: tagFilter } };
    }
    if (search) {
      conversationWhere.OR = [
        { contactName: { contains: search, mode: "insensitive" } },
        { contactPhone: { contains: search } },
      ];
    }

    const conversations = await prisma.waConversation.findMany({
      where: conversationWhere,
      orderBy: { lastMessageAt: "desc" },
      include: { tags: { include: { tag: true } } },
      take: 100,
    });

    return NextResponse.json({ conversations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 403 : 500 });
  }
}

// POST: Send message
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const body = await request.json();
    const { conversationId, text } = body;
    if (!conversationId || !text) {
      return NextResponse.json({ error: "conversationId e text obrigatórios" }, { status: 400 });
    }

    const conversation = await prisma.waConversation.findUnique({
      where: { id: conversationId },
      include: { instance: { include: { server: true } } },
    });
    if (!conversation) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    if (user.role !== "admin" && conversation.instance.ownerId !== user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const client = createEvolutionClient({ apiUrl: conversation.instance.server.apiUrl, apiKey: conversation.instance.server.apiKey });
    // Use contactPhone (real number) if available, otherwise extract from JID
    const phone = conversation.contactPhone || conversation.remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
    const result = await client.sendText(
      conversation.instance.instanceName,
      conversation.instance.instanceToken || conversation.instance.server.apiKey,
      phone,
      text
    );

    // Save to DB
    const msg = await prisma.waMessage.create({
      data: {
        messageId: result?.key?.id || null,
        conversationId,
        fromMe: true,
        content: text,
        mediaType: "text",
        timestamp: new Date(),
        status: "SERVER_ACK",
      },
    });

    // Update conversation
    await prisma.waConversation.update({
      where: { id: conversationId },
      data: { lastMessage: text, lastMessageAt: new Date() },
    });

    return NextResponse.json(msg);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
