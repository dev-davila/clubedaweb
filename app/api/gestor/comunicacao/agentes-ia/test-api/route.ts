export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const LLM_URL = () =>
  process.env.OPENAI_API_KEY
    ? "https://api.openai.com/v1/chat/completions"
    : "https://routellm.abacus.ai/v1/chat/completions";

// GET - Check API status (key configured, endpoint reachable)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.ABACUSAI_API_KEY || "";
  const hasKey = apiKey.length > 0;
  const maskedKey = hasKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "";
  const usingOpenAI = !!process.env.OPENAI_API_KEY;

  return NextResponse.json({
    configured: hasKey,
    maskedKey,
    endpoint: LLM_URL(),
    provider: usingOpenAI ? "OpenAI" : "Abacus AI (RouteLLM)",
    availableModels: [
      { id: "gpt-4o", name: "GPT-4o", description: "OpenAI — rápido e muito capaz, ótimo custo-benefício" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "OpenAI — rápido e econômico, ideal para volume alto" },
      { id: "gpt-4.1", name: "GPT-4.1", description: "OpenAI — modelo mais recente, alta performance" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", description: "OpenAI — versão compacta do 4.1, rápido" },
      { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", description: "Anthropic — excelente em português e raciocínio" },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", description: "Anthropic — rápido e econômico" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Google — ultra-rápido, bom para respostas simples" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Google — alta qualidade, contexto amplo" },
      { id: "deepseek-v3", name: "DeepSeek V3", description: "DeepSeek — excelente custo-benefício" },
      { id: "llama-3.3-70B", name: "Llama 3.3 70B", description: "Meta — modelo open-weight de alta qualidade" },
    ],
  });
}

// POST - Test actual API connection by sending a simple prompt
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.ABACUSAI_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: "Chave de API n\u00e3o configurada (OPENAI_API_KEY ou ABACUSAI_API_KEY)",
    });
  }

  const body = await request.json();
  const model = body.model || "gpt-4o-mini";

  try {
    const startTime = Date.now();

    const response = await fetch(LLM_URL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Responda em portugu\u00eas. Seja breve." },
          { role: "user", content: "Diga apenas: \"Conex\u00e3o com Abacus AI funcionando!\". Nada mais." },
        ],
        max_tokens: 50,
        temperature: 0,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({
        success: false,
        error: `Erro ${response.status}: ${errText.slice(0, 200)}`,
        latencyMs: elapsed,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";
    const tokensUsed = data.usage?.total_tokens || 0;

    return NextResponse.json({
      success: true,
      model,
      reply,
      tokensUsed,
      latencyMs: elapsed,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Falha na conex\u00e3o: ${error.message || "Erro desconhecido"}`,
    });
  }
}
