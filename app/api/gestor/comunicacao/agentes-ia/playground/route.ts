export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const LLM_URL = () =>
  process.env.OPENAI_API_KEY
    ? "https://api.openai.com/v1/chat/completions"
    : "https://routellm.abacus.ai/v1/chat/completions";
const API_KEY = () => process.env.OPENAI_API_KEY || process.env.ABACUSAI_API_KEY || "";

/**
 * POST - Test an AI agent in playground mode.
 * Sends messages directly to the LLM without WhatsApp or session management.
 * Body: { agentId, messages: [{role, content}] }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { agentId, messages } = await req.json();

    if (!agentId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "agentId e messages são obrigatórios" },
        { status: 400 }
      );
    }

    // Load agent config
    const agent = await prisma.aiAgentConfig.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });
    }

    // Build system prompt (same logic as ai-agent.ts buildSystemMessage)
    const departments = agent.departments.split(",").map((d: string) => d.trim()).filter(Boolean);
    
    const restrictionsStr = agent.restrictions
      ? `\n\n--- RESTRIÇÕES (O QUE NÃO FAZER/FALAR) ---\n${agent.restrictions}`
      : "";

    const rulesStr = agent.businessRules
      ? `\nRegras de negócio: ${agent.businessRules}`
      : "";

    const agentName = agent.name || "Assistente";
    const isFirstMessage = messages.length <= 1;

    const systemMessage = `${agent.systemPrompt}${restrictionsStr}

--- INSTRUÇÕES DO SISTEMA ---
Seu nome é "${agentName}". Você é um agente de atendimento via WhatsApp da M3Solutions.
Responda de forma profissional, simpática e objetiva.
${isFirstMessage ? `IMPORTANTE: Na primeira mensagem, apresente-se pelo seu nome ("Olá! Sou ${agentName}, ...") e pergunte como pode ajudar.` : ""}
Etapa atual: greeting
Departamento atual: não classificado
Departamentos disponíveis: ${departments.join(", ")}
${rulesStr}

RESPONDA SEMPRE em formato JSON válido com a seguinte estrutura:
{
  "reply": "sua resposta ao cliente em texto natural",
  "department": "departamento identificado (${departments.join("|")})",
  "step": "etapa atual (greeting|qualifying|collecting|handoff|resolved)",
  "metadata": {"campo": "valor extraído da conversa"},
  "shouldHandoff": false,
  "handoffReason": "",
  "shouldClose": false
}

Se o cliente pedir para falar com um humano/atendente, defina shouldHandoff=true.
Se o problema foi resolvido, defina shouldClose=true.
Sempre extraia informações úteis (nome, email, telefone, empresa, interesse) para o campo metadata.
Nunca invente informações. Se não sabe, pergunte educadamente.`;

    // Build LLM messages array
    const llmMessages = [
      { role: "system", content: systemMessage },
      ...messages,
    ];

    const startTime = Date.now();

    const response = await fetch(LLM_URL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY()}`,
      },
      body: JSON.stringify({
        model: agent.model,
        messages: llmMessages,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Playground] LLM error ${response.status}: ${errText}`);
      return NextResponse.json(
        { error: `Erro na API de IA: ${response.status}`, details: errText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    const tokensUsed = data.usage?.total_tokens || 0;
    const model = data.model || agent.model;

    // Try to parse structured JSON from the reply
    let parsed: any = null;
    let replyText = rawContent;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
        replyText = parsed.reply || rawContent;
      }
    } catch {
      // If JSON parse fails, use raw text
    }

    return NextResponse.json({
      reply: replyText,
      raw: rawContent,
      parsed,
      model,
      tokensUsed,
      latencyMs,
    });
  } catch (error: any) {
    console.error("[Playground] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
