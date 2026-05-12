export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/ai-agent";

/**
 * Manual AI response trigger - useful for testing.
 * Called by webhook or directly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, remoteJid, phone, content, messageType, externalMsgId, contactName, conversationId } = body;

    if (!instanceId || !remoteJid || !phone || !content) {
      return NextResponse.json(
        { error: "instanceId, remoteJid, phone e content s\u00e3o obrigat\u00f3rios" },
        { status: 400 }
      );
    }

    const result = await processIncomingMessage({
      instanceId,
      remoteJid,
      phone,
      content,
      messageType,
      externalMsgId,
      contactName,
      conversationId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AI-Respond] Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
