import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { logger } from "@/lib/logger";
import { chatCompletion, stripCodeFences } from "@/lib/wizard/llm-client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  instruction: z.string().min(2).max(4000),
  html: z.string().min(50).max(500_000),
});

const SYSTEM_PROMPT = `Você é um editor especialista de páginas web em HTML. Você recebe o HTML COMPLETO de uma página publicada e uma instrução do usuário em linguagem natural. Sua tarefa é aplicar a instrução e devolver a página inteira editada.

REGRAS ABSOLUTAS:
- Devolva SOMENTE o HTML completo, do <!DOCTYPE html> (ou <html>) até </html>. Sem markdown, sem cercas de código, sem explicações antes ou depois.
- Devolva o documento INTEIRO, nunca um trecho. Não trunque, não resuma, não use comentários do tipo "resto igual".
- Preserve tudo que a instrução NÃO pediu para mudar: estrutura geral, header, footer, menus, scripts, <style>/CSS, classes, atributos e o conteúdo das outras seções.
- Se a instrução envolver JavaScript de animação (ex.: IntersectionObserver/reveal), garanta que o script esteja COMPLETO e fechado corretamente, e que nenhum conteúdo dependa de JS para ficar visível (evite deixar elementos com opacity:0 sem revelação garantida).
- Mantenha o HTML válido e renderizável. Não invente URLs de imagem quebradas: se precisar de imagem e não houver, reutilize as já presentes ou use um placeholder coerente.
- Escreva os textos em português do Brasil, no mesmo tom da página.`;

export async function POST(request: NextRequest, { params }: { params: { pageType: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = bodySchema.parse(await request.json());
    const originalLen = body.html.length;

    const user = `Instrução do usuário:\n"""${body.instruction.trim()}"""\n\nHTML atual da página (devolva a versão completa editada):\n"""\n${body.html}\n"""`;

    const raw = await chatCompletion({
      system: SYSTEM_PROMPT,
      user,
      temperature: 0.3,
      timeoutMs: 240_000,
    });

    const html = stripCodeFences(raw);

    // Validações de segurança: o LLM às vezes trunca ou devolve lixo.
    if (!/<\/html>/i.test(html) || !/<body[\s>]/i.test(html)) {
      return NextResponse.json(
        { error: "A IA devolveu um HTML incompleto (sem <body>/</html>). Tente reformular a instrução." },
        { status: 422 },
      );
    }
    // Guarda contra truncamento grosseiro: resultado muito menor que o original
    // costuma indicar que o modelo cortou a página.
    if (html.length < Math.floor(originalLen * 0.4)) {
      return NextResponse.json(
        {
          error: `A IA devolveu uma página bem menor que a original (${Math.round(html.length / 1024)}KB vs ${Math.round(originalLen / 1024)}KB) — provável truncamento. Tente uma instrução mais específica ou uma página menor.`,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ html, bytes: html.length });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    logger.error("[stitch-page:ai] error", err instanceof Error ? err.stack ?? err.message : String(err));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao editar com IA" },
      { status: 500 },
    );
  }
}
