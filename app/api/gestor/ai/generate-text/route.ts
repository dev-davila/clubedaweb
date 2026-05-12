export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit, RateLimitError, AuthenticationError } from "@/lib/api-utils";
import { generateAITextSchema } from "@/lib/validation-schemas";

export async function POST(request: NextRequest) {
  try {
    // Check rate limit (20 requests per minute for AI text generation)
    const ip = getClientIP(request);
    if (!checkRateLimit(`ai-text-${ip}`, 20, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar requisição
    const body = await request.json();
    const validatedData = generateAITextSchema.parse(body);
    const { prompt, context, currentValue } = validatedData;

    const systemPrompt = `Você é um assistente de redação profissional para um site corporativo de TI.
Você gera textos claros, persuasivos e profissionais em português brasileiro.

Contexto: ${context || "Página institucional"}

Texto atual (se existir): ${currentValue || "Nenhum"}

Solicitção do usuário: ${prompt}

Gere 3 opções de texto diferentes que atendam à solicitação.
Retorne APENAS um JSON válido no formato:
{"suggestions": ["texto1", "texto2", "texto3"]}

Não inclua explicações, apenas o JSON.`;

    const response = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error("Erro na API de IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch (parseError) {
      // If JSON parsing fails, return the raw content as a single suggestion
      return NextResponse.json({
        suggestions: [content.trim()]
      });
    }

    return NextResponse.json({ suggestions: [content.trim()] });
  } catch (error) {
    return handleAPIError(error);
  }
}
