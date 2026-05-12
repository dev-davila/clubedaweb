export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createEvolutionClient } from "@/lib/evolution-api";

/**
 * CRON endpoint: Processes pending scheduled contacts whose time has arrived.
 * For each one with autoSend=true and a message, sends the message via WhatsApp
 * using the contact's linked instance (or the owner's first connected instance).
 * Updates status to "sent" on success or "failed" on error.
 */
export async function GET() {
  const results: { id: string; contact: string; status: string; error?: string }[] = [];

  try {
    const now = new Date();

    // Find all pending schedules that are due
    const pendingSchedules = await prisma.waScheduledContact.findMany({
      where: {
        status: "pending",
        autoSend: true,
        scheduledAt: { lte: now },
        message: { not: null }, // only send if there's a message
      },
      include: {
        contact: {
          include: {
            instance: { include: { server: true } },
          },
        },
      },
      take: 20, // process max 20 per run to avoid timeouts
      orderBy: { scheduledAt: "asc" },
    });

    if (pendingSchedules.length === 0) {
      return NextResponse.json({ message: "Nenhum agendamento pendente", processed: 0 });
    }

    // Cache instances per owner to avoid repeated lookups
    const ownerInstanceCache: Record<string, any> = {};

    for (const schedule of pendingSchedules) {
      const contactName = schedule.contact.name;
      const phone = schedule.contact.phone;

      try {
        // Determine which instance to use
        let instance = schedule.contact.instance;

        // If no instance linked to contact, find the owner's first connected instance
        if (!instance) {
          if (!ownerInstanceCache[schedule.ownerId]) {
            ownerInstanceCache[schedule.ownerId] = await prisma.evolutionInstance.findFirst({
              where: {
                ownerId: schedule.ownerId,
                status: "open", // only connected instances
              },
              include: { server: true },
            });
          }
          instance = ownerInstanceCache[schedule.ownerId];
        }

        if (!instance || !instance.server) {
          // No instance available — mark as failed
          await prisma.waScheduledContact.update({
            where: { id: schedule.id },
            data: {
              status: "failed",
              sentError: "Nenhuma inst\u00e2ncia WhatsApp conectada encontrada",
              updatedAt: now,
            },
          });
          results.push({ id: schedule.id, contact: contactName, status: "failed", error: "No instance" });
          continue;
        }

        // Send message via Evolution API
        const client = createEvolutionClient({
          apiUrl: instance.server.apiUrl,
          apiKey: instance.server.apiKey,
        });

        const token = instance.instanceToken || instance.server.apiKey;

        await client.sendText(
          instance.instanceName,
          token,
          phone,
          schedule.message!
        );

        // Update status to sent
        await prisma.waScheduledContact.update({
          where: { id: schedule.id },
          data: {
            status: "sent",
            sentAt: now,
            completedAt: now,
            sentError: null,
            updatedAt: now,
          },
        });

        results.push({ id: schedule.id, contact: contactName, status: "sent" });
        console.log(`[CRON Agendamentos] Enviado para ${contactName} (${phone})`);

      } catch (err: any) {
        const errorMsg = err.message?.slice(0, 500) || "Erro desconhecido";
        console.error(`[CRON Agendamentos] Erro ao enviar para ${contactName}:`, errorMsg);

        await prisma.waScheduledContact.update({
          where: { id: schedule.id },
          data: {
            status: "failed",
            sentError: errorMsg,
            updatedAt: now,
          },
        });

        results.push({ id: schedule.id, contact: contactName, status: "failed", error: errorMsg });
      }
    }

    return NextResponse.json({
      message: `Processados ${results.length} agendamentos`,
      processed: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (err: any) {
    console.error("[CRON Agendamentos] Erro geral:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
