/**
 * Lê contatos atualizados do SiteConfig (editáveis pelo gestor em
 * /gestor/aparencia) e aplica em HTML do Stitch via replaceFakeContacts.
 *
 * Roda em TODA renderização pública — quando user edita telefone no
 * admin, footer atualiza imediatamente.
 */

import { prisma } from "@/lib/db";
import { replaceFakeContacts } from "./replace-contacts";
import type { WizardAnswers } from "@/lib/wizard/types";

const CONTACT_KEYS = [
  "contact_phone",
  "contact_email",
  "contact_whatsapp",
  "contact_address",
  "contact_hours",
  "company_name",
] as const;

/** Lê os 6 valores de contato do SiteConfig. Cache curto (1 request). */
export async function getCurrentSiteContacts(): Promise<Partial<WizardAnswers>> {
  try {
    const rows = await prisma.siteConfig.findMany({
      where: { key: { in: [...CONTACT_KEYS] } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      contactPhone: map.get("contact_phone") || undefined,
      contactEmail: map.get("contact_email") || undefined,
      contactWhatsapp: map.get("contact_whatsapp") || undefined,
      contactAddress: map.get("contact_address") || undefined,
      contactHours: map.get("contact_hours") || undefined,
      companyName: map.get("company_name") || undefined,
    };
  } catch {
    return {};
  }
}

/** Aplica contatos atuais no HTML, com fallback pros do briefing. */
export async function applyCurrentContacts(
  html: string,
  fallbackAnswers?: Partial<WizardAnswers>,
): Promise<string> {
  const current = await getCurrentSiteContacts();
  // Merge: SiteConfig sobrescreve fallback (briefing)
  const answers: WizardAnswers = {
    ...(fallbackAnswers ?? {}),
    ...Object.fromEntries(Object.entries(current).filter(([, v]) => v)),
  };
  if (!answers.contactPhone && !answers.contactEmail && !answers.contactWhatsapp && !answers.companyName) {
    return html;
  }
  return replaceFakeContacts(html, answers);
}
