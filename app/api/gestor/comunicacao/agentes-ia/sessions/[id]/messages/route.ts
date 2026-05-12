export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createEvolutionClient } from "@/lib/evolution-api";

// GET - Get messages for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const messages = await prisma.aiSessionMessage.findMany({
    where: {
      sessionId: id,
      session: { ownerId: session.user.id },
    },
    orderBy: { timestamp: "asc" },
  });

  return NextResponse.json(messages);
}

// POST - Send human message in a session (when in human mode)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Conte\u00fado \u00e9 obrigat\u00f3rio" }, { status: 400 });
  }

  // Get session with instance info
  const aiSession = await prisma.aiSession.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      instance: { include: { server: true } },
    },
  });

  if (!aiSession) {
    return NextResponse.json({ error: "Sess\u00e3o n\u00e3o encontrada" }, { status: 404 });
  }

  if (aiSession.status !== "human" && aiSession.status !== "waiting_human") {
    return NextResponse.json({ error: "Sess\u00e3o n\u00e3o est\u00e1 em modo humano" }, { status: 400 });
  }

  // Send via Evolution API
  const client = createEvolutionClient({
    apiUrl: aiSession.instance.server.apiUrl,
    apiKey: aiSession.instance.server.apiKey,
  });

  const number = aiSession.remoteJid.split("@")[0];

  try {
    await client.sendText(
      aiSession.instance.instanceName,
      aiSession.instance.instanceToken || "",
      number,
      content.trim()
    );
  } catch (err) {
    console.error("[AI-Agent] Failed to send human message:", err);
    return NextResponse.json({ error: "Falha ao enviar mensagem" }, { status: 500 });
  }

  // Save to AI session messages
  const msg = await prisma.aiSessionMessage.create({
    data: {
      sessionId: id,
      senderType: "human",
      content: content.trim(),
      messageType: "text",
    },
  });

  // Update session
  await prisma.aiSession.update({
    where: { id },
    data: {
      status: "human",
      assignedTo: session.user.id,
    },
  });

  return NextResponse.json(msg, { status: 201 });
}
