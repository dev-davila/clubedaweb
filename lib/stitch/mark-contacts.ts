/**
 * Envolve cada ponto de contato no HTML com atributo `data-cdw-contact`
 * pra permitir substituição cirúrgica no render (sem regex no body inteiro).
 *
 * Roda no publish após replaceFakeContacts: os valores já são reais e
 * só precisamos marcar onde ficam. Idempotente — se já existe um wrap
 * `<span data-cdw-contact="X">`, não duplica.
 *
 * Detecções:
 *  - tel: links → adiciona data-cdw-contact="phone-link" no <a>
 *  - mailto: links → adiciona data-cdw-contact="email-link" no <a>
 *  - wa.me/whatsapp.com/send → data-cdw-contact="whatsapp-link" no <a>
 *  - <address>...</address> → data-cdw-contact="address"
 *  - Texto puro com pattern de telefone → wrap em <span data-cdw-contact="phone">
 *  - Texto puro com pattern de email → wrap em <span data-cdw-contact="email">
 *  - companyName em texto isolado → wrap em <span data-cdw-contact="company">
 *
 * Hours NÃO é marcado automaticamente (texto livre demais). Gestor pode
 * marcar manualmente via editor visual, ou no Stitch template via prompt.
 */

import type { WizardAnswers } from "@/lib/wizard/types";

const PHONE_RE = /(?<!\d)(\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4})(?!\d)/g;
const EMAIL_RE = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;

export function markContacts(html: string, answers: WizardAnswers): string {
  let out = html;

  // 1) Adiciona data-cdw-contact em LINKS (tel:, mailto:, wa.me)
  // Idempotente: regex inclui guard contra wrap duplo.

  // tel:
  out = out.replace(
    /<a\b([^>]*?\bhref=["']tel:[^"']+["'][^>]*?)>/gi,
    (match, attrs: string) => {
      if (/data-cdw-contact/i.test(attrs)) return match;
      return `<a${attrs} data-cdw-contact="phone-link">`;
    },
  );

  // mailto:
  out = out.replace(
    /<a\b([^>]*?\bhref=["']mailto:[^"']+["'][^>]*?)>/gi,
    (match, attrs: string) => {
      if (/data-cdw-contact/i.test(attrs)) return match;
      return `<a${attrs} data-cdw-contact="email-link">`;
    },
  );

  // wa.me / whatsapp.com/send
  out = out.replace(
    /<a\b([^>]*?\bhref=["']https?:\/\/(?:api\.)?(?:wa\.me|whatsapp\.com\/send)[^"']*["'][^>]*?)>/gi,
    (match, attrs: string) => {
      if (/data-cdw-contact/i.test(attrs)) return match;
      return `<a${attrs} data-cdw-contact="whatsapp-link">`;
    },
  );

  // 2) <address> → marcador
  out = out.replace(
    /<address\b([^>]*)>/gi,
    (match, attrs: string) => {
      if (/data-cdw-contact/i.test(attrs)) return match;
      return `<address${attrs} data-cdw-contact="address">`;
    },
  );

  // 3) Texto puro de telefone (BR formato) — envolve em span
  const phone = answers.contactPhone?.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    out = wrapTextOccurrences(out, PHONE_RE, "phone", (match) => {
      const matchDigits = match.replace(/\D/g, "");
      // só marca se for o telefone real (evita falsos positivos tipo CEP, datas etc)
      return matchDigits === digits;
    });
  }

  // 4) Texto puro de email
  const email = answers.contactEmail?.trim();
  if (email) {
    out = wrapTextOccurrences(out, EMAIL_RE, "email", (match) => {
      return match.toLowerCase() === email.toLowerCase();
    });
  }

  // 5) WhatsApp em texto puro — usa mesmo regex de telefone, mas filtra pelos
  // dígitos do whatsapp
  const whatsapp = answers.contactWhatsapp?.trim();
  if (whatsapp && whatsapp !== phone) {
    const waDigits = whatsapp.replace(/\D/g, "");
    out = wrapTextOccurrences(out, PHONE_RE, "whatsapp", (match) => {
      const matchDigits = match.replace(/\D/g, "");
      return matchDigits === waDigits;
    });
  }

  return out;
}

/**
 * Envolve ocorrências de `regex` em `<span data-cdw-contact="<field>">match</span>`
 * — desde que estejam em texto puro (entre tags, não dentro de outras tags).
 * `accept` filtra quais matches devem ser marcados.
 */
function wrapTextOccurrences(
  html: string,
  regex: RegExp,
  field: string,
  accept: (match: string) => boolean,
): string {
  // Estratégia: divide HTML em tokens [tag, text, tag, text...]. Aplica regex
  // só nos tokens text. Pula tokens dentro de <script>, <style>, comments,
  // ou que já estão dentro de um span data-cdw-contact existente.
  const SKIP_TAGS = /<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi;
  const COMMENTS = /<!--[\s\S]*?-->/g;

  // Marca regiões a pular (substitui por placeholder)
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

  // Token por token: tags vs texto
  const tokens = placeholder.split(/(<[^>]+>)/);
  const out: string[] = [];
  let inMarkedSpan = false;
  let openTagsStack: string[] = [];

  for (const tok of tokens) {
    if (tok.startsWith("<")) {
      // Detecta se entramos/saímos de um span marcado
      const markedOpen = /<span\b[^>]*\bdata-cdw-contact=["']?[a-z-]+["']?[^>]*>/i.test(tok);
      const markedClose = /<\/span>/i.test(tok) && inMarkedSpan;
      if (markedOpen) inMarkedSpan = true;
      else if (markedClose) inMarkedSpan = false;
      out.push(tok);

      // Rastreia tag stack pra evitar wrap dentro de <a data-cdw-contact="email-link">
      // (esses já são marcados como link, não precisa wrap do span dentro)
      const openMatch = tok.match(/^<([a-z][a-z0-9]*)\b/i);
      const closeMatch = tok.match(/^<\/([a-z][a-z0-9]*)/i);
      if (openMatch && !tok.endsWith("/>")) openTagsStack.push(openMatch[1].toLowerCase());
      else if (closeMatch) {
        const idx = openTagsStack.lastIndexOf(closeMatch[1].toLowerCase());
        if (idx >= 0) openTagsStack = openTagsStack.slice(0, idx);
      }
      continue;
    }
    if (inMarkedSpan) {
      out.push(tok);
      continue;
    }
    // Texto: aplica regex e wrap
    out.push(
      tok.replace(regex, (m) => {
        if (!accept(m)) return m;
        return `<span data-cdw-contact="${field}">${m}</span>`;
      }),
    );
  }

  let result = out.join("");
  // Restaura placeholders
  result = result.replace(/\x00SKIP(\d+)\x00/g, (_, idx) => skipped[Number(idx)]);
  return result;
}
