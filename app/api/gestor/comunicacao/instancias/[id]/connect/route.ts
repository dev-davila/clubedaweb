export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createEvolutionClient } from "@/lib/evolution-api";

// GET: Get QR code / connection state for an instance
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
    if (!instance) return NextResponse.json({ error: "N\u00e3o encontrada" }, { status: 404 });
    if (user.role !== "admin" && instance.ownerId !== user.id) {
      return NextResponse.json({ error: "Sem permiss\u00e3o" }, { status: 403 });
    }

    const client = createEvolutionClient({ apiUrl: instance.server.apiUrl, apiKey: instance.server.apiKey });

    // Check state first
    let state;
    try {
      state = await client.getConnectionState(instance.instanceName);
    } catch {
      state = null;
    }

    const currentState = state?.instance?.state || state?.state || "close";

    // Update DB status
    await prisma.evolutionInstance.update({
      where: { id },
      data: { status: currentState },
    });

    if (currentState === "open") {
      // Ensure webhook is configured when instance is connected
      try {
        const webhookUrl = `${process.env.NEXTAUTH_URL}/api/gestor/comunicacao/webhook`;
        await client.setWebhook(instance.instanceName, webhookUrl);
      } catch (e) {
        console.error(`[Webhook] Failed to configure for ${instance.instanceName}:`, e);
      }
      return NextResponse.json({ status: "open", qrcode: null });
    }

    // Get QR code
    let qrData;
    try {
      qrData = await client.connectInstance(instance.instanceName);
    } catch (e: any) {
      return NextResponse.json({ status: currentState, qrcode: null, error: e.message });
    }

    return NextResponse.json({
      status: "connecting",
      qrcode: qrData?.base64 || qrData?.qrcode?.base64 || qrData?.code || null,
      pairingCode: qrData?.pairingCode || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
