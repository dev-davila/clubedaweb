/**
 * Lê contatos atualizados do SiteConfig (editáveis pelo gestor em
 * /gestor/aparencia) e aplica em HTML do Stitch.
 *
 * ESTRATÉGIA MARKER-FIRST:
 *  1. Pra cada elemento com `data-cdw-contact="X"`, substitui conteúdo
 *     (innerHTML) ou href (em links) pelo valor atual.
 *  2. Pra elementos sem marker (HTML antigo), fallback pro regex via
 *     replaceFakeContacts.
 *
 * Cobre todos os 6 campos: phone, email, whatsapp, address, hours,
 * company_name.
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

/** Lê os 6 valores de contato do SiteConfig. */
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
  const answers: WizardAnswers = {
    ...(fallbackAnswers ?? {}),
    ...Object.fromEntries(Object.entries(current).filter(([, v]) => v)),
  };
  if (
    !answers.contactPhone &&
    !answers.contactEmail &&
    !answers.contactWhatsapp &&
    !answers.contactAddress &&
    !answers.contactHours &&
    !answers.companyName
  ) {
    return html;
  }

  // 1) Marker-first: substitui em [data-cdw-contact="X"]
  let out = applyMarkers(html, answers);

  // 2) Fallback regex pra qualquer ocorrência sem marker (HTML antigo / edge)
  out = replaceFakeContacts(out, answers);

  return out;
}

/**
 * Substitui conteúdo/href de elementos com data-cdw-contact.
 * NÃO usa DOM parser (HTML server-side é string). Regex baseado.
 */
function applyMarkers(html: string, answers: WizardAnswers): string {
  let out = html;

  const phone = answers.contactPhone?.trim();
  const email = answers.contactEmail?.trim();
  const whatsapp = answers.contactWhatsapp?.trim();
  const address = answers.contactAddress?.trim();
  const hours = answers.contactHours?.trim();
  const company = answers.companyName?.trim();

  if (phone) {
    const digits = phone.replace(/\D/g, "");
    out = replaceMarkedContent(out, "phone", escapeHtml(phone));
    out = replaceMarkedLink(out, "phone-link", `tel:${digits}`, escapeHtml(phone));
  }

  if (email) {
    out = replaceMarkedContent(out, "email", escapeHtml(email));
    out = replaceMarkedLink(out, "email-link", `mailto:${email}`, escapeHtml(email));
  }

  if (whatsapp) {
    let wa = whatsapp.replace(/\D/g, "");
    if (wa.length === 10 || wa.length === 11) wa = `55${wa}`;
    out = replaceMarkedContent(out, "whatsapp", escapeHtml(whatsapp));
    out = replaceMarkedLink(out, "whatsapp-link", `https://wa.me/${wa}`, null);
  }

  if (address) {
    out = replaceMarkedContent(out, "address", escapeHtml(address));
  }

  if (hours) {
    out = replaceMarkedContent(out, "hours", escapeHtml(hours));
  }

  if (company) {
    out = replaceMarkedContent(out, "company", escapeHtml(company));
    // <title> também: atualiza primeira parte (antes do |)
    out = out.replace(
      /<title>([^<]*)<\/title>/i,
      (_match, inner: string) => {
        const tail = inner.includes("|") ? inner.split("|").slice(1).join("|").trim() : "Home";
        return `<title>${escapeHtml(company)} | ${tail}</title>`;
      },
    );
  }

  return out;
}

/**
 * Substitui o INNER HTML de qualquer elemento com `data-cdw-contact="<field>"`.
 * Preserva atributos do elemento.
 */
function replaceMarkedContent(html: string, field: string, newContent: string): string {
  const re = new RegExp(
    `(<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*?\\bdata-cdw-contact=["']${field}["'][^>]*>)([\\s\\S]{0,500}?)(</\\2>)`,
    "gi",
  );
  return html.replace(re, (_match, open: string, _tag: string, _inner: string, close: string) => {
    return `${open}${newContent}${close}`;
  });
}

/**
 * Substitui href de link com data-cdw-contact="<field>-link" e opcionalmente
 * o conteúdo. Se `newContent` é null, preserva o conteúdo existente.
 */
function replaceMarkedLink(
  html: string,
  field: string,
  newHref: string,
  newContent: string | null,
): string {
  const re = new RegExp(
    `(<a\\b)([^>]*?\\bdata-cdw-contact=["']${field}["'][^>]*?)>([\\s\\S]{0,500}?)(</a>)`,
    "gi",
  );
  return html.replace(re, (_match, openA: string, attrs: string, inner: string, close: string) => {
    const updatedAttrs = /\bhref=/.test(attrs)
      ? attrs.replace(/\bhref=["'][^"']*["']/i, `href="${escapeAttr(newHref)}"`)
      : `${attrs} href="${escapeAttr(newHref)}"`;
    const content = newContent ?? inner;
    return `${openA}${updatedAttrs}>${content}${close}`;
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}
