/**
 * Gera conteúdo HTML de um artigo de blog a partir do título + excerpt +
 * tom do briefing. Substitui o placeholder "Conteúdo gerado pelo wizard,
 * edite pelo /gestor/posts" por um artigo real (~700-1000 palavras).
 *
 * Usado:
 * - no applyPublished (seed inicial dos 6 BlogPosts)
 * - sob demanda via /api/gestor/posts/[id]/regenerate-content
 */

import { logger } from "@/lib/logger";
import { chatCompletion, stripCodeFences } from "./llm-client";

export interface BlogContentInput {
  title: string;
  excerpt?: string | null;
  category?: string | null;
  tone?: string | null;
  companyName?: string | null;
  industry?: string | null;
}

const SYSTEM_PROMPT = `Você é editor sênior de conteúdo B2B brasileiro. Escreve artigos com voz autoral, sem chavões, sem "no mundo de hoje", sem inventar números.

REGRAS RÍGIDAS:
1. NÃO INVENTE dados, números, estatísticas, nomes de empresa, datas. Use SÓ o que for fornecido. Quando precisar de número de exemplo, use "centenas", "dezenas", etc.
2. Português brasileiro natural, ativo. Frases curtas. Sem voz passiva excessiva.
3. NÃO use jargão sem definir. NÃO use 1ª pessoa do plural ("nós") a menos que o tom peça.
4. Estrutura: lead direto (2-3 parágrafos), 3-4 seções com <h2>, fechamento prático.
5. Mínimo 700 palavras, máximo 1100.
6. Saída: SOMENTE HTML do artigo (sem <html>, <head>, <body>). Use <p>, <h2>, <ul>/<li>, <strong>, <em>, <blockquote> quando fizer sentido. Sem inline CSS.
7. NÃO inclua título principal (<h1>) — o título já está no template da página.
8. Não invente CTAs específicos da empresa. Se quiser fechar com call-to-action, use "fale com o time", "agende uma conversa".

Saída direta — sem prefácios, sem "Aqui está o artigo", sem comentários.`;

function buildUserPrompt(input: BlogContentInput): string {
  const parts: string[] = [];
  parts.push(`Título do artigo: "${input.title}"`);
  if (input.excerpt) parts.push(`Resumo / hook inicial: "${input.excerpt}"`);
  if (input.category) parts.push(`Categoria / tópico: ${input.category}`);
  if (input.companyName) parts.push(`Publicado por: ${input.companyName}`);
  if (input.industry) parts.push(`Segmento da empresa: ${input.industry}`);
  if (input.tone) parts.push(`Tom de voz: ${input.tone}`);
  parts.push("");
  parts.push("Escreva o artigo completo em HTML conforme as regras do system prompt.");
  return parts.join("\n");
}

/**
 * Gera o conteúdo de UM artigo. Retorna HTML pronto pra salvar em
 * BlogPost.content. Em caso de erro, retorna fallback simples.
 */
export async function generateBlogPostContent(input: BlogContentInput): Promise<string> {
  const fallback = `<p>${input.excerpt || input.title}</p>\n<p><em>Esse artigo está aguardando conteúdo. Edite em /gestor/posts.</em></p>`;
  try {
    const raw = await chatCompletion({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(input),
      timeoutMs: 60_000,
      temperature: 0.6,
    });
    const cleaned = stripCodeFences(raw);
    // Garante que retorna HTML útil (>200 chars de tag-content real)
    const textOnly = cleaned.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (textOnly.length < 400) {
      logger.warn(`[blog-content] retorno curto demais (${textOnly.length} chars) — usando fallback`);
      return fallback;
    }
    return cleaned;
  } catch (err) {
    logger.error("[blog-content] generation failed", String(err));
    return fallback;
  }
}

/** Gera conteúdo pra N posts em paralelo (com limite de concorrência). */
export async function generateBlogContentsBatch(
  inputs: BlogContentInput[],
  concurrency = 3,
): Promise<string[]> {
  const results: string[] = new Array(inputs.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(concurrency, inputs.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= inputs.length) return;
      results[idx] = await generateBlogPostContent(inputs[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}
