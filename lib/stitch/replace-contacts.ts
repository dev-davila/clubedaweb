import type { WizardAnswers } from "@/lib/wizard/types";

/**
 * Substitui contatos no HTML por idempotência: se o match já tem o valor
 * "real" (igual ao do briefing), preserva; senão, substitui.
 *
 * Esta função roda DEPOIS de markContacts no publish, e como fallback no
 * render quando o HTML não tem marcadores. Pra cobertura completa, a fonte
 * primária de verdade é o data-cdw-contact (vide apply-current-contacts.ts).
 */
export function replaceFakeContacts(html: string, answers: WizardAnswers): string {
  let out = html;

  // ------------- Telefone -------------
  const phone = answers.contactPhone?.trim();
  if (phone) {
    const newDigits = phone.replace(/\D/g, "");
    if (newDigits.length >= 8) {
      out = out.replace(/href=(["'])tel:[^"']*\1/gi, `href=$1tel:${newDigits}$1`);
      const phoneRe = /(?<!\d)\(?(\d{2})\)?[\s.-]?(9?\d{4})[\s.-]?(\d{4})(?!\d)/g;
      out = out.replace(phoneRe, (match) => {
        const matchDigits = match.replace(/\D/g, "");
        if (matchDigits === newDigits) return match;
        return phone;
      });
    }
  }

  // ------------- Email -------------
  // Idempotência por STRING completa (email todo, não só domínio). Substitui
  // qualquer email que NÃO seja igual ao desejado E que NÃO seja claramente
  // um email pessoal de terceiro (gmail/outlook etc) que o Stitch usou pra
  // testimonials. Diferente da v1: não preserva email do mesmo dominio.
  const email = answers.contactEmail?.trim();
  if (email) {
    out = out.replace(/href=(["'])mailto:[^"']*\1/gi, `href=$1mailto:${email}$1`);
    const personalProviders = /(@gmail\.|@outlook\.|@hotmail\.|@yahoo\.|@icloud\.|@protonmail\.|@live\.|@uol\.|@terra\.|@bol\.|@globo\.|@ig\.)/i;
    out = out.replace(
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
      (match) => {
        if (match.toLowerCase() === email.toLowerCase()) return match; // já é o desejado
        if (personalProviders.test(match)) return match; // email pessoal de terceiro — preserva
        return email; // qualquer outro caso → substitui pelo email do briefing/admin
      },
    );
  }

  // ------------- WhatsApp -------------
  // Reescreve wa.me/whatsapp.com/send + número textual (regex igual telefone
  // mas com filtro pelos dígitos do whatsapp pra não conflitar com phone).
  const whatsappRaw = answers.contactWhatsapp?.trim();
  if (whatsappRaw) {
    let wa = whatsappRaw.replace(/\D/g, "");
    if (wa.length === 10 || wa.length === 11) wa = `55${wa}`;
    out = out.replace(
      /href=(["'])https?:\/\/(api\.)?wa\.me\/[^"']*\1/gi,
      `href=$1https://wa.me/${wa}$1`,
    );
    out = out.replace(
      /href=(["'])https?:\/\/(api\.)?whatsapp\.com\/send[^"']*\1/gi,
      `href=$1https://wa.me/${wa}$1`,
    );
  }

  // ------------- Endereço -------------
  // Só pega <address>: substitui SEMPRE pelo novo valor (idempotente —
  // se já era o real, escrever o mesmo valor não muda nada).
  const address = answers.contactAddress?.trim();
  if (address) {
    out = out.replace(
      /<address\b([^>]*)>[\s\S]{0,500}?<\/address>/gi,
      (_match, attrs: string) => `<address${attrs}>${escapeHtml(address)}</address>`,
    );
  }

  // ------------- Hours -------------
  // Sem regex confiável (texto livre demais). Hours só funciona via marker
  // (vide apply-current-contacts.ts). Aqui é no-op.

  // ------------- Nome da empresa -------------
  const companyName = answers.companyName?.trim();
  if (companyName) {
    const norm = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
    const companyNorm = norm(companyName);

    // Variantes que o Stitch costuma inventar — primeira palavra em CAPS
    const firstWord = companyName.split(/\s+/)[0];
    const variants = new Set<string>();
    if (firstWord.length >= 4) {
      variants.add(firstWord.toUpperCase());
      variants.add(norm(firstWord).toUpperCase());
      if (firstWord.length >= 5) {
        const stem = firstWord.slice(0, firstWord.length - 1);
        variants.add(stem.toUpperCase() + "Y");
        variants.add(stem.toUpperCase() + "ITY");
      }
    }
    for (const v of variants) {
      if (norm(v) === companyNorm) continue;
      // Substitui quando é a marca isolada entre tags (>VARIANTE<)
      const re = new RegExp(`>\\s*${escapeRegex(v)}\\s*<`, "g");
      out = out.replace(re, `>${escapeHtml(companyName)}<`);
    }
    // <title>: sempre atualiza pra garantir nome certo no head (idempotente).
    out = out.replace(
      /<title>([^<]*)<\/title>/i,
      (_match, inner: string) => {
        const tail = inner.includes("|") ? inner.split("|").slice(1).join("|").trim() : "Home";
        return `<title>${escapeHtml(companyName)} | ${tail}</title>`;
      },
    );
  }

  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
