import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pages = await prisma.institutionalPage.findMany({
      orderBy: { title: "asc" },
    });
    return NextResponse.json(pages);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
