export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Retorna redirecionamentos ativos (usado pelo middleware via fetch interno)
export async function GET() {
  try {
    const redirects = await prisma.urlRedirect.findMany({
      where: { active: true },
      select: { id: true, sourcePath: true, targetPath: true, statusCode: true },
    });
    return NextResponse.json({ redirects });
  } catch (error: any) {
    console.error("[Redirects Active] Erro:", error);
    return NextResponse.json({ redirects: [] });
  }
}
