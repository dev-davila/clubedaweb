import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const schema = z.object({
  contact_phone: z.string().max(40).optional(),
  contact_email: z.string().email().or(z.literal("")).optional(),
  contact_whatsapp: z.string().max(40).optional(),
  contact_address: z.string().max(300).optional(),
  contact_hours: z.string().max(120).optional(),
  company_name: z.string().max(120).optional(),
});

const LABELS: Record<string, string> = {
  contact_phone: "Telefone principal",
  contact_email: "E-mail principal",
  contact_whatsapp: "WhatsApp",
  contact_address: "Endereço",
  contact_hours: "Horário de atendimento",
  company_name: "Nome da empresa",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: Object.keys(LABELS) } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({
    contact_phone: map.contact_phone ?? "",
    contact_email: map.contact_email ?? "",
    contact_whatsapp: map.contact_whatsapp ?? "",
    contact_address: map.contact_address ?? "",
    contact_hours: map.contact_hours ?? "",
    company_name: map.company_name ?? "",
  });
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = schema.parse(await request.json());

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue;
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value: value || "", category: "contact" },
        create: { key, value: value || "", category: "contact", label: LABELS[key] ?? key },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[site-contacts] PUT", err instanceof Error ? err.stack : String(err));
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
