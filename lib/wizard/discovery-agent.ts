// Agente conversacional de descoberta — substitui o discovery_* fixo de 9 estados
// por um LLM (Claude Sonnet 4.6 via Abacus, ou GPT como fallback) que conduz a
// conversa naturalmente até ter material suficiente pro briefing.
//
// Port do chat-agent.js do stitch-advocacia, adaptado pro schema WizardAnswers
// do clubedaweb. System prompt insistente: rejeita respostas vagas, pede
// concretude, aceita "não tenho" como skip explícito.
//
// Stack:
// - LLM via raw fetch (segue padrão do llm-client.ts, sem dependência nova)
// - Modelo: WIZARD_LLM_MODEL env (default "claude-sonnet-4-6" se Abacus)
// - Endpoint: pickLlmConfig (Abacus se ABACUSAI_API_KEY, senão OpenAI)
// - Tools: function calling formato OpenAI (Abacus aceita igual)

import { logger } from "@/lib/logger";
import type { ChatMessage, WizardAnswers } from "./types";
import { pickLlmConfig } from "./llm-client";

const MAX_TOOL_ITERATIONS = 4;
const TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = `Você é a consultora de briefing do clubedaweb. Sua missão: conduzir uma conversa com o cliente até ter MATERIAL CONCRETO suficiente para o Stitch gerar um site institucional **com identidade própria** (não genérico) — 5 páginas: Home, Sobre, Serviços, Contato, Blog.

PRINCÍPIOS INEGOCIÁVEIS:
1. NÃO ACEITE RESPOSTAS VAGAS. "Qualidade", "atendimento bom", "PMEs em geral", "expertise" → reformule e peça exemplos CONCRETOS. Cliché vira site cliché.
2. UMA PERGUNTA POR VEZ. Não despeje 4 perguntas — encadeie naturalmente.
3. INSISTA com diplomacia, MAS NO MÁXIMO UMA VEZ por pergunta. Se na 2ª tentativa o cliente ainda não der concretude, ACEITE o que tem e siga — não repita a mesma pergunta 3+ vezes.
4. SE O CLIENTE NÃO TIVER ALGO REAL, ACEITE COMO "ausente" e mande skip — NÃO INVENTE. Exemplo: "ainda não temos cases" → registra proofPoints.skip=true. "Sem FAQ por enquanto" → não pergunta de novo.
4b. EXPRESSÕES DE SKIP EXPLÍCITO — pegue na PRIMEIRA vez e SIGA: "pode seguir", "pular", "passa pro próximo", "sem isso", "não tem", "não sei", "sigamos", "já registrou", "tanto faz", "decide você". Para esses, registra o campo como ausente (sem skip:true se for opcional, ou usa valor já dado se for obrigatório) e vai pro próximo. NUNCA insiste depois de skip explícito.
5. NUNCA invente nomes, números, planos, depoimentos ou datas que o cliente não forneceu.
6. SEMPRE chame a tool 'update_brief' antes de seguir, sempre que extrair info nova. Pode atualizar múltiplos campos numa chamada.
7. Quando todos os obrigatórios estiverem preenchidos com qualidade, mostre um RESUMO em bullets e peça confirmação. Só chame 'confirm_brief_ready' depois da 2ª confirmação explícita.

FORMATO DA CONVERSA:
- Tom: profissional próximo, em português brasileiro
- Mensagens curtas (2-4 frases), perguntas específicas
- Use markdown **negrito** para destacar a pergunta-chave
- Validar rico → ("captei: X. ✓"), pobre → ("me dá exemplo concreto disso", "quem especificamente?")

ORDEM SUGERIDA (flexível — siga o que faz sentido):
1. **Identidade**: nome + segmento ESPECÍFICO + cidade/UF + ano de fundação (opcional)
2. **Público + dor**: persona concreta (cargo, contexto, porte) + dor principal que vocês resolvem
3. **Diferenciais (≥3 itens concretos)**: o que ninguém mais faz igual. "Atendimento de qualidade" NÃO conta — peça coisa específica tipo "consultoria com sócio sênior dedicado em cada conta", "scanner 3D em 1 sessão", "dashboard de acompanhamento mensal"
4. **Produto/serviço principal**: nome + descrição substantiva (>80 chars), o que entrega e pra quem
5. **Como funciona**: 2-4 etapas REAIS do processo (não 3 etapas genéricas)
6. **Modelo de preço** (opcional): texto livre — "a partir de R$X", "3 planos", "sob consulta"
7. **Prova social**: cases reais / números / depoimentos OU declarar "ainda não temos" → skip
8. **FAQ**: 3+ perguntas reais com resposta OU declarar "sem FAQ" → skip
9. **Tom de voz** + paleta/referências visuais
10. **Objetivo do site + CTA exato**: "Agendar avaliação gratuita", "Pedir orçamento" — texto exato do botão
11. **Contato**: email, telefone/WhatsApp, cidade
12. **Blog**: 3+ títulos de artigos reais OU declarar "sem blog" → skip

CAMPOS OBRIGATÓRIOS para liberar geração:
- companyName, industry (específico), audience (concreto), mainPain
- differentiators (≥3 itens concretos)
- productName, productDescription
- homePitch, mainCta (= primaryCta), siteGoal
- tone
- 1 canal de contato (contactPhone/contactWhatsapp/contactEmail)

CAMPOS OPCIONAIS — perguntar mas aceitar skip:
- foundedYear, cityState, aboutText, howItWorks, pricingModel, proofPoints, faq, blogTopics, colors, references

ANTES DE 'confirm_brief_ready': mostre resumo completo em bullets E pergunte "Posso gerar o mockup com isso?"`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "update_brief",
      description:
        "Use SEMPRE que extrair uma ou mais informações novas/atualizadas. Pode atualizar múltiplos campos por chamada. NÃO INVENTE valores — só preencha o que o cliente disse explicitamente.",
      parameters: {
        type: "object",
        properties: {
          companyName: { type: "string", description: "Nome da empresa" },
          industry: {
            type: "string",
            description:
              "Segmento/atividade ESPECÍFICA (ex: 'odontologia estética', 'consultoria tributária para indústrias'). Evite 'serviços', 'consultoria', 'B2B', 'tecnologia'",
          },
          cityState: {
            type: "string",
            description: "Cidade e UF (ex: 'Curitiba - PR', 'São Paulo - SP')",
          },
          foundedYear: {
            type: "string",
            description: "Ano de fundação (4 dígitos)",
          },
          audience: {
            type: "string",
            description:
              "Persona CONCRETA: cargo, porte de empresa, contexto, região. NÃO ACEITE 'PMEs', 'todos', 'empresas em geral'",
          },
          mainPain: {
            type: "string",
            description:
              "A dor CONCRETA que o cliente sente antes de chegar até a empresa — o problema real no dia a dia dele",
          },
          differentiators: {
            type: "array",
            items: { type: "string" },
            description:
              "Lista de 3+ diferenciais CONCRETOS. NÃO ACEITE 'qualidade', 'atendimento', 'expertise', 'comprometimento'. Aceite coisas tipo 'scanner 3D em 1 sessão', 'sócio sênior dedicado a cada conta', 'dashboard com KPIs mensais'",
          },
          productName: {
            type: "string",
            description: "Nome do produto/serviço principal que vai ser destacado em /servicos",
          },
          productDescription: {
            type: "string",
            description: "Descrição substantiva do produto principal (>80 chars): o que entrega, pra quem, como é vendido",
          },
          homePitch: {
            type: "string",
            description: "Mensagem principal da home (5 segundos): o que o visitante precisa entender — ligar à dor",
          },
          mainCta: {
            type: "string",
            description: "Texto EXATO do botão principal de conversão. Ex: 'Agendar avaliação gratuita', 'Pedir orçamento via WhatsApp'",
          },
          siteGoal: {
            type: "string",
            description: "Objetivo de conversão do site (lead, agendamento, venda, contato). Ex: 'gerar leads para diagnóstico jurídico'",
          },
          howItWorks: {
            type: "array",
            items: { type: "string" },
            description: "Etapas REAIS do processo do cliente (2-4 passos). Ex: ['1. Diagnóstico gratuito em 7 dias', '2. Plano personalizado', '3. Acompanhamento mensal por WhatsApp']",
          },
          pricingModel: {
            type: "string",
            description: "Modelo de preço em texto livre (ex: 'a partir de R$X', '3 planos: Essencial/Profissional/Premium', 'sob consulta')",
          },
          proofPoints: {
            type: "object",
            description:
              "Prova social. Use {skip:true} se cliente declarou que ainda não tem; SENÃO {items:[...]} com cases/números/depoimentos REAIS",
            properties: {
              skip: { type: "boolean" },
              items: {
                type: "array",
                items: { type: "string" },
                description: "Ex: ['+400 pacientes em 2024', 'NPS 92', '150 avaliações 5★ no Google']",
              },
            },
          },
          faq: {
            type: "array",
            items: {
              type: "object",
              properties: {
                q: { type: "string", description: "Pergunta" },
                a: { type: "string", description: "Resposta concreta" },
              },
              required: ["q", "a"],
            },
            description: "Perguntas REAIS que clientes fazem hoje + respostas. Mínimo 3 itens (ou omitir e mandar pular)",
          },
          aboutText: {
            type: "string",
            description: "Texto institucional para Sobre (2-4 frases: história, missão, jeito de trabalhar)",
          },
          existingWebsite: { type: "string", description: "URL do site atual do cliente, se houver" },
          offerings: {
            type: "string",
            description:
              "Lista de serviços/produtos em texto livre como BACKUP. Prefira preencher differentiators[] (estruturado)",
          },
          contactPhone: { type: "string", description: "Telefone fixo" },
          contactEmail: { type: "string", description: "Email de contato" },
          contactWhatsapp: { type: "string", description: "WhatsApp" },
          contactAddress: { type: "string", description: "Endereço completo (Rua, número, bairro)" },
          contactHours: { type: "string", description: "Horário de atendimento" },
          tone: {
            type: "string",
            description: "Tom de voz da marca (corporativo, acolhedor, premium, tech, didático, consultivo, etc.)",
          },
          colors: {
            type: "string",
            description: "Paleta de cores (hex ou descrição). Pode ser 'sugira' se cliente preferir",
          },
          references: {
            type: "array",
            items: { type: "string" },
            description: "1-3 URLs de sites que o cliente admira",
          },
          blogTopics: {
            type: "object",
            description:
              "Temas de blog. Use {skip:true} se não tem conteúdo; SENÃO {items:[...]} com 3+ títulos reais",
            properties: {
              skip: { type: "boolean" },
              items: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "confirm_brief_ready",
      description:
        "Chame APENAS quando todos os campos obrigatórios estiverem preenchidos COM QUALIDADE e o cliente tiver confirmado em texto que pode gerar o site. Não chame especulativamente.",
      parameters: {
        type: "object",
        properties: {
          confirmation: {
            type: "string",
            description: "Cite a frase do cliente que confirma a geração",
          },
        },
        required: ["confirmation"],
      },
    },
  },
];

const REQUIRED_FIELDS: Array<keyof WizardAnswers> = [
  "companyName",
  "industry",
  "audience",
  "mainPain",
  "productName",
  "productDescription",
  "homePitch",
  "mainCta",
  "siteGoal",
  "tone",
];

function hasAnyContact(a: WizardAnswers): boolean {
  return Boolean(a.contactPhone || a.contactEmail || a.contactWhatsapp);
}

function hasEnoughDifferentiators(a: WizardAnswers): boolean {
  return Array.isArray(a.differentiators) && a.differentiators.filter((d) => d.trim().length >= 8).length >= 3;
}

function missingRequired(a: WizardAnswers): string[] {
  const missing: string[] = REQUIRED_FIELDS.filter((k) => {
    const v = a[k];
    return !v || (typeof v === "string" && v.trim().length === 0);
  });
  if (!hasAnyContact(a)) missing.push("contactPhone/contactEmail/contactWhatsapp");
  if (!hasEnoughDifferentiators(a)) missing.push("differentiators (≥3 concretos)");
  return missing;
}

function describeBrief(a: WizardAnswers): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === null || v === "") continue;
    const display = Array.isArray(v) ? v.join(", ") : String(v);
    lines.push(`- ${k}: ${display.length > 140 ? display.slice(0, 137) + "…" : display}`);
  }
  if (lines.length === 0) return "(vazio)";
  return lines.join("\n");
}

function buildStatusReminder(a: WizardAnswers): string {
  const missing = missingRequired(a);
  return `[STATUS DO BRIEF — atualizado a cada turno]

Campos OBRIGATÓRIOS ainda faltando:
${missing.length ? missing.map((f) => `- ${f}`).join("\n") : "(nenhum)"}

Conteúdo atual do brief:
${describeBrief(a)}

LEMBRE: foco no próximo campo faltante. Se todos os obrigatórios estão preenchidos com qualidade, faça o resumo e peça confirmação antes de chamar confirm_brief_ready.`;
}

export interface DiscoveryTurnResult {
  /** Mensagem em markdown que a UI mostra como bubble do assistant. */
  reply: string;
  /** WizardAnswers atualizado com o que a IA extraiu da última mensagem. */
  answers: WizardAnswers;
  /** True quando a IA chamou confirm_brief_ready com brief completo. */
  isReady: boolean;
  /** Frase do cliente que confirmou geração (quando isReady). */
  confirmation?: string;
}

function safeParseArgs(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function mergeAnswers(prev: WizardAnswers, update: Record<string, unknown>): WizardAnswers {
  const next: WizardAnswers = { ...prev };
  for (const [k, v] of Object.entries(update)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.length === 0) continue;
      (next as Record<string, unknown>)[k] = trimmed;
    } else if (Array.isArray(v)) {
      // FAQ é array de objetos {q,a}; differentiators/howItWorks são strings
      if (k === "faq") {
        const faqItems = v
          .map((item) => {
            if (item && typeof item === "object") {
              const o = item as { q?: unknown; a?: unknown };
              const q = typeof o.q === "string" ? o.q.trim() : "";
              const a = typeof o.a === "string" ? o.a.trim() : "";
              return q && a ? { q, a } : null;
            }
            return null;
          })
          .filter((x): x is { q: string; a: string } => x !== null);
        if (faqItems.length > 0) (next as Record<string, unknown>)[k] = faqItems;
      } else {
        const arr = v.map((x) => String(x).trim()).filter(Boolean);
        if (arr.length > 0) (next as Record<string, unknown>)[k] = arr;
      }
    } else if (typeof v === "object") {
      // proofPoints, blogTopics: shape { skip?: boolean; items?: string[] }
      const obj = v as { skip?: unknown; items?: unknown };
      const normalized: { skip?: boolean; items?: string[] } = {};
      if (obj.skip === true) normalized.skip = true;
      if (Array.isArray(obj.items)) {
        const items = obj.items.map((x) => String(x).trim()).filter(Boolean);
        if (items.length > 0) normalized.items = items;
      }
      if (normalized.skip || normalized.items) {
        (next as Record<string, unknown>)[k] = normalized;
      }
    }
  }
  return next;
}

interface RawApiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

function historyToApi(history: ChatMessage[]): RawApiMessage[] {
  return history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: typeof m.content === "string" ? m.content : String(m.content),
    }));
}

interface LlmChoice {
  message: {
    role: string;
    content: string | null;
    tool_calls?: Array<{
      id: string;
      type: string;
      function: { name: string; arguments: string };
    }>;
  };
  finish_reason?: string;
}

async function callLlmWithTools(messages: RawApiMessage[]): Promise<LlmChoice> {
  const cfg = pickLlmConfig();
  if (!cfg) throw new Error("Nenhuma chave LLM configurada (ABACUSAI_API_KEY ou OPENAI_API_KEY)");

  const payload = {
    model: cfg.model,
    messages,
    tools: TOOLS,
    tool_choice: "auto" as const,
    temperature: 0.5,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.key}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`LLM ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const choice = data?.choices?.[0];
    if (!choice) throw new Error("LLM sem choices");
    return choice as LlmChoice;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runDiscoveryTurn(params: {
  message: string;
  history: ChatMessage[];
  answers: WizardAnswers;
}): Promise<DiscoveryTurnResult> {
  let answers = { ...params.answers };
  let isReady = false;
  let confirmation: string | undefined;

  // Constrói as mensagens do turno. System prompt + status reminder (dinâmico)
  // + histórico (apenas user/assistant em texto) + nova mensagem do usuário.
  const apiMessages: RawApiMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: buildStatusReminder(answers) },
    ...historyToApi(params.history),
    { role: "user", content: params.message },
  ];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const choice = await callLlmWithTools(apiMessages);
    const msg = choice.message;
    const toolCalls = msg.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const reply = (msg.content ?? "").trim();
      return {
        reply: reply || "Pode me contar mais?",
        answers,
        isReady,
        confirmation,
      };
    }

    // Tem tool use — anexa assistant.tool_calls e cada tool_result, depois
    // pede pro modelo gerar a próxima fala em texto.
    apiMessages.push({
      role: "assistant",
      content: msg.content,
      tool_calls: toolCalls.map((t) => ({
        id: t.id,
        type: "function",
        function: { name: t.function.name, arguments: t.function.arguments },
      })),
    });

    for (const call of toolCalls) {
      const name = call.function.name;
      const args = safeParseArgs(call.function.arguments);
      let resultPayload: string;

      if (name === "update_brief") {
        answers = mergeAnswers(answers, args);
        const missing = missingRequired(answers);
        resultPayload = JSON.stringify({
          ok: true,
          stillMissing: missing,
          progress: REQUIRED_FIELDS.length - missing.length,
          total: REQUIRED_FIELDS.length + 1, // +1 contato
        });
      } else if (name === "confirm_brief_ready") {
        const missing = missingRequired(answers);
        if (missing.length > 0) {
          resultPayload = JSON.stringify({
            ok: false,
            error: `Geração bloqueada — ainda faltam: ${missing.join(", ")}. Continue o briefing antes de confirmar.`,
          });
        } else {
          isReady = true;
          const conf = args?.confirmation;
          confirmation = typeof conf === "string" ? conf : undefined;
          resultPayload = JSON.stringify({
            ok: true,
            note: "Geração liberada. Confirme em texto para o cliente que vai gerar agora.",
          });
        }
      } else {
        resultPayload = JSON.stringify({ ok: false, error: `Tool desconhecida: ${name}` });
      }

      apiMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: resultPayload,
      });
    }

    // Atualiza o status reminder antes do próximo round (answers mudou)
    apiMessages[1] = { role: "system", content: buildStatusReminder(answers) };
  }

  logger.warn("[discovery-agent] esgotou MAX_TOOL_ITERATIONS sem reply em texto");
  return {
    reply: "Pode reformular sua última mensagem? Tive um problema ao processar.",
    answers,
    isReady,
    confirmation,
  };
}

/**
 * Calcula progresso do briefing (0-100%) baseado em quantos campos obrigatórios
 * já estão preenchidos. Usado pela UI pra mostrar barra de progresso.
 */
export function computeBriefProgress(a: WizardAnswers): number {
  const totalRequired = REQUIRED_FIELDS.length + 2; // +1 contato, +1 differentiators
  const filledFields = REQUIRED_FIELDS.filter((k) => {
    const v = a[k];
    return Boolean(v) && (typeof v !== "string" || v.trim().length > 0);
  }).length;
  const contactFilled = hasAnyContact(a) ? 1 : 0;
  const differentiatorsFilled = hasEnoughDifferentiators(a) ? 1 : 0;
  return Math.round(
    ((filledFields + contactFilled + differentiatorsFilled) / totalRequired) * 100,
  );
}

/**
 * Greeting inicial — fala que aparece quando o cliente clica em "Vamos começar"
 * ou abre o chat pela primeira vez.
 */
export function discoveryGreeting(): string {
  return (
    "Oi! Vou conduzir o briefing pra gerar o site da sua empresa. " +
    "Quanto mais **concreto** você for, melhor o resultado — evite respostas genéricas tipo \"qualidade\" ou \"o melhor do mercado\". " +
    "Se em algum momento não tiver a informação, é só dizer **\"não tenho\"** e sigo em frente sem inventar.\n\n" +
    "Para começar: qual o **nome da empresa** e em **que segmento específico** ela atua? " +
    "_(não só \"consultoria\", mas \"consultoria tributária para indústrias\", por exemplo)_"
  );
}
