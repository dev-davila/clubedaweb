export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

/**
 * Convert a datetime-local string (assumed BRT / America/Sao_Paulo) to a proper UTC Date.
 * datetime-local gives us "YYYY-MM-DDTHH:MM" without timezone info.
 * If we just do new Date(val), Node (UTC server) treats it as UTC — wrong!
 * We need to figure out whether that BRT moment is -03:00 or -02:00 (daylight saving).
 */
function brtToUtc(localStr: string): Date {
  // Append a dummy offset so Date parses the digits we gave, then we adjust.
  // Strategy: create date at UTC with those digits, figure out the real BRT offset, adjust.
  const [datePart, timePart] = localStr.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = (timePart || "00:00").split(":").map(Number);

  // Build a date assuming the user typed BRT = UTC-3 (standard).
  // São Paulo DST was abolished in 2019 — Brazil no longer observes DST,
  // so the offset is always -03:00.
  const utc = new Date(Date.UTC(y, mo - 1, d, h + 3, mi));
  return utc;
}

// GET — list scheduled contacts for a contact
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const schedules = await prisma.waScheduledContact.findMany({
      where: { contactId: params.id, ownerId: session.user.id },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json(schedules);
  } catch (error: any) {
    console.error("[SCHEDULES GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — create a new scheduled contact
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { title, message, scheduledAt, notes, autoSend } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json({ error: "Título e data são obrigatórios" }, { status: 400 });
    }

    // Verify contact belongs to user
    const contact = await prisma.waContact.findFirst({
      where: { id: params.id, ownerId: session.user.id },
    });
    if (!contact) return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });

    const schedule = await prisma.waScheduledContact.create({
      data: {
        contactId: params.id,
        title,
        message: message || null,
        scheduledAt: brtToUtc(scheduledAt),
        notes: notes || null,
        autoSend: autoSend !== undefined ? autoSend : true,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error("[SCHEDULES POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
