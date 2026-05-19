import type { WizardAnswers } from "./types";

const URL_LIKE = /https?:\/\/[^\s<>"']+/gi;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/g;
const WHATSAPP_HINT = /whatsapp|whats|wpp|zap/i;

export function extractCompanyAndIndustry(message: string): {
  companyName?: string;
  industry?: string;
} {
  const trimmed = message.trim();
  if (!trimmed) return {};
  const sep = /\s+[—\-:,]\s+/;
  if (sep.test(trimmed)) {
    const [name, ...rest] = trimmed.split(sep);
    return { companyName: name.trim(), industry: rest.join(" ").trim() };
  }
  const firstStop = trimmed.search(/[.!?\n]/);
  if (firstStop > 0 && firstStop < trimmed.length - 1) {
    return {
      companyName: trimmed.slice(0, firstStop).trim(),
      industry: trimmed.slice(firstStop + 1).trim(),
    };
  }
  return { companyName: trimmed };
}

export function extractUrls(message: string, max = 3): string[] {
  return (message.match(URL_LIKE) ?? []).slice(0, max);
}

export function parseReferences(message: string): string[] {
  const urls = extractUrls(message, 3);
  if (urls.length > 0) return urls;
  if (/\b(não|nao|nenhum|sem)\b/i.test(message)) return [];
  return message
    .split(/[\s,;]+/)
    .filter((t) => /\.[a-z]{2,}/i.test(t))
    .slice(0, 3);
}

export function parseExistingWebsite(message: string): string | undefined {
  const urls = extractUrls(message, 1);
  if (urls[0]) return urls[0];
  if (/\b(não|nao|não tenho|nao tenho|sem site)\b/i.test(message)) return undefined;
  return undefined;
}

/** Extrai contato de texto livre para campos do site. */
export function parseContactInfo(message: string): Partial<WizardAnswers> {
  const out: Partial<WizardAnswers> = { contactInfo: message.trim() };
  const emails = message.match(EMAIL_RE);
  if (emails?.[0]) out.contactEmail = emails[0];

  const phones = message.match(PHONE_RE);
  if (phones?.length) {
    const normalized = phones.map((p) => p.replace(/\D/g, ""));
    if (WHATSAPP_HINT.test(message) && normalized[0]) {
      out.contactWhatsapp = normalized[0];
    } else if (normalized[0]) {
      out.contactPhone = normalized[0];
    }
    if (normalized[1] && WHATSAPP_HINT.test(message)) {
      out.contactWhatsapp = normalized[1];
    }
  }

  const lines = message.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const addressLine = lines.find(
    (l) =>
      /\b(rua|av\.|avenida|rod\.|bairro|cep|nº|numero|n°)\b/i.test(l) ||
      (l.length > 12 && !EMAIL_RE.test(l) && !PHONE_RE.test(l) && !URL_LIKE.test(l)),
  );
  if (addressLine) out.contactAddress = addressLine;

  const hoursLine = lines.find((l) => /\b(seg|horário|horario|às|das \d|24h|comercial)\b/i.test(l));
  if (hoursLine) out.contactHours = hoursLine;

  return out;
}

export function parseOfferings(message: string): string {
  return message.trim();
}
