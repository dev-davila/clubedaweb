import { logger } from "@/lib/logger";

export interface LlmConfig {
  url: string;
  key: string;
  model: string;
}

export function pickLlmConfig(): LlmConfig | null {
  const wantedModel = process.env.WIZARD_LLM_MODEL;
  const wantsClaude = wantedModel?.toLowerCase().startsWith("claude");

  // Se o modelo solicitado é Claude, EXIGE Abacus (não tem suporte nativo no
  // endpoint OpenAI). Senão pode usar OpenAI direto.
  if (wantsClaude && process.env.ABACUSAI_API_KEY) {
    return {
      url: "https://routellm.abacus.ai/v1/chat/completions",
      key: process.env.ABACUSAI_API_KEY,
      model: wantedModel!,
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      key: process.env.OPENAI_API_KEY,
      // Se WIZARD_LLM_MODEL foi setado pra um modelo Claude mas só tem
      // OpenAI key, cai pra default OpenAI em vez de quebrar.
      model: wantsClaude ? "gpt-4o-mini" : wantedModel ?? "gpt-4o-mini",
    };
  }
  if (process.env.ABACUSAI_API_KEY) {
    return {
      url: "https://routellm.abacus.ai/v1/chat/completions",
      key: process.env.ABACUSAI_API_KEY,
      model: wantedModel ?? "claude-sonnet-4-6",
    };
  }
  return null;
}

export function stripCodeFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const docStart = s.search(/<!DOCTYPE|<html/i);
  if (docStart > 0) s = s.slice(docStart);
  return s.trim();
}

export async function chatCompletion(opts: {
  system: string;
  user: string;
  timeoutMs?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const cfg = pickLlmConfig();
  if (!cfg) throw new Error("No LLM API key configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);

  try {
    const payload: Record<string, unknown> = {
      model: cfg.model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: opts.temperature ?? 0.65,
    };
    if (opts.jsonMode) payload.response_format = { type: "json_object" };

    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`LLM ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) throw new Error("LLM returned empty content");
    return content;
  } catch (err) {
    logger.error("[wizard:llm] chat failed", String(err));
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
