export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { handoffToHuman, closeSession } from "@/lib/ai-agent";

// GET - Session detail with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const aiSession = await prisma.aiSession.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      instance: { select: { instanceName: true, phoneNumber: true } },
      agentConfig: { select: { name: true } },
      assignedUser: { select: { name: true, email: true } },
      messages: {
        orderBy: { timestamp: "asc" },
        take: 100,
      },
    },
  });

  if (!aiSession) {
    return NextResponse.json({ error: "Sess\u00e3o n\u00e3o encontrada" }, { status: 404 });
  }

  return NextResponse.json(aiSession);
}

// PUT - Update session (handoff, close, assign)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  // Verify ownership
  const aiSession = await prisma.aiSession.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!aiSession) {
    return NextResponse.json({ error: "Sess\u00e3o n\u00e3o encontrada" }, { status: 404 });
  }

  switch (action) {
    case "handoff":
      await handoffToHuman(id, session.user.id);
      return NextResponse.json({ success: true, status: "human" });

    case "close":
      await closeSession(id, body.reason || "closed_by_admin");
      return NextResponse.json({ success: true, status: "closed" });

    case "reactivate":
      await prisma.aiSession.update({
        where: { id },
        data: { status: "active", assignedTo: null },
      });
      return NextResponse.json({ success: true, status: "active" });

    default:
      return NextResponse.json({ error: "A\u00e7\u00e3o inv\u00e1lida" }, { status: 400 });
  }
}
