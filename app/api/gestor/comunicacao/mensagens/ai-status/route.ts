export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

/**
 * GET - Check if a conversation has an active AI session.
 * Query: ?conversationId=xxx  OR  ?phone=xxx&instanceId=xxx
 * Returns: { hasAiSession, session: {...} | null }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "N\u00e3o autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const phone = searchParams.get("phone");
    const instanceId = searchParams.get("instanceId");

    let aiSession: any = null;

    if (conversationId) {
      aiSession = await prisma.aiSession.findFirst({
        where: {
          conversationId,
          status: { in: ["active", "waiting_human", "human"] },
        },
        include: {
          agentConfig: { select: { name: true, model: true } },
          assignedUser: { select: { name: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    } else if (phone && instanceId) {
      aiSession = await prisma.aiSession.findFirst({
        where: {
          phone,
          instanceId,
          status: { in: ["active", "waiting_human", "human"] },
        },
        include: {
          agentConfig: { select: { name: true, model: true } },
          assignedUser: { select: { name: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!aiSession) {
      return NextResponse.json({ hasAiSession: false, session: null });
    }

    return NextResponse.json({
      hasAiSession: true,
      session: {
        id: aiSession.id,
        status: aiSession.status,
        department: aiSession.department,
        step: aiSession.step,
        agentName: aiSession.agentConfig.name,
        agentModel: aiSession.agentConfig.model,
        assignedUser: aiSession.assignedUser,
        startedAt: aiSession.startedAt,
        updatedAt: aiSession.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("[AI Status] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Transfer conversation from AI to human.
 * Body: { conversationId, sessionId? }
 */
export async function POST(req: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: "N\u00e3o autorizado" }, { status: 401 });
    }

    const { conversationId, sessionId } = await req.json();

    if (!conversationId && !sessionId) {
      return NextResponse.json(
        { error: "conversationId ou sessionId \u00e9 obrigat\u00f3rio" },
        { status: 400 }
      );
    }

    // Find the AI session
    let aiSession;
    if (sessionId) {
      aiSession = await prisma.aiSession.findUnique({ where: { id: sessionId } });
    } else {
      aiSession = await prisma.aiSession.findFirst({
        where: {
          conversationId,
          status: { in: ["active", "waiting_human"] },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!aiSession) {
      return NextResponse.json({ error: "Nenhuma sess\u00e3o IA ativa encontrada" }, { status: 404 });
    }

    // Update session status to 'human'
    const updated = await prisma.aiSession.update({
      where: { id: aiSession.id },
      data: {
        status: "human",
        assignedTo: (authSession.user as any).id,
        step: "handoff",
      },
    });

    // Add system message to AI session
    await prisma.aiSessionMessage.create({
      data: {
        sessionId: aiSession.id,
        senderType: "system",
        content: `Atendimento transferido para ${authSession.user.name || authSession.user.email}`,
        messageType: "action",
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: updated.id,
        status: updated.status,
        assignedTo: updated.assignedTo,
      },
    });
  } catch (error: any) {
    console.error("[AI Transfer] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
