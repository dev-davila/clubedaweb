export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createEvolutionClient } from "@/lib/evolution-api";

// GET: Fetch media content (base64) for a message
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const user = session.user as { id: string; role: string };

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId"); // WhatsApp message ID
    const conversationId = searchParams.get("conversationId");

    if (!messageId || !conversationId) {
      return NextResponse.json({ error: "messageId e conversationId obrigat\u00f3rios" }, { status: 400 });
    }

    const conversation = await prisma.waConversation.findUnique({
      where: { id: conversationId },
      include: { instance: { include: { server: true } } },
    });
    if (!conversation) return NextResponse.json({ error: "Conversa n\u00e3o encontrada" }, { status: 404 });
    if (user.role !== "admin" && conversation.instance.ownerId !== user.id) {
      return NextResponse.json({ error: "Sem permiss\u00e3o" }, { status: 403 });
    }

    const client = createEvolutionClient({
      apiUrl: conversation.instance.server.apiUrl,
      apiKey: conversation.instance.server.apiKey,
    });

    const result = await client.getBase64FromMedia(
      conversation.instance.instanceName,
      conversation.instance.instanceToken || conversation.instance.server.apiKey,
      messageId
    );

    if (!result || !result.base64) {
      return NextResponse.json({ error: "M\u00eddia n\u00e3o dispon\u00edvel" }, { status: 404 });
    }

    return NextResponse.json({
      base64: result.base64,
      mimetype: result.mimetype || "application/octet-stream",
      mediaType: result.mediaType || "unknown",
      fileName: result.fileName || null,
    });
  } catch (e: any) {
    console.error("[Media] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
