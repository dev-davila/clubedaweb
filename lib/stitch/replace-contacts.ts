import type { WizardAnswers } from "@/lib/wizard/types";

/**
 * Stitch inventa contatos plausíveis (telefones, emails, links wa.me) mesmo
 * quando o briefing tem os reais. Esta função reescreve todos os pontos de
 * contato fake do HTML pelos valores do briefing, mantendo o restante do
 * conteúdo intacto.
 */
export function replaceFakeContacts(html: string, answers: WizardAnswers): string {
  let out = html;

  // Telefone — substitui qualquer tel:XXXX e exibições no texto
  const phone = answers.contactPhone?.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    // tel:XXXX
    out = out.replace(/href=(["'])tel:[^"']*\1/gi, `href=$1tel:${digits}$1`);
    // Texto exibido entre tags — só substitui se Stitch usou número diferente
    // ex.: `>11 9999-9999<` ou `>(11) 99999-9999<` — preserva números legítimos
    // que casam com o telefone real.
    if (digits.length >= 8) {
      const display = phone;
      out = out.replace(
        />\s*\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\s*</g,
        (match) => (match.includes(digits.slice(0, 4)) ? match : `>${display}<`),
      );
    }
  }

  // Email — substitui só emails com domínio claramente "inventado" pelo
  // Stitch (que casa com a empresa: vitalissaude.com.br, contato.NOMEEMPRESA…).
  // NÃO substitui emails que sejam claramente reais e diferentes (ex: provedor
  // grande tipo @gmail.com, @outlook.com, ou domínio do próprio user).
  const email = answers.contactEmail?.trim();
  if (email) {
    const realDomain = email.split("@")[1]?.toLowerCase() ?? "";
    out = out.replace(/href=(["'])mailto:[^"']*\1/gi, `href=$1mailto:${email}$1`);
    // Detecta domínios inventados pelo Stitch — gera versão "slug" do nome da
    // empresa pra comparar.
    const company = answers.companyName?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
    out = out.replace(
      /\b[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})\b/gi,
      (match, domain: string) => {
        const d = domain.toLowerCase();
        // Mantém emails reais (provedor grande, domínio do próprio user, mesmo email)
        if (d === realDomain) return match;
        if (/(gmail|outlook|hotmail|yahoo|icloud|protonmail|live|uol|terra|bol|globo|ig)\./i.test(d)) return match;
        // Substitui só se o domínio claramente inventou o nome da empresa
        const dCore = d.replace(/\.(com|com\.br|net|net\.br|org|org\.br|io|app|tech|saude)$/i, "").replace(/[^a-z0-9]/g, "");
        if (company && (dCore.includes(company.slice(0, 6)) || company.includes(dCore))) return email;
        // Domínio desconhecido — preserva
        return match;
      },
    );
  }

  // WhatsApp — formata wa.me
  const whatsappRaw = answers.contactWhatsapp?.trim();
  if (whatsappRaw) {
    let wa = whatsappRaw.replace(/\D/g, "");
    if (wa.length === 10 || wa.length === 11) wa = `55${wa}`; // BR sem DDI
    out = out.replace(
      /href=(["'])https?:\/\/(api\.)?wa\.me\/[^"']*\1/gi,
      `href=$1https://wa.me/${wa}$1`,
    );
    out = out.replace(
      /href=(["'])https?:\/\/(api\.)?whatsapp\.com\/send[^"']*\1/gi,
      `href=$1https://wa.me/${wa}$1`,
    );
  }

  // Endereço — quando aparece "Av. ..." gerada pelo Stitch, substitui pelo real
  const address = answers.contactAddress?.trim();
  if (address) {
    // Substitui só se aparece "Av.", "Rua", "Alameda" + nº — heurística cuidadosa
    // pra não destruir endereço real igual ou parecido.
    out = out.replace(
      /<address[^>]*>([\s\S]{0,300}?)<\/address>/gi,
      (match, inner) =>
        inner.toLowerCase().includes(address.slice(0, 15).toLowerCase())
          ? match
          : `<address>${escapeHtml(address)}</address>`,
    );
  }

  // Nome da empresa — substitui variações estranhas que o Stitch inventa
  // (ex.: "VITALITY" no lugar de "Vitalis Saúde Integrativa") em title, brand
  // do header e qualquer span/h1/h2 que seja claramente a marca.
  const companyName = answers.companyName?.trim();
  if (companyName) {
    // Gera variações comuns que Stitch encurta — primeira palavra ou nickname
    const firstWord = companyName.split(/\s+/)[0];
    const variants = new Set<string>();
    if (firstWord.length >= 4) {
      variants.add(firstWord.toUpperCase());
      // Variações tipo "VITALITY" (sufixo Y ao 1º nome "VITAL")
      if (firstWord.length >= 5) {
        const stem = firstWord.slice(0, firstWord.length - 1);
        variants.add(stem.toUpperCase() + "Y");
        variants.add(stem.toUpperCase() + "ITY");
      }
    }
    for (const v of variants) {
      if (v === companyName.toUpperCase()) continue;
      // Substitui só quando é a marca isolada (entre tags)
      const re = new RegExp(`>\\s*${v}\\s*<`, "g");
      out = out.replace(re, `>${escapeHtml(companyName)}<`);
    }
    out = out.replace(
      /<title>([^<]*)<\/title>/i,
      (match, inner) => {
        const tail = inner.split("|").pop()?.trim() ?? "Home";
        return inner.toLowerCase().includes(companyName.toLowerCase())
          ? match
          : `<title>${escapeHtml(companyName)} | ${tail}</title>`;
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
