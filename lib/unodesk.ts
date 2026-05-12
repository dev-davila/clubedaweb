/**
 * Unodesk (ServiceDesk) API Client
 * Credentials: DB (SiteConfig category=unodesk) → env vars fallback
 */

import { prisma } from "@/lib/db";

// Cached credentials (refreshed every 60s max)
let _cache: { baseUrl: string; signature: string; token: string } | null = null;
let _cacheAt = 0;
const CACHE_TTL = 60_000; // 1 min

async function getCredentials() {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache;
  try {
    const rows = await prisma.siteConfig.findMany({ where: { category: "unodesk" } });
    const map = Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
    _cache = {
      baseUrl: map["unodesk_base_url"] || process.env.UNODESK_BASE_URL || "",
      signature: map["unodesk_api_signature"] || process.env.UNODESK_API_SIGNATURE || "",
      token: map["unodesk_api_token"] || process.env.UNODESK_API_TOKEN || "",
    };
  } catch {
    _cache = {
      baseUrl: process.env.UNODESK_BASE_URL || "",
      signature: process.env.UNODESK_API_SIGNATURE || "",
      token: process.env.UNODESK_API_TOKEN || "",
    };
  }
  _cacheAt = Date.now();
  return _cache;
}

// Force refresh cache (after saving new credentials)
export function invalidateUnodeskCache() {
  _cache = null;
  _cacheAt = 0;
}

function makeHeaders(signature: string, token: string) {
  return {
    accept: "application/json",
    "X-Signature": signature,
    Authorization: `Bearer ${token}`,
  };
}

export async function unodeskFetch(path: string, options?: RequestInit) {
  const creds = await getCredentials();
  const url = `${creds.baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...makeHeaders(creds.signature, creds.token), ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Unodesk API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Format CNPJ to XX.XXX.XXX/XXXX-XX (required by Unodesk API)
function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj; // return as-is if not 14 digits
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

// 1. Buscar empresa por CNPJ
export async function buscarEmpresaPorCnpj(cnpj: string) {
  const formatted = formatCnpj(cnpj);
  const data = await unodeskFetch(`/api/v1/empresas/index.json?numero=${encodeURIComponent(formatted)}`);
  return data.empresas || [];
}

// 2. Buscar pessoa por telefone (tenta múltiplos formatos)
export async function buscarPessoaPorTelefone(telefone: string, empresaId?: number) {
  // Normalize phone - remove non-digits
  const digits = telefone.replace(/\D/g, "");
  // Generate formats to try (order: most specific first)
  const formats: string[] = [];

  // If already has country code (55), use as-is then strip
  if (digits.length >= 13 && digits.startsWith("55")) {
    formats.push(digits); // 5511992206037
    formats.push(digits.slice(2)); // 11992206037
  }
  // If 10-11 digits (DDD + phone), add with 55 prefix first, then as-is
  else if (digits.length >= 10 && digits.length <= 11) {
    formats.push(`55${digits}`); // add country code: 5511992206037
    formats.push(digits); // 11992206037
  }
  // Other lengths, try as-is
  else {
    formats.push(digits);
  }

  // Also try formatted version: (11) 99220-6037
  if (digits.length === 11) {
    formats.push(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
  } else if (digits.length === 13 && digits.startsWith("55")) {
    const local = digits.slice(2);
    formats.push(`(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`);
  }

  // Deduplicate
  const unique = [...new Set(formats)];

  for (const fmt of unique) {
    const qs = empresaId
      ? `telefone=${encodeURIComponent(fmt)}&empresa_id=${empresaId}`
      : `telefone=${encodeURIComponent(fmt)}`;
    try {
      const data = await unodeskFetch(`/api/v1/pessoas/index.json?${qs}`);
      if (data.pessoas && data.pessoas.length > 0) return data.pessoas;
    } catch {}
  }
  return [];
}

// 3. Buscar pessoa por email
export async function buscarPessoaPorEmail(email: string) {
  const data = await unodeskFetch(`/api/v1/pessoas/index.json?email=${encodeURIComponent(email)}`);
  return data.pessoas || [];
}

// 4. Buscar chamados de uma pessoa
export async function buscarChamadosPorPessoa(pessoaId: number) {
  const data = await unodeskFetch(`/api/v1/chamados/getPessoaId/${pessoaId}.json`);
  return data.chamados || [];
}

// 5. Atualizar email da pessoa
export async function atualizarEmailPessoa(pessoaId: number, email: string) {
  const formData = new FormData();
  formData.append("email", email);
  return unodeskFetch(`/api/v1/pessoas/edit/${pessoaId}.json`, {
    method: "POST",
    body: formData,
    headers: {} as any, // let FormData set content-type
  });
}

// 6. Atualizar nome da pessoa
export async function atualizarNomePessoa(pessoaId: number, nome: string) {
  const formData = new FormData();
  formData.append("nome", nome);
  return unodeskFetch(`/api/v1/pessoas/edit/${pessoaId}.json`, {
    method: "POST",
    body: formData,
    headers: {} as any,
  });
}

// 7. Criar chamado via webhook
export async function criarChamado(params: {
  code: string;
  title: string;
  description: string;
  empresaId: string;
  personId: string;
  timestamp?: string;
}) {
  const body = new URLSearchParams({
    code: params.code,
    event: "global",
    title: params.title,
    description: params.description,
    timestamp: params.timestamp || String(Math.floor(Date.now() / 1000)),
    empresa_id: params.empresaId,
    person_id: params.personId,
    plataforma_origem: "35",
  });
  return unodeskFetch(`/webhook`, {
    method: "POST",
    body: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
  });
}

// 8. Encaminhar mensagem para chamado existente
export async function encaminharMensagem(params: {
  ticketId: string;
  title: string;
  description: string;
  empresaId: string;
  personId: string;
  timestamp?: string;
}) {
  const body = new URLSearchParams({
    ticket_id: params.ticketId,
    event: "global",
    title: params.title,
    description: params.description,
    timestamp: params.timestamp || String(Math.floor(Date.now() / 1000)),
    empresa_id: params.empresaId,
    person_id: params.personId,
    plataforma_origem: "35",
  });
  return unodeskFetch(`/webhook`, {
    method: "POST",
    body: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
  });
}

// 9. Cadastrar empresa
export async function cadastrarEmpresa(params: {
  nome: string;
  cnpj: string;
  telefone?: string;
  email?: string;
}) {
  const formData = new URLSearchParams();
  formData.append("nome", params.nome);
  formData.append("numero", formatCnpj(params.cnpj));
  if (params.telefone) formData.append("telefone", params.telefone);
  if (params.email) formData.append("email", params.email);
  formData.append("apelido", params.nome); // alias defaults to name

  const data = await unodeskFetch(`/api/v1/empresas/add.json`, {
    method: "POST",
    body: formData.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
  });
  return data.empresa || data;
}

// 10. Cadastrar pessoa
export async function cadastrarPessoa(params: {
  nome: string;
  empresaId: number;
  telefone?: string;
  email?: string;
}) {
  const formData = new URLSearchParams();
  formData.append("nome", params.nome);
  formData.append("empresa_id", String(params.empresaId));
  if (params.telefone) formData.append("telefone", params.telefone);
  if (params.email) formData.append("email", params.email);

  const data = await unodeskFetch(`/api/v1/pessoas/add.json`, {
    method: "POST",
    body: formData.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
  });
  return data.pessoa || data;
}

// Check if Unodesk is configured
export async function isUnodeskConfigured() {
  const creds = await getCredentials();
  return !!(creds.baseUrl && creds.signature && creds.token);
}
