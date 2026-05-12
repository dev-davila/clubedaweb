export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - List all agent configs
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await prisma.aiAgentConfig.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { sessions: true } },
    },
  });

  return NextResponse.json(configs);
}

// POST - Create new agent config
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name, systemPrompt, restrictions, welcomeMessage, model, temperature,
    maxTokens, departments, instanceIds, businessRules, active,
    trainingFiles, trainingUrls, isEntryPoint, routingInstructions, routingAgentIds,
    fallbackModel, trainingEnabled, unodeskEnabled, responseDelay, inactivityTimeout,
  } = body;

  if (!name || !systemPrompt) {
    return NextResponse.json({ error: "Nome e prompt do sistema s\u00e3o obrigat\u00f3rios" }, { status: 400 });
  }

  // If setting as entry point, unset any other entry point for same instances
  if (isEntryPoint) {
    await prisma.aiAgentConfig.updateMany({
      where: { ownerId: session.user.id, isEntryPoint: true },
      data: { isEntryPoint: false },
    });
  }

  const config = await prisma.aiAgentConfig.create({
    data: {
      name,
      systemPrompt,
      restrictions: restrictions || null,
      welcomeMessage: welcomeMessage || null,
      model: model || "gpt-4o-mini",
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 1024,
      departments: departments || "comercial,suporte,financeiro",
      instanceIds: instanceIds || null,
      businessRules: businessRules || null,
      trainingFiles: trainingFiles || null,
      trainingUrls: trainingUrls || null,
      isEntryPoint: isEntryPoint ?? false,
      routingInstructions: routingInstructions || null,
      routingAgentIds: routingAgentIds || null,
      responseDelay: responseDelay != null ? Math.max(0, Math.min(300, parseInt(responseDelay) || 0)) : 0,
      inactivityTimeout: inactivityTimeout != null ? Math.max(0, parseInt(inactivityTimeout) || 0) : 0,
      fallbackModel: fallbackModel || null,
      trainingEnabled: trainingEnabled ?? false,
      unodeskEnabled: unodeskEnabled ?? false,
      active: active ?? true,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(config, { status: 201 });
}

// PUT - Update agent config
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json({ error: "ID \u00e9 obrigat\u00f3rio" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.aiAgentConfig.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Config n\u00e3o encontrada" }, { status: 404 });
  }

  // If setting as entry point, unset others
  if (updateData.isEntryPoint === true && !existing.isEntryPoint) {
    await prisma.aiAgentConfig.updateMany({
      where: { ownerId: session.user.id, isEntryPoint: true, id: { not: id } },
      data: { isEntryPoint: false },
    });
  }

  const config = await prisma.aiAgentConfig.update({
    where: { id },
    data: {
      name: updateData.name ?? existing.name,
      systemPrompt: updateData.systemPrompt ?? existing.systemPrompt,
      restrictions: updateData.restrictions !== undefined ? updateData.restrictions : existing.restrictions,
      welcomeMessage: updateData.welcomeMessage ?? existing.welcomeMessage,
      model: updateData.model ?? existing.model,
      temperature: updateData.temperature ?? existing.temperature,
      maxTokens: updateData.maxTokens ?? existing.maxTokens,
      departments: updateData.departments ?? existing.departments,
      instanceIds: updateData.instanceIds ?? existing.instanceIds,
      businessRules: updateData.businessRules ?? existing.businessRules,
      trainingFiles: updateData.trainingFiles !== undefined ? updateData.trainingFiles : existing.trainingFiles,
      trainingUrls: updateData.trainingUrls !== undefined ? updateData.trainingUrls : existing.trainingUrls,
      isEntryPoint: updateData.isEntryPoint !== undefined ? updateData.isEntryPoint : existing.isEntryPoint,
      routingInstructions: updateData.routingInstructions !== undefined ? updateData.routingInstructions : existing.routingInstructions,
      routingAgentIds: updateData.routingAgentIds !== undefined ? (updateData.routingAgentIds || null) : existing.routingAgentIds,
      responseDelay: updateData.responseDelay != null ? Math.max(0, Math.min(300, parseInt(updateData.responseDelay) || 0)) : existing.responseDelay,
      inactivityTimeout: updateData.inactivityTimeout != null ? Math.max(0, parseInt(updateData.inactivityTimeout) || 0) : existing.inactivityTimeout,
      fallbackModel: updateData.fallbackModel !== undefined ? (updateData.fallbackModel || null) : existing.fallbackModel,
      trainingEnabled: updateData.trainingEnabled !== undefined ? updateData.trainingEnabled : existing.trainingEnabled,
      unodeskEnabled: updateData.unodeskEnabled !== undefined ? updateData.unodeskEnabled : existing.unodeskEnabled,
      active: updateData.active ?? existing.active,
    },
  });

  return NextResponse.json(config);
}

// DELETE - Delete agent config
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID \u00e9 obrigat\u00f3rio" }, { status: 400 });
  }

  const existing = await prisma.aiAgentConfig.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Config n\u00e3o encontrada" }, { status: 404 });
  }

  await prisma.aiAgentConfig.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
