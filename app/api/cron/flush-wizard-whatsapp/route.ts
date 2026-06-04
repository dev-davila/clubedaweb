import { NextRequest, NextResponse } from "next/server";
import { flushDueBuffers } from "@/lib/wizard/whatsapp-bridge";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Fallback/catch-up para o worker em instrumentation.ts.
 * Processa janelas de agregação do wizard/WhatsApp cujo debounce já venceu —
 * útil se o processo reiniciou no meio de uma janela. Seguro para rodar junto
 * com o worker (lock otimista por status no flushDueBuffers).
 */
function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = request.headers.get("authorization")?.replace("Bearer ", "");
  return provided === secret || provided === process.env.ABACUSAI_API_KEY;
}

async function run(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const result = await flushDueBuffers();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
