export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET – Load AI session messages with feedback data for training mode
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId obrigatório" }, { status: 400 });
  }

  try {
    // Find active or recent AI sessions for this conversation
    const sessions = await prisma.aiSession.findMany({
      where: {
        conversationId,
        ownerId: session.user.id,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        agentConfig: {
          select: { trainingEnabled: true, name: true },
        },
      },
    });

    // Check if any session has training enabled
    const trainingSessions = sessions.filter(s => s.agentConfig?.trainingEnabled);
    if (trainingSessions.length === 0) {
      return NextResponse.json({ trainingEnabled: false, messages: [] });
    }

    const sessionIds = trainingSessions.map(s => s.id);

    // Load AI messages with feedback
    const aiMessages = await prisma.aiSessionMessage.findMany({
      where: {
        sessionId: { in: sessionIds },
        senderType: "ai",
      },
      orderBy: { timestamp: "asc" },
      select: {
        id: true,
        content: true,
        timestamp: true,
        feedbackStatus: true,
        feedbackComment: true,
        feedbackAt: true,
        feedbackBy: true,
      },
    });

    return NextResponse.json({
      trainingEnabled: true,
      agentName: trainingSessions[0]?.agentConfig?.name || "Agente IA",
      messages: aiMessages,
    });
  } catch (error) {
    console.error("[AI Messages API] Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
