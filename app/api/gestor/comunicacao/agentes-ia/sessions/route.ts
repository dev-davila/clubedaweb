export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - List sessions with filters
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const department = searchParams.get("department");
  const instanceId = searchParams.get("instanceId");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");

  const where: any = { ownerId: session.user.id };
  if (status) where.status = status;
  if (department) where.department = department;
  if (instanceId) where.instanceId = instanceId;
  if (search) {
    where.OR = [
      { phone: { contains: search } },
      { metadata: { contains: search } },
    ];
  }

  const [sessions, total] = await Promise.all([
    prisma.aiSession.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        instance: { select: { instanceName: true, phoneNumber: true } },
        agentConfig: { select: { name: true } },
        assignedUser: { select: { name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.aiSession.count({ where }),
  ]);

  return NextResponse.json({ sessions, total, page, limit });
}
