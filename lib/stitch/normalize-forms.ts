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
  // Tenta placeholder, name, id, aria-label, label associada
  const candidates: string[] = [];
  const ph = input.match(/placeholder=["']([^"']+)["']/i)?.[1];
  if (ph) candidates.push(ph);
  const nm = input.match(/\bname=["']([^"']+)["']/i)?.[1];
  if (nm) candidates.push(nm);
  const aria = input.match(/aria-label=["']([^"']+)["']/i)?.[1];
  if (aria) candidates.push(aria);
  const id = input.match(/\bid=["']([^"']+)["']/i)?.[1];
  if (id) candidates.push(id);
  for (const c of candidates) {
    for (const [re, mapped] of FIELD_MAP) if (re.test(c)) return mapped;
  }
  return null;
}

export function normalizeStitchForms(html: string): string {
  return html.replace(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi, (_match, attrs, body) => {
    // Reescreve action + method
    let nextAttrs = attrs;
    // Remove action existente e force POST /api/contact
    nextAttrs = nextAttrs.replace(/\s*\baction=["'][^"']*["']/gi, "");
    nextAttrs = nextAttrs.replace(/\s*\bmethod=["'][^"']*["']/gi, "");
    nextAttrs = `${nextAttrs.trim()} method="POST" action="/api/contact"`;

    // Atribui name= aos inputs/textareas/selects baseado em placeholder/label
    // Estratégia: pra cada <input>, olha o último <label>...</label> antes dele
    // no body como pista adicional.
    let nextBody = body.replace(
      /<(input|textarea|select)\b([^>]*)>/gi,
      (m: string, tag: string, ia: string, offset: number) => {
        // Pula honeypot e submit
        const type = ia.match(/\btype=["']([^"']+)["']/i)?.[1] ?? "";
        if (type === "submit" || type === "button" || type === "hidden") return m;
        // Já tem name e é válido?
        const existingName = ia.match(/\bname=["']([^"']+)["']/i)?.[1];
        if (existingName && /^(name|email|phone|company|subject|message)$/.test(existingName)) {
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
