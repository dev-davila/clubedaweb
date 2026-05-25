/**
 * Classifica a intenção do usuário ao revisar uma página gerada (estado
 * review_page / ready_to_publish). Substitui a heurística de regex frágil por
 * entendimento via LLM — essencial porque o usuário responde em linguagem
 * natural coloquial ("ficou show, manda a próxima", "aprovo", "tá bom").
 *
 * Degrada com segurança: se não há LLM configurado, timeout, ou JSON inválido,
 * retorna { action: "unknown" } e o orchestrator cai no parsing por regex.
 */

import { chatCompletion } from "./llm-client";
import { logger } from "@/lib/logger";

export type PageIntent =
  | "approve"
  | "regenerate"
  | "variant"
  | "adjust"
  | "cancel"
  | "publish"
  | "unknown";

export interface PageIntentResult {
  action: PageIntent;
  /** Quando action="adjust": o pedido específico do usuário. */
  feedback?: string;
}

const SYSTEM_PROMPT = `Você classifica a resposta de um cliente que acabou de ver uma PÁGINA do site dele recém-gerada por IA, e está decidindo o que fazer.

Responda APENAS com JSON: {"action": "...", "feedback": "..."}

Categorias de action:
- "approve": gostou e quer seguir para a próxima página. Ex: "aprovo", "ficou ótimo", "pode mandar a próxima", "tá show", "perfeito", "gostei, segue", "manda ver", "fechou", "bom demais", "ok pode continuar", "beleza".
- "regenerate": NÃO gostou e quer outra versão do zero (sem dizer o que mudar). Ex: "não curti", "faz outra", "refaz", "tenta de novo", "não gostei dessa".
- "variant": quer uma alternativa visual mantendo o conteúdo. Ex: "mostra outra opção de layout", "tem outro visual?", "variante".
- "adjust": quer uma mudança ESPECÍFICA. Ex: "muda o título do hero", "deixa o fundo mais escuro", "tira esse botão", "põe o telefone maior", "o texto tá grande demais". Coloque o pedido literal em "feedback".
- "cancel": quer desistir/encerrar. Ex: "cancela", "deixa pra lá", "para tudo".
- "publish": quer publicar o site agora. Ex: "publica", "pode colocar no ar", "publicar".

Se for ambíguo demais, use "approve" só se houver claro sinal positivo; caso contrário "adjust" com o texto no feedback.
"feedback" só é obrigatório quando action="adjust". Para os outros, use "".`;

export async function classifyPageIntent(
  message: string,
  ctx?: { pageType?: string },
): Promise<PageIntentResult> {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length < 1) return { action: "unknown" };

  try {
    const userMsg = ctx?.pageType
      ? `Página atual: ${ctx.pageType}\nResposta do cliente: "${trimmed}"`
      : `Resposta do cliente: "${trimmed}"`;

    const raw = await chatCompletion({
      system: SYSTEM_PROMPT,
      user: userMsg,
      jsonMode: true,
      temperature: 0.1,
      timeoutMs: 12_000,
    });

    const parsed = JSON.parse(raw) as { action?: string; feedback?: string };
    const action = normalizeAction(parsed.action);
    if (action === "unknown") {
      logger.warn("[wizard:intent] LLM returned unknown action", { raw: raw.slice(0, 120) });
      return { action: "unknown" };
    }
    logger.info("[wizard:intent] classified", { message: trimmed.slice(0, 60), action });
    return {
      action,
      feedback: action === "adjust" ? (parsed.feedback?.trim() || trimmed) : undefined,
    };
  } catch (err) {
    logger.warn("[wizard:intent] classify failed, falling back to regex", { err: String(err) });
    return { action: "unknown" };
  }
}

function normalizeAction(a?: string): PageIntent {
  const v = (a ?? "").toLowerCase().trim();
  if (["approve", "regenerate", "variant", "adjust", "cancel", "publish"].includes(v)) {
    return v as PageIntent;
  }
  return "unknown";
}
