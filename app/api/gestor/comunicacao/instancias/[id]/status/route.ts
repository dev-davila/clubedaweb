export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createEvolutionClient } from "@/lib/evolution-api";

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
    let state;
    try {
      state = await client.getConnectionState(instance.instanceName);
    } catch {
      state = { instance: { state: "close" } };
    }

    const currentState = state?.instance?.state || state?.state || "close";
    await prisma.evolutionInstance.update({ where: { id }, data: { status: currentState } });

    return NextResponse.json({ status: currentState });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
