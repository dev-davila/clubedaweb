export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createEvolutionClient } from "@/lib/evolution-api";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  return session.user as { id: string; role: string; email: string };
}

// GET: List instances for current user (admin sees all)
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    const where: any = {};
    if (user.role !== "admin") {
      where.ownerId = user.id;
    }
    const instances = await prisma.evolutionInstance.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        server: { select: { id: true, name: true, apiUrl: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ instances });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 403 : 500 });
  }
}

// POST: Create instance + connect via QR
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const body = await request.json();
    const { instanceName, serverId } = body;
    if (!instanceName || !serverId) {
      return NextResponse.json({ error: "instanceName e serverId obrigat\u00f3rios" }, { status: 400 });
    }
    // Validate server
    const server = await prisma.evolutionServer.findUnique({ where: { id: serverId } });
    if (!server || !server.active) {
      return NextResponse.json({ error: "Servidor n\u00e3o encontrado ou inativo" }, { status: 404 });
    }
    // Create in Evolution API
    const client = createEvolutionClient({ apiUrl: server.apiUrl, apiKey: server.apiKey });
    let evoResult;
    try {
      evoResult = await client.createInstance(instanceName, true);
    } catch (e: any) {
      return NextResponse.json({ error: `Erro Evolution API: ${e.message}` }, { status: 502 });
    }
    // Save to DB
    const instance = await prisma.evolutionInstance.create({
      data: {
        instanceName,
        instanceToken: evoResult?.hash?.apikey || evoResult?.hash || null,
        status: evoResult?.instance?.status || "created",
        serverId: server.id,
        ownerId: user.id,
      },
    });
    // Auto-configure webhook
    try {
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/gestor/comunicacao/webhook`;
      await client.setWebhook(instanceName, webhookUrl);
      console.log(`[Webhook] Configured for instance ${instanceName}: ${webhookUrl}`);
    } catch (e) {
      console.error(`[Webhook] Failed to configure for ${instanceName}:`, e);
    }

    return NextResponse.json({ instance, qrcode: evoResult?.qrcode }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Remove instance
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigat\u00f3rio" }, { status: 400 });
    const instance = await prisma.evolutionInstance.findUnique({ where: { id }, include: { server: true } });
    if (!instance) return NextResponse.json({ error: "N\u00e3o encontrada" }, { status: 404 });
    if (user.role !== "admin" && instance.ownerId !== user.id) {
      return NextResponse.json({ error: "Sem permiss\u00e3o" }, { status: 403 });
    }
    // Delete from Evolution API
    try {
      const client = createEvolutionClient({ apiUrl: instance.server.apiUrl, apiKey: instance.server.apiKey });
      await client.deleteInstance(instance.instanceName);
    } catch (e) {
      console.error("Erro ao deletar na Evolution API:", e);
    }
    await prisma.evolutionInstance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
