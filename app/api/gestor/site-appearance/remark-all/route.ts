/**
 * Aplica markContacts em todos os HTMLs Stitch salvos no SiteConfig.
 *
 * One-shot: roda manualmente após deploy do marker-based contacts pra
 * que sites já publicados ganhem os data-cdw-contact retroativamente.
 * Idempotente: rodar várias vezes não causa wrap duplo.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCurrentSiteContacts } from "@/lib/stitch/apply-current-contacts";
import { markContacts } from "@/lib/stitch/mark-contacts";
import type { WizardAnswers } from "@/lib/wizard/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Pega contatos atuais (que vão ser usados pra detectar o que marcar)
    const current = await getCurrentSiteContacts();

    // Fallback nos answers do briefing se faltar algum campo
    const wizardSession = await prisma.wizardSession.findFirst({
      where: { state: "published" },
      orderBy: { updatedAt: "desc" },
    });
    const briefingAnswers =
      (wizardSession?.data as { answers?: WizardAnswers } | null)?.answers ?? {};

    const answers: WizardAnswers = {
      ...briefingAnswers,
      ...Object.fromEntries(Object.entries(current).filter(([, v]) => v)),
    };

    // Lê todos os HTMLs Stitch (obrigatórias + customs)
    const rows = await prisma.siteConfig.findMany({
      where: { key: { startsWith: "stitch_html_" } },
    });

    let updated = 0;
    const samples: Array<{ key: string; before: number; after: number; markers: number }> = [];

    for (const row of rows) {
      if (!row.value?.trim()) continue;
      const before = row.value;
      const after = markContacts(before, answers);
      if (after === before) continue;
      await prisma.siteConfig.update({
        where: { key: row.key },
        data: { value: after },
      });
      updated++;
      const markerCount = (after.match(/\bdata-cdw-contact=/g) ?? []).length;
      samples.push({
        key: row.key,
        before: before.length,
        after: after.length,
        markers: markerCount,
      });
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      updated,
      samples,
    });
  } catch (err) {
    logger.error("[remark-all] POST", err instanceof Error ? err.stack : String(err));
    const msg = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: "internal_error", message: msg.slice(0, 200) }, { status: 500 });
  }
}
