import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { logger } from "@/lib/logger";
import { resolveWizardUserId } from "@/lib/wizard/repository";
import { advance, restartSession, startSession } from "@/lib/wizard/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const postSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().min(1).optional(),
});

function originFromRequest(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3001";
  return `${proto}://${host}`;
}

async function userIdFromAuth(session: { user?: { id?: string } } | null) {
  const raw = (session?.user as { id?: string } | undefined)?.id ?? null;
  const userId = await resolveWizardUserId(raw);
  if (raw && !userId) return { error: "stale_session" as const, userId: null };
  return { userId, error: null };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const auth = await userIdFromAuth(session);
    if (auth.error === "stale_session") {
      return NextResponse.json(
        { error: "stale_session", message: "Sessão de login inválida. Saia e entre novamente no gestor." },
        { status: 401 },
      );
    }
    const userId = auth.userId;
    const body = postSchema.parse(await request.json());

    const result = await advance({
      userId,
      sessionId: body.sessionId,
      message: body.message,
      channel: "web",
      origin: originFromRequest(request),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    logger.error("[wizard:chat] POST error", err instanceof Error ? err.stack ?? err.message : String(err));
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "internal_error", message: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const auth = await userIdFromAuth(session);
    if (auth.error === "stale_session") {
      return NextResponse.json(
        { error: "stale_session", message: "Sessão de login inválida. Saia e entre novamente no gestor." },
        { status: 401 },
      );
    }
    const result = await startSession({
      userId: auth.userId,
      channel: "web",
      origin: originFromRequest(request),
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    logger.error("[wizard:chat] GET error", err instanceof Error ? err.stack ?? err.message : String(err));
    return NextResponse.json(
      { error: "internal_error", message: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 },
    );
  }
}

const restartSchema = z.object({ sessionId: z.string().min(1) });

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = restartSchema.parse(await request.json().catch(() => ({})));
    const history = await restartSession(body.sessionId);
    return NextResponse.json({ sessionId: body.sessionId, history });
  } catch (err: any) {
    logger.error("[wizard:chat] DELETE error", String(err));
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "invalid_input", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
