/**
 * Form do Stitch vem com `action="#"` ou sem action — não envia nada.
 * Reescreve action/method pro endpoint real `/api/contact` e nomeia
 * inputs pro schema do backend aceitar (`name`, `email`, `phone`, `message`).
 *
 * O backend espera: name (required), email (required), message (required),
 * phone (optional), company (optional), subject (optional).
 */

const FIELD_MAP: Array<[RegExp, string]> = [
  [/\b(nome\s?completo|seu\s?nome|nome)\b/i, "name"],
  [/\b(e[-\s]?mail|email)\b/i, "email"],
  [/\b(telefone|fone|whatsapp|celular|tel)\b/i, "phone"],
  [/\b(empresa|company|cnpj)\b/i, "company"],
  [/\b(assunto|subject|qual o assunto)\b/i, "subject"],
  [/\b(mensagem|message|sua mensagem|como podemos ajudar|descreva)\b/i, "message"],
];

function inferFieldName(input: string): string | null {
  // Prioriza aria-label > name > id > placeholder (semântica > artefato).
  // Placeholder de email tipo "rodrigo@empresa.com.br" tem "empresa" e
  // dispararia falso positivo no map de company se viesse primeiro.
  const candidates: string[] = [];
  const aria = input.match(/aria-label=["']([^"']+)["']/i)?.[1];
  if (aria) candidates.push(aria);
  const nm = input.match(/\bname=["']([^"']+)["']/i)?.[1];
  if (nm) candidates.push(nm);
  const id = input.match(/\bid=["']([^"']+)["']/i)?.[1];
  if (id) candidates.push(id);
  const ph = input.match(/placeholder=["']([^"']+)["']/i)?.[1];
  if (ph) candidates.push(ph);

  // Heurística adicional pelo TYPE do input — "type=email" → email direto
  const type = input.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase();
  if (type === "email") return "email";
  if (type === "tel") return "phone";

  for (const c of candidates) {
    for (const [re, mapped] of FIELD_MAP) if (re.test(c)) return mapped;
  }
  return null;
}

export function normalizeStitchForms(html: string): string {
  // Conserta um bug do polish antigo: '<formclass=' sem espaço entre tag e attr.
  // Idempotente.
  html = html.replace(/<form([^\s>])/gi, "<form $1");

  return html.replace(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi, (_match, attrs, body) => {
    // Reescreve action + method
    let nextAttrs = attrs;
    // Remove action existente e force POST /api/contact
    nextAttrs = nextAttrs.replace(/\s*\baction=["'][^"']*["']/gi, "");
    nextAttrs = nextAttrs.replace(/\s*\bmethod=["'][^"']*["']/gi, "");
    nextAttrs = `${nextAttrs.trim()} method="POST" action="/api/contact"`;

    // Atribui name= aos inputs/textareas/selects baseado em placeholder/label.
    // Rastreia nomes já atribuídos pra não duplicar (LGPD checkbox próximo
    // a um label "Mensagem" geraria 3 "message" se não filtrar).
    const usedNames = new Set<string>();
    let nextBody = body.replace(
      /<(input|textarea|select)\b([^>]*)>/gi,
      (m: string, tag: string, ia: string, offset: number) => {
        // Pula honeypot, submit, checkbox/radio (LGPD opt-in não é campo principal)
        const type = ia.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
        if (type === "submit" || type === "button" || type === "hidden" || type === "checkbox" || type === "radio") return m;
        // Se input tem type='email' ou type='tel', SEMPRE force name=email/phone
        // (ignora existingName errado deixado por normalize anterior).
        const expectedFromType =
          type === "email" ? "email" : type === "tel" ? "phone" : null;

        // Já tem name e bate com o type?
        const existingName = ia.match(/\bname=["']([^"']+)["']/i)?.[1];
        if (
          existingName &&
          /^(name|email|phone|company|subject|message)$/.test(existingName) &&
          (!expectedFromType || existingName === expectedFromType)
        ) {
          usedNames.add(existingName);
          return m;
        }
        // Pega último <label>texto</label> no body antes desse input
        const before = body.slice(0, offset);
        const labelMatches = [...before.matchAll(/<label\b[^>]*>([\s\S]{0,200}?)<\/label>/gi)];
        const lastLabel = labelMatches.length > 0
          ? labelMatches[labelMatches.length - 1][1].replace(/<[^>]+>/g, "").trim()
          : "";
        const probe = `<${tag} ${ia} aria-label="${lastLabel}">`;
        const inferred = inferFieldName(probe);
        if (!inferred) return m;
        // Se já foi usado (ex: 2º "message" candidato), pula
        if (usedNames.has(inferred)) return m;
        usedNames.add(inferred);
        // Remove name= existente errado e injeta o correto
        const cleaned = ia.replace(/\s*\bname=["'][^"']*["']/gi, "");
        // Marca campos críticos como required quando o Stitch não marcou
        const needsReq = (inferred === "name" || inferred === "email" || inferred === "message");
        const hasReq = /\brequired\b/i.test(cleaned);
        const sepInput = cleaned && !cleaned.startsWith(" ") ? " " : "";
        return `<${tag}${sepInput}${cleaned} name="${inferred}"${needsReq && !hasReq ? " required" : ""}>`;
      },
    );

    // Adiciona honeypot e timestamp se não houver
    if (!/name=["']_hp["']/i.test(nextBody)) {
      nextBody += `\n<input type="text" name="_hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" />`;
    }

    const sep = nextAttrs && !nextAttrs.startsWith(" ") ? " " : "";
    return `<form${sep}${nextAttrs}>${nextBody}</form>`;
  });
}
