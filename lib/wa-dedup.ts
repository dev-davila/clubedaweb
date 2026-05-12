/**
 * WhatsApp Conversation Deduplication
 * 
 * WhatsApp uses two ID formats:
 * - @s.whatsapp.net (phone-based, e.g. 5511992206037@s.whatsapp.net)
 * - @lid (internal ID, e.g. 88996151586969@lid)
 * 
 * The same contact may have conversations under both formats.
 * This module merges them into a single conversation, preferring @s.whatsapp.net.
 */
import { prisma } from "@/lib/db";

/**
 * Extract phone number from a JID or remoteJidAlt
 */
export function extractPhone(jid: string, remoteJidAlt?: string | null): string {
  if (jid.includes("@s.whatsapp.net")) {
    return jid.replace("@s.whatsapp.net", "");
  }
  if (remoteJidAlt?.includes("@s.whatsapp.net")) {
    return remoteJidAlt.replace("@s.whatsapp.net", "");
  }
  return jid.replace("@lid", "");
}

/**
 * Find or create a conversation, merging duplicates if they exist.
 * 
 * When a @lid JID comes in with a remoteJidAlt pointing to @s.whatsapp.net:
 * 1. Check if a conversation already exists for the @s.whatsapp.net JID
 * 2. Check if a conversation already exists for the @lid JID
 * 3. If both exist, merge messages from @lid into @s.whatsapp.net and delete @lid
 * 4. If only @lid exists, update its contactPhone with the real number
 * 5. If only @s.whatsapp.net exists, use it
 * 6. If neither exists, create one with the incoming JID
 */
export async function findOrMergeConversation(
  instanceId: string,
  remoteJid: string,
  opts?: {
    remoteJidAlt?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
  }
) {
  const altJid = opts?.remoteJidAlt || null;
  const phone = opts?.contactPhone || extractPhone(remoteJid, altJid);

  // Determine which is the phone-based JID
  const isLid = remoteJid.includes("@lid");
  const phoneJid = isLid && altJid?.includes("@s.whatsapp.net") ? altJid : 
                   !isLid ? remoteJid : null;
  const lidJid = isLid ? remoteJid : null;

  // If we have both JID formats, try to find conversations for both
  if (phoneJid && lidJid) {
    const [phoneConv, lidConv] = await Promise.all([
      prisma.waConversation.findUnique({
        where: { instanceId_remoteJid: { instanceId, remoteJid: phoneJid } },
      }),
      prisma.waConversation.findUnique({
        where: { instanceId_remoteJid: { instanceId, remoteJid: lidJid } },
      }),
    ]);

    if (phoneConv && lidConv && phoneConv.id !== lidConv.id) {
      // Both exist — merge LID messages into phone conversation
      await mergeConversations(phoneConv.id, lidConv.id, phone, opts?.contactName);
      return phoneConv;
    }

    if (phoneConv) {
      // Only phone conv exists — update phone if needed
      if (phone && phoneConv.contactPhone !== phone) {
        await prisma.waConversation.update({
          where: { id: phoneConv.id },
          data: { contactPhone: phone },
        });
      }
      return phoneConv;
    }

    if (lidConv) {
      // Only LID conv exists — update contactPhone with real number
      if (phone && lidConv.contactPhone !== phone) {
        await prisma.waConversation.update({
          where: { id: lidConv.id },
          data: { contactPhone: phone },
        });
      }
      return lidConv;
    }
  } else {
    // Only have one JID format — look it up directly
    const conv = await prisma.waConversation.findUnique({
      where: { instanceId_remoteJid: { instanceId, remoteJid } },
    });
    
    // Also check if there's a conversation with the same phone number
    // (could be under a different JID format)
    if (!conv && phone && phone.length >= 10) {
      const phoneConv = await prisma.waConversation.findFirst({
        where: { instanceId, contactPhone: phone },
      });
      if (phoneConv) return phoneConv;
    }
    
    if (conv) return conv;
  }

  return null; // No existing conversation found
}

/**
 * Merge messages from sourceConvId into targetConvId, then delete sourceConv.
 * Also migrates tags.
 */
async function mergeConversations(
  targetId: string,
  sourceId: string,
  phone?: string | null,
  contactName?: string | null
) {
  try {
    // Move messages that don't already exist in target
    // First, get all messageIds from target
    const targetMsgIds = await prisma.waMessage.findMany({
      where: { conversationId: targetId },
      select: { messageId: true },
    });
    const existingIds = new Set(targetMsgIds.map(m => m.messageId).filter(Boolean));

    // Get source messages
    const sourceMessages = await prisma.waMessage.findMany({
      where: { conversationId: sourceId },
    });

    // Move non-duplicate messages to target
    const toMove = sourceMessages.filter(m => !m.messageId || !existingIds.has(m.messageId));
    if (toMove.length > 0) {
      await prisma.waMessage.updateMany({
        where: { id: { in: toMove.map(m => m.id) } },
        data: { conversationId: targetId },
      });
    }

    // Delete duplicate source messages
    const dupes = sourceMessages.filter(m => m.messageId && existingIds.has(m.messageId));
    if (dupes.length > 0) {
      await prisma.waMessage.deleteMany({
        where: { id: { in: dupes.map(m => m.id) } },
      });
    }

    // Move tags from source that don't exist in target
    const targetTags = await prisma.waConversationTag.findMany({
      where: { conversationId: targetId },
      select: { tagId: true },
    });
    const existingTagIds = new Set(targetTags.map(t => t.tagId));
    
    const sourceTags = await prisma.waConversationTag.findMany({
      where: { conversationId: sourceId },
    });
    
    for (const st of sourceTags) {
      if (!existingTagIds.has(st.tagId)) {
        await prisma.waConversationTag.update({
          where: { id: st.id },
          data: { conversationId: targetId },
        }).catch(() => {}); // Ignore unique constraint errors
      }
    }

    // Delete remaining source tags
    await prisma.waConversationTag.deleteMany({ where: { conversationId: sourceId } });

    // Get source conversation data for merging metadata
    const sourceConv = await prisma.waConversation.findUnique({ where: { id: sourceId } });
    
    // Update target conversation with best available data
    const updateData: any = {};
    if (phone) updateData.contactPhone = phone;
    if (contactName) updateData.contactName = contactName;
    if (sourceConv?.lastMessageAt) {
      const targetConv = await prisma.waConversation.findUnique({ where: { id: targetId } });
      if (targetConv && (!targetConv.lastMessageAt || sourceConv.lastMessageAt > targetConv.lastMessageAt)) {
        updateData.lastMessage = sourceConv.lastMessage;
        updateData.lastMessageAt = sourceConv.lastMessageAt;
      }
      if (targetConv && !targetConv.contactName && sourceConv.contactName) {
        updateData.contactName = sourceConv.contactName;
      }
    }
    
    if (Object.keys(updateData).length > 0) {
      await prisma.waConversation.update({ where: { id: targetId }, data: updateData });
    }

    // Delete source conversation
    await prisma.waConversation.delete({ where: { id: sourceId } });
    
    console.log(`[WA-Dedup] Merged conversation ${sourceId} into ${targetId} (${toMove.length} msgs moved)`);
  } catch (error) {
    console.error(`[WA-Dedup] Error merging ${sourceId} -> ${targetId}:`, error);
  }
}

/**
 * Deduplicate all conversations for an instance.
 * Groups by contactPhone, merges duplicates.
 */
export async function deduplicateConversations(instanceId: string) {
  const conversations = await prisma.waConversation.findMany({
    where: { instanceId },
    orderBy: { lastMessageAt: "desc" },
  });

  // Group by contactPhone
  const byPhone = new Map<string, typeof conversations>();
  for (const conv of conversations) {
    if (!conv.contactPhone || conv.contactPhone.length < 10) continue;
    const existing = byPhone.get(conv.contactPhone) || [];
    existing.push(conv);
    byPhone.set(conv.contactPhone, existing);
  }

  let merged = 0;
  for (const [phone, convs] of byPhone.entries()) {
    if (convs.length <= 1) continue;
    
    // Prefer @s.whatsapp.net conversation, otherwise pick the one with most messages
    const primary = convs.find(c => c.remoteJid.includes("@s.whatsapp.net")) || convs[0];
    
    for (const conv of convs) {
      if (conv.id === primary.id) continue;
      await mergeConversations(primary.id, conv.id, phone, conv.contactName || primary.contactName);
      merged++;
    }
  }

  return merged;
}
