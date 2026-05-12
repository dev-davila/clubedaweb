export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// GET: List all servers
export async function GET() {
  try {
    await requireAdmin();
    const servers = await prisma.evolutionServer.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { instances: true } } },
    });
    // Mask API keys
    const masked = servers.map(s => ({
      ...s,
      apiKey: s.apiKey.substring(0, 8) + "..." + s.apiKey.substring(s.apiKey.length - 4),
      _rawKeyLength: s.apiKey.length,
    }));
    return NextResponse.json({ servers: masked });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 403 : 500 });
  }
}

// POST: Create server
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, apiUrl, apiKey, isDefault } = body;
    if (!name || !apiUrl || !apiKey) {
      return NextResponse.json({ error: "Campos obrigat\u00f3rios: name, apiUrl, apiKey" }, { status: 400 });
    }
    // If setting as default, unset others
    if (isDefault) {
      await prisma.evolutionServer.updateMany({ data: { isDefault: false } });
    }
    const server = await prisma.evolutionServer.create({
      data: { name, apiUrl: apiUrl.replace(/\/$/, ''), apiKey, isDefault: !!isDefault },
    });
    return NextResponse.json(server, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Update server
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, apiUrl, apiKey, isDefault, active } = body;
    if (!id) return NextResponse.json({ error: "ID obrigat\u00f3rio" }, { status: 400 });
    if (isDefault) {
      await prisma.evolutionServer.updateMany({ data: { isDefault: false } });
    }
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (apiUrl !== undefined) data.apiUrl = apiUrl.replace(/\/$/, '');
    if (apiKey !== undefined) data.apiKey = apiKey;
    if (isDefault !== undefined) data.isDefault = isDefault;
    if (active !== undefined) data.active = active;
    const server = await prisma.evolutionServer.update({ where: { id }, data });
    return NextResponse.json(server);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Remove server
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "ID obrigat\u00f3rio" }, { status: 400 });
    await prisma.evolutionServer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
