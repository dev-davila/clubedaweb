export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// POST – Submit feedback for an AI message
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { messageId, status, comment } = await request.json();

    if (!messageId || !status || !["accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "messageId e status (accepted/rejected) são obrigatórios" },
        { status: 400 }
      );
    }

    // Verify the message exists and is an AI message
    const message = await prisma.aiSessionMessage.findUnique({
      where: { id: messageId },
      select: { id: true, senderType: true, sessionId: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 });
    }
    if (message.senderType !== "ai") {
      return NextResponse.json({ error: "Feedback só pode ser dado em mensagens da IA" }, { status: 400 });
    }

    // Update the message with feedback
    const updated = await prisma.aiSessionMessage.update({
      where: { id: messageId },
      data: {
        feedbackStatus: status,
        feedbackComment: comment || null,
        feedbackAt: new Date(),
        feedbackBy: session.user.id,
      },
    });

    // If rejected, trigger auto-improvement (add to restrictions)
    if (status === "rejected" && comment) {
      try {
        await autoImproveAgent(message.sessionId, messageId, comment);
      } catch (err) {
        console.error("[Feedback] Auto-improve failed:", err);
      }
    }

    return NextResponse.json({ success: true, feedback: { status, comment } });
  } catch (error) {
    console.error("[Feedback API] Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Auto-improve: append rejected feedback to agent restrictions
async function autoImproveAgent(sessionId: string, messageId: string, comment: string) {
  // Find the agent config through the session
  const session = await prisma.aiSession.findUnique({
    where: { id: sessionId },
    select: { agentConfigId: true },
  });
  if (!session?.agentConfigId) return;

  const agent = await prisma.aiAgentConfig.findUnique({
    where: { id: session.agentConfigId },
    select: { id: true, restrictions: true, trainingEnabled: true },
  });
  if (!agent?.trainingEnabled) return;

  // Get the rejected AI message for context
  const rejectedMsg = await prisma.aiSessionMessage.findUnique({
    where: { id: messageId },
    select: { content: true },
  });

  // Append the feedback as a learned restriction
  const newRestriction = `\n\n[Feedback ${new Date().toLocaleDateString("pt-BR")}] Resposta rejeitada: "${(rejectedMsg?.content || "").slice(0, 200)}..." → Motivo: ${comment}`;
  
  const currentRestrictions = agent.restrictions || "";
  
  // Limit total restriction size to prevent bloat
  const combined = currentRestrictions + newRestriction;
  const finalRestrictions = combined.length > 5000 ? combined.slice(-5000) : combined;

  await prisma.aiAgentConfig.update({
    where: { id: agent.id },
    data: { restrictions: finalRestrictions },
  });

  console.log(`[Feedback] Auto-improved agent ${agent.id} with rejection feedback`);
}
