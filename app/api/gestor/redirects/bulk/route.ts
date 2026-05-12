export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// DELETE - Deletar múltiplos redirecionamentos
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { ids } = body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids deve ser um array não vazio" }, { status: 400 });
    }

    const result = await prisma.urlRedirect.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error: any) {
    console.error("[Redirects Bulk] Erro ao deletar:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// POST - Criar múltiplos redirecionamentos de uma vez
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { sourcePaths, targetPath, statusCode = 301, note } = body;

    if (!sourcePaths || !Array.isArray(sourcePaths) || sourcePaths.length === 0) {
      return NextResponse.json({ error: "sourcePaths deve ser um array não vazio" }, { status: 400 });
    }
    if (!targetPath) {
      return NextResponse.json({ error: "targetPath é obrigatório" }, { status: 400 });
    }

    const normalizedTarget = targetPath.startsWith("/") || targetPath.startsWith("http") ? targetPath : `/${targetPath}`;
    const code = statusCode === 302 ? 302 : 301;

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const sp of sourcePaths) {
      const normalizedSource = sp.startsWith("/") ? sp : `/${sp}`;

      if (normalizedSource === normalizedTarget) {
        skipped++;
        errors.push(`${normalizedSource}: origem e destino iguais`);
        continue;
      }

      try {
        const existing = await prisma.urlRedirect.findUnique({ where: { sourcePath: normalizedSource } });
        if (existing) {
          // Atualizar destino se já existir
          await prisma.urlRedirect.update({
            where: { sourcePath: normalizedSource },
            data: { targetPath: normalizedTarget, statusCode: code, note: note || existing.note, active: true },
          });
          created++;
        } else {
          await prisma.urlRedirect.create({
            data: {
              sourcePath: normalizedSource,
              targetPath: normalizedTarget,
              statusCode: code,
              note: note || null,
            },
          });
          created++;
        }
      } catch (err: any) {
        skipped++;
        errors.push(`${normalizedSource}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: sourcePaths.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[Redirects Bulk] Erro:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
