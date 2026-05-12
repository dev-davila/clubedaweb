export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Listar todos os redirecionamentos
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const redirects = await prisma.urlRedirect.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ redirects });
  } catch (error: any) {
    console.error("[Redirects] Erro ao listar:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// POST - Criar novo redirecionamento
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { sourcePath, targetPath, statusCode = 301, note } = body;

    if (!sourcePath || !targetPath) {
      return NextResponse.json({ error: "sourcePath e targetPath são obrigatórios" }, { status: 400 });
    }

    // Normalizar paths
    const normalizedSource = sourcePath.startsWith("/") ? sourcePath : `/${sourcePath}`;
    const normalizedTarget = targetPath.startsWith("/") || targetPath.startsWith("http") ? targetPath : `/${targetPath}`;

    // Verificar se já existe
    const existing = await prisma.urlRedirect.findUnique({ where: { sourcePath: normalizedSource } });
    if (existing) {
      return NextResponse.json({ error: "Já existe um redirecionamento para este caminho" }, { status: 409 });
    }

    // Evitar loop
    if (normalizedSource === normalizedTarget) {
      return NextResponse.json({ error: "Origem e destino não podem ser iguais" }, { status: 400 });
    }

    const redirect = await prisma.urlRedirect.create({
      data: {
        sourcePath: normalizedSource,
        targetPath: normalizedTarget,
        statusCode: statusCode === 302 ? 302 : 301,
        note: note || null,
      },
    });

    return NextResponse.json({ redirect }, { status: 201 });
  } catch (error: any) {
    console.error("[Redirects] Erro ao criar:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// DELETE - Remover redirecionamento
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    await prisma.urlRedirect.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Redirects] Erro ao deletar:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// PATCH - Atualizar redirecionamento
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, targetPath, statusCode, active, note } = body;
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const data: any = {};
    if (targetPath !== undefined) data.targetPath = targetPath.startsWith("/") || targetPath.startsWith("http") ? targetPath : `/${targetPath}`;
    if (statusCode !== undefined) data.statusCode = statusCode === 302 ? 302 : 301;
    if (active !== undefined) data.active = active;
    if (note !== undefined) data.note = note;

    const redirect = await prisma.urlRedirect.update({ where: { id }, data });
    return NextResponse.json({ redirect });
  } catch (error: any) {
    console.error("[Redirects] Erro ao atualizar:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
