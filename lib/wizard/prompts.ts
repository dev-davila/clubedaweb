import { buildStitchHomePrompt } from "@/lib/cms/site-block-standard";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import {
  PAGE_BLOCKS_HINT,
  PAGE_LABEL_PT,
  WIZARD_PAGE_ORDER,
  pageProgressLabel,
  publicRoute,
} from "./page-flow";
import { previewUrlForPage } from "./preview-url";
import type { WizardAnswers, WizardState } from "./types";

export { previewUrlForPage };

export const BOT_GREETING =
  "Olá! Vou montar o **site completo** da sua empresa com você — home, sobre, contato, serviços e blog.\n\n" +
  "Faço algumas perguntas objetivas (empresa, o que vende, contatos, referências de sites que você curte). " +
  "Depois gero **uma página por vez**; você **aprova** ou pede **outra versão** antes de seguir.\n\n" +
  "Quando estiver pronto, manda **vamos** ou **sim**.";

export const DISCOVERY_QUESTIONS: Record<string, string> = {
  discovery_company:
    "**1/9 — Empresa**\n" +
    "Qual o **nome** e **o que a empresa faz**? Uma frase já basta.\n" +
    "_Ex.: \"Clínica Vet Amigo — clínica veterinária 24h com foco em cães e gatos\"_",
  discovery_home:
    "**2/9 — Home (primeira dobra)**\n" +
    "O que o visitante precisa entender em **5 segundos**? Qual **problema** vocês resolvem?\n" +
    "Qual ação você quer que ele faça? _(pedir orçamento, agendar, WhatsApp, comprar…)_",
  discovery_about:
    "**3/9 — Sobre a empresa**\n" +
    "Conte um pouco da **história, missão ou diferencial** (2–4 frases).\n" +
    "Se já tiver **site**, manda o **link** que usamos como referência de conteúdo. Se não tiver, diga \"não tenho site\".",
  discovery_services:
    "**4/9 — Produtos e serviços**\n" +
    "Liste os **3 principais** que devem aparecer no site (nome + benefício em uma linha cada).\n" +
    "_Ex.: \"Consulta — check-up completo\" / \"Vacinas — protocolo personalizado\"_",
  discovery_audience:
    "**5/9 — Público**\n" +
    "**Quem** é seu cliente ideal? (perfil, região, momento de compra)",
  discovery_contact:
    "**6/9 — Dados de contato**\n" +
    "O que deve aparecer no site: **telefone**, **WhatsApp**, **e-mail**, **endereço/cidade**, **horário**.\n" +
    "O que não tiver, pode pular — não inventamos dados.",
  discovery_tone:
    "**7/9 — Tom da marca**\n" +
    "Como a marca deve **soar**? _(corporativo, acolhedor, premium, tech, divertido…)_",
  discovery_colors:
    "**8/9 — Cores**\n" +
    "Tem **paleta** (hex ou descrição) ou prefere que eu sugira com base no seu segmento?",
  discovery_references:
    "**9/9 — Benchmark**\n" +
    "Sites que você **admira** ou concorrentes com visual legal (1–3 URLs). " +
    "Isso orienta o design. Se não tiver, diga \"sem referência\".",
};

function line(label: string, value?: string | null): string {
  const v = value?.trim();
  return `• **${label}:** ${v && v.length > 0 ? v : "_(não informado)_"}`;
}

export const CONFIRM_BRIEF_TEMPLATE = (a: WizardAnswers) =>
  `Revise o **briefing** antes de gerar a primeira página:\n\n` +
  `${line("Empresa", a.companyName)}\n` +
  `${line("Atividade / segmento", a.industry)}\n` +
  `${line("Home — mensagem principal", a.homePitch)}\n` +
  `${line("Home — ação desejada", a.mainCta)}\n` +
  `${line("Sobre", a.aboutText)}\n` +
  `${line("Site atual (referência)", a.existingWebsite)}\n` +
  `${line("Produtos / serviços", a.offerings)}\n` +
  `${line("Público", a.audience)}\n` +
  `${line("Contato", formatContactBrief(a))}\n` +
  `${line("Tom", a.tone)}\n` +
  `${line("Cores", a.colors)}\n` +
  `${line("Benchmarks", (a.references ?? []).join(", "))}\n\n` +
  `Vou gerar **${WIZARD_PAGE_ORDER.length} páginas**, uma por vez, focadas no seu segmento.\n` +
  `Responda **sim** para começar pela **Home** ou **revisar** para ajustar algo.`;

function formatContactBrief(a: WizardAnswers): string {
  const parts = [
    a.contactPhone && `Tel: ${a.contactPhone}`,
    a.contactWhatsapp && `WhatsApp: ${a.contactWhatsapp}`,
    a.contactEmail && `Email: ${a.contactEmail}`,
    a.contactAddress && `Endereço: ${a.contactAddress}`,
    a.contactHours && `Horário: ${a.contactHours}`,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(" · ");
  return a.contactInfo ?? "";
}

/** “PDF” no chat — resumo da proposta da página para aprovação. */
export function buildPageApprovalBrief(
  pageType: RequiredPageType,
  answers: WizardAnswers,
  previewUrl: string,
  options?: { regenerated?: boolean },
): string {
  const segment = answers.industry?.trim() || "seu segmento";
  const pageContext = pageContextForType(pageType, answers);

  return (
    `📄 **Proposta de design — ${pageProgressLabel(pageType)}**\n` +
    `_${options?.regenerated ? "Nova versão gerada com base no seu feedback." : "Focada no segmento: " + segment + "."}_\n\n` +
    `**Rota:** ${publicRoute(pageType)}\n` +
    `**Blocos:** ${PAGE_BLOCKS_HINT[pageType]}\n\n` +
    `**Conteúdo desta página:**\n${pageContext}\n\n` +
    `---\n` +
    `🔗 **Validar no navegador (preview):**\n${previewUrl}\n\n` +
    `Abra o link, veja no desktop e no celular.\n\n` +
    `• **aprovar** — seguimos para a próxima página\n` +
    `• **outra versão** — gero outro layout (pode dizer o que mudar)\n` +
    `• **cancelar** — descarta a sessão`
  );
}

function pageContextForType(pageType: RequiredPageType, a: WizardAnswers): string {
  switch (pageType) {
    case "home":
      return (
        `→ ${a.homePitch ?? a.industry ?? "Proposta de valor"}\n` +
        `→ CTA principal: ${a.mainCta ?? "Fale conosco"}`
      );
    case "about":
      return a.aboutText ?? "Institucional com base no briefing.";
    case "contact":
      return formatContactBrief(a) || "Canais informados no briefing.";
    case "services":
      return a.offerings ?? "Três pilares de serviço/produto.";
    case "blog":
      return "Introdução à listagem de artigos do blog.";
    default:
      return "";
  }
}

export function buildReadyToPublishMessage(origin: string, token: string): string {
  const lines = WIZARD_PAGE_ORDER.map((p) => {
    const url = previewUrlForPage(origin, token, p);
    return `• **${PAGE_LABEL_PT[p]}:** ${url}`;
  });
  return (
    `Todas as **${WIZARD_PAGE_ORDER.length} páginas** foram aprovadas.\n\n` +
    `${lines.join("\n")}\n\n` +
    `Revise os links acima. Quando estiver tudo certo, responda **publicar** para colocar no ar.\n` +
    `Ou **ajustar** + nome da página (ex.: \"ajustar home\") para regerar uma página específica.`
  );
}

export const GENERATING_PAGE_MESSAGE = (pageType: RequiredPageType, industry?: string) =>
  `Gerando **${pageProgressLabel(pageType)}** (${PAGE_LABEL_PT[pageType]}) com Stitch — foco em **${industry?.trim() || "o seu segmento"}**…\n` +
  `Costuma levar **1–3 minutos** por página. Não feche a aba nem envie outra mensagem até o preview aparecer.`;

export const PUBLISHED_MESSAGE =
  "Site publicado com sucesso! Todas as páginas aprovadas estão no ar.\n" +
  "Para mudar textos depois, use o gestor ou inicie uma nova conversa.";

export const ERROR_GENERIC =
  "Tive um problema. Manda **sim** para tentar de novo ou **revisar** o briefing.";

export function nextQuestionFor(state: WizardState): string {
  return DISCOVERY_QUESTIONS[state] ?? "";
}

export function buildStitchPrompt(answers: WizardAnswers): string {
  return buildStitchHomePrompt(answers);
}
