export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createEvolutionClient } from "@/lib/evolution-api";

// POST: Configure webhook for an existing instance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const user = session.user as any;

    const { id } = await params;
    const instance = await prisma.evolutionInstance.findUnique({
      where: { id },
      include: { server: true },
    });
    if (!instance) return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
    if (user.role !== "admin" && instance.ownerId !== user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const client = createEvolutionClient({ apiUrl: instance.server.apiUrl, apiKey: instance.server.apiKey });
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/gestor/comunicacao/webhook`;

    const result = await client.setWebhook(instance.instanceName, webhookUrl);
    console.log(`[Webhook] Configured for instance ${instance.instanceName}: ${webhookUrl}`);

    return NextResponse.json({ success: true, webhookUrl, result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: Check current webhook config for an instance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const user = session.user as any;

    const { id } = await params;
    const instance = await prisma.evolutionInstance.findUnique({
      where: { id },
      include: { server: true },
    });
    if (!instance) return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
    if (user.role !== "admin" && instance.ownerId !== user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const client = createEvolutionClient({ apiUrl: instance.server.apiUrl, apiKey: instance.server.apiKey });
    const webhook = await client.findWebhook(instance.instanceName);

    return NextResponse.json({ webhook });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
