/**
 * TEMPORÁRIO — restaura um backup do site Stitch (HTMLs + contatos + menu).
 * Recebe o JSON do backup no body. Usado pra reverter uma geração ruim.
 * Remover após uso.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { publishStitchPages } from "@/lib/stitch/published-pages";
import { saveStitchMenuItems, type StitchMenuItem } from "@/lib/stitch/menu-items";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json();
    const pages = body.pages as Record<string, string | null>;
    const contacts = body.contacts as Record<string, string> | undefined;
    const menu = body.menu as { items?: StitchMenuItem[] } | undefined;

    const out: Record<string, unknown> = {};

    // 1) Páginas + render mode (publishStitchPages seta site_render_mode=stitch)
    const valid = Object.fromEntries(
      Object.entries(pages ?? {}).filter(([, v]) => v && v.trim().length > 0),
    );
    await publishStitchPages(valid);
    out.pages = Object.keys(valid);

    // 2) Contatos
    if (contacts) {
      const labels: Record<string, string> = {
        contact_phone: "Telefone principal",
        contact_email: "E-mail principal",
        contact_whatsapp: "WhatsApp",
        contact_address: "Endereço",
        contact_hours: "Horário de atendimento",
        company_name: "Nome da empresa",
      };
      for (const [key, value] of Object.entries(contacts)) {
        if (!(key in labels)) continue;
        await prisma.siteConfig.upsert({
          where: { key },
          update: { value: value ?? "", category: "contact" },
          create: { key, value: value ?? "", category: "contact", label: labels[key] },
        });
      }
      out.contacts = Object.keys(contacts);
    }

    // 3) Menu
    if (menu?.items?.length) {
      await saveStitchMenuItems(menu.items);
      out.menuItems = menu.items.length;
    }

    logger.info("[restore-stitch] restaurado", out);
    return NextResponse.json({ ok: true, restored: out });
  } catch (err) {
    logger.error("[restore-stitch] POST", err instanceof Error ? err.stack : String(err));
    return NextResponse.json(
      { error: "internal_error", message: err instanceof Error ? err.message : "erro" },
      { status: 500 },
    );
  }
}
