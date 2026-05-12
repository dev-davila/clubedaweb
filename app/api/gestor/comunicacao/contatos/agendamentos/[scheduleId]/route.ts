export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

/** Convert datetime-local (BRT) to UTC. Brazil offset is always -03:00 (no DST since 2019). */
function brtToUtc(localStr: string): Date {
  const [datePart, timePart] = localStr.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = (timePart || "00:00").split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h + 3, mi));
}

// PUT — update a scheduled contact (status, notes, etc)
export async function PUT(req: NextRequest, { params }: { params: { scheduleId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { title, message, scheduledAt, status, notes, autoSend, sentError } = body;

    const existing = await prisma.waScheduledContact.findFirst({
      where: { id: params.scheduleId, ownerId: session.user.id },
    });
    if (!existing) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (message !== undefined) data.message = message || null;
    if (scheduledAt !== undefined) data.scheduledAt = brtToUtc(scheduledAt);
    if (notes !== undefined) data.notes = notes || null;
    if (autoSend !== undefined) data.autoSend = autoSend;
    if (sentError !== undefined) data.sentError = sentError; // null clears the error
    if (status !== undefined) {
      data.status = status;
      if (status === "done") data.completedAt = new Date();
      if (status === "pending") {
        data.completedAt = null;
        data.sentAt = null;
        data.sentError = null;
      }
    }

    const updated = await prisma.waScheduledContact.update({
      where: { id: params.scheduleId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[SCHEDULE PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove scheduled contact
export async function DELETE(req: NextRequest, { params }: { params: { scheduleId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const existing = await prisma.waScheduledContact.findFirst({
      where: { id: params.scheduleId, ownerId: session.user.id },
    });
    if (!existing) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

    await prisma.waScheduledContact.delete({ where: { id: params.scheduleId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[SCHEDULE DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
