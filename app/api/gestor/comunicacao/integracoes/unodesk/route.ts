export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  isUnodeskConfigured,
  buscarEmpresaPorCnpj,
  buscarPessoaPorTelefone,
  buscarPessoaPorEmail,
  buscarChamadosPorPessoa,
  invalidateUnodeskCache,
} from "@/lib/unodesk";

// GET — status check or search
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // Status check
  if (!action || action === "status") {
    // Read from DB first, fallback to env
    let dbRows: any[] = [];
    try {
      dbRows = await prisma.siteConfig.findMany({ where: { category: "unodesk" } });
    } catch {}
    const dbMap = Object.fromEntries(dbRows.map((r: any) => [r.key, r.value]));
    const baseUrl = dbMap["unodesk_base_url"] || process.env.UNODESK_BASE_URL || "";
    const hasSignature = !!(dbMap["unodesk_api_signature"] || process.env.UNODESK_API_SIGNATURE);
    const hasToken = !!(dbMap["unodesk_api_token"] || process.env.UNODESK_API_TOKEN);

    return NextResponse.json({
      configured: !!(baseUrl && hasSignature && hasToken),
      baseUrl,
      hasSignature,
      hasToken,
    });
  }

  // Config read (admin only)
  if (action === "config") {
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Apenas admin" }, { status: 403 });
    }
    let dbRows: any[] = [];
    try {
      dbRows = await prisma.siteConfig.findMany({ where: { category: "unodesk" } });
    } catch {}
    const dbMap = Object.fromEntries(dbRows.map((r: any) => [r.key, r.value]));
    return NextResponse.json({
      baseUrl: dbMap["unodesk_base_url"] || process.env.UNODESK_BASE_URL || "",
      signature: dbMap["unodesk_api_signature"] || process.env.UNODESK_API_SIGNATURE || "",
      token: dbMap["unodesk_api_token"] || process.env.UNODESK_API_TOKEN || "",
    });
  }

  try {
    if (action === "empresa") {
      const cnpj = searchParams.get("cnpj") || "";
      if (!cnpj) return NextResponse.json({ error: "CNPJ obrigatório" }, { status: 400 });
      const empresas = await buscarEmpresaPorCnpj(cnpj);
      return NextResponse.json({ empresas });
    }

    if (action === "pessoa-telefone") {
      const telefone = searchParams.get("telefone") || "";
      const empresaId = searchParams.get("empresa_id");
      if (!telefone) return NextResponse.json({ error: "Telefone obrigatório" }, { status: 400 });
      const pessoas = await buscarPessoaPorTelefone(telefone, empresaId ? Number(empresaId) : undefined);
      return NextResponse.json({ pessoas });
    }

    if (action === "pessoa-email") {
      const email = searchParams.get("email") || "";
      if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
      const pessoas = await buscarPessoaPorEmail(email);
      return NextResponse.json({ pessoas });
    }

    if (action === "chamados") {
      const pessoaId = searchParams.get("pessoa_id");
      if (!pessoaId) return NextResponse.json({ error: "pessoa_id obrigatório" }, { status: 400 });
      const chamados = await buscarChamadosPorPessoa(Number(pessoaId));
      return NextResponse.json({ chamados });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err: any) {
    console.error("Unodesk API error:", err);
    return NextResponse.json({ error: err.message || "Erro na API Unodesk" }, { status: 500 });
  }
}

// POST — save Unodesk config (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { baseUrl, signature, token } = body;

    const configs = [
      { key: "unodesk_base_url", value: baseUrl || "", label: "Base URL", description: "URL base do Unodesk" },
      { key: "unodesk_api_signature", value: signature || "", label: "X-Signature", description: "Assinatura da API" },
      { key: "unodesk_api_token", value: token || "", label: "Bearer Token", description: "Token de autenticação" },
    ];

    for (const cfg of configs) {
      await prisma.siteConfig.upsert({
        where: { key: cfg.key },
        update: { value: cfg.value, label: cfg.label, description: cfg.description, category: "unodesk" },
        create: { key: cfg.key, value: cfg.value, label: cfg.label, description: cfg.description, category: "unodesk" },
      });
    }

    // Invalidate the in-memory cache
    invalidateUnodeskCache();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error saving Unodesk config:", err);
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 });
  }
}
