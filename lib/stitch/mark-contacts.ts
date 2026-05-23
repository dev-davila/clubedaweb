/**
 * Envolve cada ponto de contato no HTML com atributo `data-cdw-contact`
 * pra permitir substituição cirúrgica no render.
 *
 * Estratégia: marca AGRESSIVAMENTE qualquer texto que case com padrões
 * típicos (telefone BR, email, endereço com Av/Rua, horários "Seg a Sex"),
 * não só os valores exatos do briefing. Isso permite que o user edite
 * /gestor/aparencia depois e o pipeline substitua via marker.
 *
 * Idempotente: se um texto já está dentro de um span com data-cdw-contact,
 * não envolve de novo.
 */

import type { WizardAnswers } from "@/lib/wizard/types";

const PHONE_RE = /(?<!\d)(\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4})(?!\d)/g;
const EMAIL_RE = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
// Endereço: começa com "Av." "Avenida" "Rua" "R." "Alameda" "Al." "Travessa" "Praça"
const ADDRESS_RE = /(?:Avenida|Av\.?|Rua|R\.|Alameda|Al\.|Travessa|Praça|Estrada|Rodovia)\s+[A-Za-zÀ-ÿ\s]{2,60},?\s*\d{1,6}/g;
// Hours: padrões típicos
const HOURS_RE = /(?:Segunda|Seg\.?|Domingo|Dom\.?)[\s\S]{0,15}(?:Sexta|Sex\.?|Sábado|Sáb\.?|Domingo|Dom\.?)[\s\S]{0,50}\d+h(?:\s*(?:às|-|–)\s*\d+h)?/gi;
const PERSONAL_EMAIL = /(@gmail\.|@outlook\.|@hotmail\.|@yahoo\.|@icloud\.|@protonmail\.|@live\.|@uol\.|@terra\.|@bol\.|@globo\.|@ig\.)/i;

export function markContacts(html: string, answers: WizardAnswers): string {
  let out = html;

  // 1) Adiciona data-cdw-contact em links (tel:, mailto:, wa.me)
  out = out.replace(
    /<a\b([^>]*?\bhref=["']tel:[^"']+["'][^>]*?)>/gi,
    (match, attrs: string) =>
      /data-cdw-contact/i.test(attrs) ? match : `<a${attrs} data-cdw-contact="phone-link">`,
  );
  out = out.replace(
    /<a\b([^>]*?\bhref=["']mailto:[^"']+["'][^>]*?)>/gi,
    (match, attrs: string) =>
      /data-cdw-contact/i.test(attrs) ? match : `<a${attrs} data-cdw-contact="email-link">`,
  );
  out = out.replace(
    /<a\b([^>]*?\bhref=["']https?:\/\/(?:api\.)?(?:wa\.me|whatsapp\.com\/send)[^"']*["'][^>]*?)>/gi,
    (match, attrs: string) =>
      /data-cdw-contact/i.test(attrs) ? match : `<a${attrs} data-cdw-contact="whatsapp-link">`,
  );

  // 2) <address> inteiro
  out = out.replace(
    /<address\b([^>]*)>/gi,
    (match, attrs: string) =>
      /data-cdw-contact/i.test(attrs) ? match : `<address${attrs} data-cdw-contact="address">`,
  );

  // 3) Texto: marca qualquer match dos patterns
  const phoneDigits = answers.contactPhone?.replace(/\D/g, "") ?? "";
  const waDigits = answers.contactWhatsapp?.replace(/\D/g, "") ?? "";

  out = wrapTextOccurrences(out, PHONE_RE, (match) => {
    const md = match.replace(/\D/g, "");
    // Distingue whatsapp de phone se ambos definidos e diferentes
    if (waDigits && md === waDigits && md !== phoneDigits) return "whatsapp";
    return "phone";
  });

  out = wrapTextOccurrences(out, EMAIL_RE, (match) => {
    if (PERSONAL_EMAIL.test(match)) return null; // email pessoal → não marca
    return "email";
  });

  out = wrapTextOccurrences(out, ADDRESS_RE, () => "address");
  out = wrapTextOccurrences(out, HOURS_RE, () => "hours");

  return out;
}

/**
 * Envolve ocorrências em `<span data-cdw-contact="<field>">match</span>`,
 * só em texto puro (não dentro de outras tags). `decide(match)` retorna o
 * field ou null pra pular.
 */
function wrapTextOccurrences(
  html: string,
  regex: RegExp,
  decide: (match: string) => string | null,
): string {
  const SKIP_TAGS = /<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi;
  const COMMENTS = /<!--[\s\S]*?-->/g;

  const skipped: string[] = [];
  let placeholder = html;
  placeholder = placeholder.replace(SKIP_TAGS, (m) => {
    skipped.push(m);
    return `\x00SKIP${skipped.length - 1}\x00`;
  });
  placeholder = placeholder.replace(COMMENTS, (m) => {
    skipped.push(m);
    return `\x00SKIP${skipped.length - 1}\x00`;
  });

  const tokens = placeholder.split(/(<[^>]+>)/);
  const out: string[] = [];
  let inMarkedSpan = false;

  for (const tok of tokens) {
    if (tok.startsWith("<")) {
      const markedOpen = /<[a-z]+\b[^>]*\bdata-cdw-contact=["']?[a-z-]+["']?[^>]*>/i.test(tok);
      const closeTag = /^<\/[a-z]+/i.test(tok);
      if (markedOpen) inMarkedSpan = true;
      else if (closeTag && inMarkedSpan) inMarkedSpan = false;
      out.push(tok);
      continue;
    }
    if (inMarkedSpan) {
      out.push(tok);
      continue;
    }
    out.push(
      tok.replace(regex, (m) => {
        const field = decide(m);
        if (!field) return m;
        return `<span data-cdw-contact="${field}">${m}</span>`;
      }),
    );
  }

  let result = out.join("");
  result = result.replace(/\x00SKIP(\d+)\x00/g, (_, idx) => skipped[Number(idx)]);
  return result;
}
