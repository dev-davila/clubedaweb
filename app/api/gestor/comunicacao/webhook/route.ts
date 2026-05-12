export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Webhook endpoint for Evolution API v2
 * Receives real-time events: messages.upsert, messages.update, connection.update
 * This endpoint is PUBLIC (no auth) because Evolution API calls it directly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event;
    const instanceName = body.instance;
    const data = body.data;

    if (!event || !instanceName) {
      return NextResponse.json({ received: true });
    }

    console.log(`[Webhook] Event: ${event}, Instance: ${instanceName}`);

    // Find instance in DB
    const instance = await prisma.evolutionInstance.findFirst({
      where: { instanceName },
      include: { server: true },
    });

    if (!instance) {
      console.warn(`[Webhook] Instance not found: ${instanceName}`);
      return NextResponse.json({ received: true });
    }

    switch (event) {
      case "messages.upsert":
        await handleMessageUpsert(instance, data);
        break;
      case "messages.update":
        await handleMessageUpdate(instance, data);
        break;
      case "connection.update":
        await handleConnectionUpdate(instance, data);
        break;
      case "send.message":
        await handleSendMessage(instance, data);
        break;
      default:
        console.log(`[Webhook] Unhandled event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    return NextResponse.json({ received: true });
  }
}

// Also accept GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "active" });
}

// ---- Event Handlers ----

async function handleMessageUpsert(
  instance: { id: string; instanceName: string },
  data: any
) {
  try {
    const key = data?.key;
    if (!key?.id || !key?.remoteJid) return;

    const remoteJid = key.remoteJid as string;
    // Skip groups, status broadcasts
    if (remoteJid.includes("@g.us") || remoteJid === "status@broadcast" || remoteJid === "0@s.whatsapp.net") return;

    const { findOrMergeConversation, extractPhone } = await import("@/lib/wa-dedup");

    const remoteJidAlt = key.remoteJidAlt || null;
    const phone = extractPhone(remoteJid, remoteJidAlt);
    const contactName = data.pushName || null;

    // Find existing conversation (handles dedup across @lid and @s.whatsapp.net)
    let conversation = await findOrMergeConversation(instance.id, remoteJid, {
      remoteJidAlt,
      contactName: key.fromMe ? null : contactName,
      contactPhone: phone,
    });

    const content = data.message?.conversation
      || data.message?.extendedTextMessage?.text
      || data.message?.imageMessage?.caption
      || data.message?.videoMessage?.caption
      || data.message?.documentMessage?.title
      || "";

    const mediaType = data.message?.imageMessage ? "image"
      : data.message?.videoMessage ? "video"
      : data.message?.audioMessage ? "audio"
      : data.message?.documentMessage ? "document"
      : data.message?.stickerMessage ? "sticker"
      : "text";

    const ts = data.messageTimestamp
      ? new Date((typeof data.messageTimestamp === "number" ? data.messageTimestamp : parseInt(data.messageTimestamp, 10)) * 1000)
      : new Date();

    if (!conversation) {
      conversation = await prisma.waConversation.create({
        data: {
          instanceId: instance.id,
          remoteJid,
          contactName: key.fromMe ? null : contactName,
          contactPhone: phone,
          lastMessage: content || null,
          lastMessageAt: ts,
          unreadCount: key.fromMe ? 0 : 1,
        },
      });
    } else {
      // Update conversation
      const updateData: any = {
        lastMessage: content || conversation.lastMessage,
        lastMessageAt: ts,
      };
      if (!key.fromMe && contactName) {
        updateData.contactName = contactName;
      }
      if (!key.fromMe) {
        updateData.unreadCount = { increment: 1 };
      }
      // Update contactPhone with real number if we have remoteJidAlt
      if (phone && phone.length >= 10) {
        updateData.contactPhone = phone;
      }
      await prisma.waConversation.update({
        where: { id: conversation.id },
        data: updateData,
      });
    }

    // Check for duplicate message
    const existing = await prisma.waMessage.findFirst({
      where: { messageId: key.id, conversationId: conversation.id },
    });
    if (existing) return;

    // Create message
    await prisma.waMessage.create({
      data: {
        messageId: key.id,
        conversationId: conversation.id,
        fromMe: key.fromMe || false,
        content: content || null,
        mediaType,
        timestamp: ts,
        status: key.fromMe ? "SERVER_ACK" : null,
      },
    });

    console.log(`[Webhook] Message saved: ${key.id} in conv ${conversation.id}`);

    // ---- AI Agent Integration ----
    // Only process incoming messages (not fromMe) with text content
    if (!key.fromMe && content) {
      try {
        const { processIncomingMessage } = await import("@/lib/ai-agent");
        const result = await processIncomingMessage({
          instanceId: instance.id,
          remoteJid,
          phone,
          content,
          messageType: mediaType,
          externalMsgId: key.id,
          contactName: contactName || undefined,
          conversationId: conversation.id,
        });
        if (result.handled) {
          console.log(`[Webhook] AI processed message for ${phone}`);
        } else {
          console.log(`[Webhook] AI skipped: ${result.reason}`);
        }
      } catch (aiError) {
        console.error("[Webhook] AI processing error (non-blocking):", aiError);
        // Non-blocking: message is already saved, AI failure doesn't break the flow
      }
    }
  } catch (error) {
    console.error("[Webhook] Error handling messages.upsert:", error);
  }
}

async function handleMessageUpdate(
  instance: { id: string },
  data: any
) {
  try {
    // data can be an array of updates or single object
    const updates = Array.isArray(data) ? data : [data];

    for (const update of updates) {
      const msgId = update?.key?.id;
      if (!msgId) continue;

      // Evolution API v2 sends status as numeric or string
      // Try multiple paths for the status value
      const rawStatus = update?.update?.status ?? update?.status ?? update?.update;
      if (rawStatus === undefined || rawStatus === null) continue;

      // Map to standardized status values matching the UI expectations
      const numericMap: Record<number, string> = {
        0: "PENDING",
        1: "SERVER_ACK",
        2: "DELIVERY_ACK",
        3: "READ",
        4: "PLAYED",
        5: "DELETED",
      };

      const stringMap: Record<string, string> = {
        "SERVER_ACK": "SERVER_ACK",
        "DELIVERY_ACK": "DELIVERY_ACK",
        "READ": "READ",
        "PLAYED": "PLAYED",
        "PENDING": "PENDING",
        "ERROR": "ERROR",
      };

      let newStatus: string | null = null;
      if (typeof rawStatus === "number") {
        newStatus = numericMap[rawStatus] || null;
      } else if (typeof rawStatus === "string") {
        newStatus = stringMap[rawStatus.toUpperCase()] || rawStatus.toUpperCase();
      }

      if (!newStatus) continue;

      console.log(`[Webhook] Status update: msg ${msgId} -> ${newStatus}`);

      await prisma.waMessage.updateMany({
        where: { messageId: msgId },
        data: { status: newStatus },
      });
    }
  } catch (error) {
    console.error("[Webhook] Error handling messages.update:", error);
  }
}

async function handleConnectionUpdate(
  instance: { id: string; instanceName: string; server?: { apiUrl: string; apiKey: string } },
  data: any
) {
  try {
    const state = data?.state || data?.connection;
    if (!state) return;

    // Map Evolution states to our status values
    let status = "close";
    if (state === "open" || state === "connected") status = "open";
    else if (state === "connecting") status = "connecting";
    else if (state === "close" || state === "disconnected") status = "close";

    await prisma.evolutionInstance.update({
      where: { id: instance.id },
      data: { status },
    });

    console.log(`[Webhook] Instance ${instance.instanceName} status: ${status}`);

    // Auto-configure webhook when instance connects
    if (status === "open" && instance.server) {
      try {
        const webhookUrl = `${process.env.NEXTAUTH_URL}/api/gestor/comunicacao/webhook`;
        const { createEvolutionClient } = await import("@/lib/evolution-api");
        const client = createEvolutionClient({ apiUrl: instance.server.apiUrl, apiKey: instance.server.apiKey });
        const existing = await client.findWebhook(instance.instanceName);
        if (!existing || !existing.url) {
          await client.setWebhook(instance.instanceName, webhookUrl);
          console.log(`[Webhook] Auto-configured webhook for ${instance.instanceName} -> ${webhookUrl}`);
        }
      } catch (e) {
        console.error(`[Webhook] Failed to auto-configure webhook for ${instance.instanceName}:`, e);
      }
    }
  } catch (error) {
    console.error("[Webhook] Error handling connection.update:", error);
  }
}

async function handleSendMessage(
  instance: { id: string },
  data: any
) {
  try {
    const key = data?.key;
    if (!key?.id || !key?.remoteJid) return;

    const remoteJid = key.remoteJid as string;
    if (remoteJid.includes("@g.us") || remoteJid === "status@broadcast") return;

    const { findOrMergeConversation, extractPhone } = await import("@/lib/wa-dedup");
    const remoteJidAlt = key.remoteJidAlt || null;
    const phone = extractPhone(remoteJid, remoteJidAlt);
    
    // Find conversation using dedup logic
    let conversation = await findOrMergeConversation(instance.id, remoteJid, {
      remoteJidAlt,
      contactPhone: phone,
    });
    if (!conversation) {
      // Also try direct lookup as fallback
      conversation = await prisma.waConversation.findUnique({
        where: { instanceId_remoteJid: { instanceId: instance.id, remoteJid } },
      });
    }
    if (!conversation) return;

    // Check for duplicate
    const existing = await prisma.waMessage.findFirst({
      where: { messageId: key.id, conversationId: conversation.id },
    });
    if (existing) return;

    const content = data.message?.conversation
      || data.message?.extendedTextMessage?.text
      || data.message?.imageMessage?.caption
      || "";

    await prisma.waMessage.create({
      data: {
        messageId: key.id,
        conversationId: conversation.id,
        fromMe: true,
        content: content || null,
        mediaType: "text",
        timestamp: new Date(),
        status: "sent",
      },
    });
  } catch (error) {
    console.error("[Webhook] Error handling send.message:", error);
  }
}
